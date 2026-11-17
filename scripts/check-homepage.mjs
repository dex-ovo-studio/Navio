#!/usr/bin/env node
// Offline README guard. Node built-ins only; no requests, writes, dependencies or browser claims.
// Run: node scripts/check-homepage.mjs [--self-test]
import assert from 'node:assert/strict'
import { readFile, readdir, realpath, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const RELEASES = 'https://github.com/dex-ovo-studio/Navio/releases'
const REPO = 'https://github.com/dex-ovo-studio/Navio'
const XML_NAME = '[A-Za-z_][A-Za-z0-9_.:-]*'
const TAG = /<(?:[^<>"']|"[^"]*"|'[^']*')*>/g
const fail = (code, message) => {
  throw new Error(`${code}: ${message}`)
}

function entities(value) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, key) => {
    if (key[0] !== '#')
      return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[key.toLowerCase()]
    const point =
      key[1].toLowerCase() === 'x' ? Number.parseInt(key.slice(2), 16) : Number(key.slice(1))
    if (
      !Number.isInteger(point) ||
      point === 0 ||
      point > 0x10ffff ||
      (point >= 0xd800 && point <= 0xdfff)
    )
      fail('ENTITY', 'Invalid character reference')
    return String.fromCodePoint(point)
  })
}

function attributes(source, xml = false) {
  const result = new Map()
  let rest = source
  while (rest.trim()) {
    const match = new RegExp(
      `^\\s+(${XML_NAME})(?:\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\x60]+)))?`
    ).exec(rest)
    if (!match || (xml && match[2] === undefined && match[3] === undefined))
      fail('ATTRIBUTES', 'Malformed or unquoted XML attribute')
    const key = match[1].toLowerCase()
    if (result.has(key)) fail('ATTRIBUTES', `Duplicate attribute ${key}`)
    result.set(key, entities(match[2] ?? match[3] ?? match[4] ?? ''))
    rest = rest.slice(match[0].length)
  }
  return result
}

function srcset(value) {
  return value.split(',').map((entry) => {
    const match = /^\s*(\S+?)(?:\s+(?:[1-9]\d*w|(?:\d+(?:\.\d+)?|\.\d+)x))?\s*$/.exec(entry)
    if (!match) fail('SRCSET', 'Unsupported or empty srcset candidate')
    return match[1]
  })
}

function renderedMarkdown(markdown) {
  return markdown
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^([ \t]*)(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\2[ \t]*$/gm, '')
}

function imageReferences(markdown) {
  const text = renderedMarkdown(markdown),
    references = [],
    definitions = new Map()
  for (const match of text.matchAll(/^\s{0,3}\[([^\]]+)\]:\s*(?:<([^>]+)>|(\S+))/gm))
    definitions.set(match[1].trim().toLowerCase(), match[2] ?? match[3])
  for (const match of text.matchAll(TAG)) {
    const tag = /^<(img|source)\b([\s\S]*?)\/?\s*>$/i.exec(match[0])
    if (!tag) continue
    const attrs = attributes(tag[2].replace(/\/$/, ''))
    if (tag[1].toLowerCase() === 'img' && !attrs.has('src')) fail('IMAGE', 'img is missing src')
    if (attrs.has('src')) references.push(attrs.get('src'))
    if (attrs.has('srcset')) references.push(...srcset(attrs.get('srcset')))
  }
  for (const match of text.matchAll(
    /!\[([^\]]*)\](?:\(\s*(?:<([^>]+)>|([^\s)]+))(?:\s+["'][^\n]*?["'])?\s*\)|\[([^\]]*)\])?/g
  )) {
    if (match[2] || match[3]) references.push(entities(match[2] ?? match[3]))
    else {
      const label = (match[4] || match[1]).trim().toLowerCase()
      if (!definitions.has(label)) fail('IMAGE_REFERENCE', `Unresolved image reference ${label}`)
      references.push(entities(definitions.get(label)))
    }
  }
  return [...new Set(references)]
}

function inside(root, candidate) {
  const relative = path.relative(root, candidate)
  return (
    relative !== '' &&
    !path.isAbsolute(relative) &&
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`)
  )
}

function localImagePath(reference, root = ROOT) {
  // Remote badges are reported as unverified, never fetched. Only HTTPS is permitted.
  if (/^https:\/\//i.test(reference)) {
    const url = new URL(reference)
    if (url.username || url.password || /[\u0000-\u0020\\]/.test(reference))
      fail('IMAGE_URL', 'Ambiguous remote image URL')
    return null
  }
  let decoded
  try {
    decoded = decodeURIComponent(reference)
  } catch {
    fail('IMAGE_PATH', 'Invalid percent encoding')
  }
  if (
    !decoded ||
    /[\u0000-\u001f\u007f\\:%?#]/.test(decoded) ||
    decoded.startsWith('/') ||
    decoded.split('/').some((part) => part === '..')
  )
    fail('IMAGE_PATH', `Unsafe local image path ${reference}`)
  const absolute = path.resolve(root, decoded)
  if (!inside(root, absolute)) fail('IMAGE_PATH', `Image escapes repository ${reference}`)
  return absolute
}

function inspectCss(value) {
  const css = value.replace(/\/\*[\s\S]*?\*\//g, '')
  if (
    /[\\\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(css) ||
    /@\s*(?:import|font-face)|(?:expression|(?:-webkit-)?image-set|image|src|paint)\s*\(|(?:javascript|data|https?|file)\s*:/i.test(
      css
    )
  )
    fail('SVG_CSS', 'External or active CSS is forbidden')
  const withoutInternalUrls = css.replace(
    /url\(\s*(?:"#[A-Za-z_][\w:.-]*"|'#[A-Za-z_][\w:.-]*'|#[A-Za-z_][\w:.-]*)\s*\)/gi,
    ''
  )
  if (/url\s*\(/i.test(withoutInternalUrls))
    fail('SVG_URL', 'Only local fragment url(#id) references are allowed')
}

function inspectSvg(svg) {
  const clean = svg.replace(/<!--[\s\S]*?-->/g, '').replace(/^\uFEFF?\s*<\?xml\s+[^?]*\?>/i, '')
  if (/<!|<\?/.test(clean))
    fail('SVG_DECLARATION', 'DOCTYPE, entities, CDATA and processing instructions are forbidden')
  if (/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-f]+;)/i.test(clean))
    fail('SVG_ENTITY', 'Unknown entity')
  const stack = [],
    elements = [],
    ids = new Set()
  let end = 0,
    rootCount = 0
  for (const match of clean.matchAll(TAG)) {
    const between = clean.slice(end, match.index)
    if (/[<>]/.test(between) || (!stack.length && between.trim()))
      fail('SVG_XML', 'Malformed SVG markup')
    end = match.index + match[0].length
    const closing = new RegExp(`^<\\/(${XML_NAME})\\s*>$`).exec(match[0])
    if (closing) {
      if (stack.pop() !== closing[1]) fail('SVG_XML', 'Mismatched closing tag')
      continue
    }
    const open = new RegExp(`^<(${XML_NAME})([\\s\\S]*?)(\\/?)>$`).exec(match[0])
    if (!open) fail('SVG_XML', 'Malformed opening tag')
    const name = open[1].toLowerCase(),
      localName = name.split(':').at(-1),
      attrs = attributes(open[2], true)
    if (!stack.length && (++rootCount !== 1 || name !== 'svg'))
      fail('SVG_XML', 'Exactly one SVG root is required')
    if (
      [
        'script',
        'foreignobject',
        'iframe',
        'object',
        'embed',
        'animate',
        'animatemotion',
        'animatetransform',
        'set'
      ].includes(localName)
    )
      fail('SVG_ACTIVE', `Forbidden SVG element ${name}`)
    for (const [key, value] of attrs) {
      if (/^on/i.test(key) || key === 'xml:base') fail('SVG_ACTIVE', `Forbidden attribute ${key}`)
      if (
        (key === 'href' || key === 'xlink:href' || key === 'src') &&
        !/^#[A-Za-z_][\w:.-]*$/.test(value)
      )
        fail('SVG_REFERENCE', 'External image, link or resource is forbidden')
      if (key === 'xmlns' && value !== 'http://www.w3.org/2000/svg')
        fail('SVG_NAMESPACE', 'Unexpected namespace')
      if (
        key.startsWith('xmlns:') &&
        !(key === 'xmlns:xlink' && value === 'http://www.w3.org/1999/xlink')
      )
        fail('SVG_NAMESPACE', 'Unexpected namespace alias')
      if (!key.startsWith('xmlns')) inspectCss(value)
    }
    if (attrs.has('id')) {
      if (ids.has(attrs.get('id'))) fail('SVG_ID', 'Duplicate SVG ID')
      ids.add(attrs.get('id'))
    }
    elements.push({ name: localName, attrs, index: match.index })
    if (!open[3]) stack.push(open[1])
  }
  if (stack.length || rootCount !== 1 || clean.slice(end).trim())
    fail('SVG_XML', 'Unclosed or missing SVG')
  for (const match of clean.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi))
    inspectCss(entities(match[1]))
  return { elements, clean }
}

function readmePolicy(markdown) {
  const text = renderedMarkdown(markdown),
    failures = []
  const plain = entities(text.replace(/<[^>]+>/g, ' ').replace(/[*_`]/g, ''))
  if (
    !/^#{1,6}\s+English\s*#*\s*$/im.test(text) &&
    !/<(?:a|h[1-6])\b[^>]*(?:id|name)=["']english["']/i.test(text)
  )
    failures.push('ENGLISH_ANCHOR: Missing #english destination')
  if (
    !/\[[^\]]*English[^\]]*\]\(#english\)/i.test(text) &&
    !/<a\b[^>]*href=["']#english["']/i.test(text)
  )
    failures.push('ENGLISH_LINK: Missing same-page English entry')
  const links = [...text.matchAll(/(?<!!)\[([^\]\n]+)\]\(\s*(?:<([^>]+)>|([^\s)]+))\s*\)/g)].map(
    (match) => ({ label: match[1], href: entities(match[2] ?? match[3]) })
  )
  const definitions = new Map(
    [...text.matchAll(/^\s{0,3}\[([^\]]+)\]:\s*(?:<([^>]+)>|(\S+))/gm)].map((match) => [
      match[1].trim().toLowerCase(),
      entities(match[2] ?? match[3])
    ])
  )
  for (const match of text.matchAll(/(?<!!)\[([^\]\n]+)\](?:\[([^\]\n]*)\])?(?!\(|:)/g)) {
    const label = (match[2] || match[1]).trim().toLowerCase()
    if (definitions.has(label)) links.push({ label: match[1], href: definitions.get(label) })
    else if (match[2] !== undefined && /下载|downloads?|releases?/i.test(match[1]))
      failures.push('DOWNLOAD_REFERENCE: Unresolved reference-style download entry')
  }
  for (const match of text.matchAll(/<a\b([^>]+)>([\s\S]*?)<\/a>/gi)) {
    const attrs = attributes(match[1])
    if (attrs.has('href'))
      links.push({ label: match[2].replace(/<[^>]+>/g, ''), href: attrs.get('href') })
  }
  const downloads = links.filter(({ label }) =>
    /下载|downloads?|published releases|release index|打开\s*GitHub Releases/i.test(label)
  )
  if (!downloads.length || downloads.some(({ href }) => href !== RELEASES))
    failures.push('DOWNLOAD_INDEX: All download entries must target the public releases index')
  for (const { href } of links) {
    if (/\/releases\/(?:download|tag)\/[^/?#]*(?:rc[.\-_]?[45]|1\.0\.0(?:\/|$))/i.test(href))
      failures.push('UNRELEASED_LINK: No RC4/RC5 or 1.0.0 stable download/tag claims')
  }
  if (
    !/\bGPL-3\.0(?:-only)?\b/i.test(plain) ||
    !links.some(({ href }) => href === `${REPO}/blob/main/LICENSE`)
  )
    failures.push('GPL: Keep the GPL license statement and license link')
  if (
    !/Clash Party/.test(plain) ||
    !links.some(({ href }) => href === 'https://github.com/mihomo-party-org/clash-party') ||
    !/Mihomo/.test(plain) ||
    !links.some(({ href }) => href === 'https://github.com/MetaCubeX/mihomo')
  )
    failures.push('UPSTREAM: Keep both Clash Party and Mihomo attribution links')
  if (
    !links.some(({ href }) => href === `${REPO}/blob/main/DEX-THIRD-PARTY-NOTICES.txt`) ||
    !links.some(({ href }) => href === `${REPO}/tree/main`)
  )
    failures.push('SOURCE_NOTICES: Keep source and third-party notices links')
  if (
    !/Beta\s*7[^\n]{0,140}(?:代理[^\n]{0,40}(?:未|无法|不能|失败)|(?:未|无法|不能|失败)[^\n]{0,40}代理)/i.test(
      plain
    )
  )
    failures.push('BETA7_ZH: Keep the Chinese proxy-restoration warning')
  if (
    !/Beta\s*7[^\n]{0,180}(?:proxy[^\n]{0,70}(?:not|fail)|(?:not|fail)[^\n]{0,70}proxy)/i.test(
      plain
    )
  )
    failures.push('BETA7_EN: Keep the English proxy-restoration warning')
  // Narrow wording guard, not a general natural-language or publication-status verifier.
  // Strip explicit negative availability phrases BEFORE looking for affirmative claims.
  for (const sentence of plain.split(/\n|[。!?]|(?<!\d)\.(?:\s|$)/)) {
    if (!/\brc\s*[.\-_]?\s*[45]\b|1\.0\s*Stable/i.test(sentence)) continue
    const affirmative = sentence
      .replace(
        /(?:尚未|并未|未曾|未|尚不|不可|不应视为|不能|不提供|不链接)(?:正式|公开|视为|可供|可|这些版本的|尚未发布的|\s)*(?:发布|下载|安装包|构建)/g,
        ''
      )
      .replace(
        /\bunreleased\b|\bnot\s+(?:yet\s+)?(?:publicly\s+)?(?:available(?:\s+for\s+download)?|released|published|downloadable)\b/gi,
        ''
      )
      .replace(/\b(?:does|do)\s+not\s+(?:provide|link\s+to)\s+(?:these\s+)?installers\b/gi, '')
    if (
      /(?:现已|已经|已|正式|可供?|立即|现在|马上|开放)(?:正式|公开)?(?:发布|下载)|\b(?:available|released|published|downloadable)\b|\bdownload\s+(?:now|rc\s*[45])\b/i.test(
        affirmative
      )
    )
      failures.push(
        `UNRELEASED_CLAIM: Review affirmative availability wording: ${sentence.trim().slice(0, 180)}`
      )
  }
  return failures
}

function mobileMetrics(svg) {
  const { elements } = inspectSvg(svg),
    root = elements[0],
    viewBox = root.attrs
      .get('viewbox')
      ?.trim()
      .split(/[\s,]+/)
      .map(Number)
  if (
    !viewBox ||
    viewBox.length !== 4 ||
    !viewBox.every(Number.isFinite) ||
    viewBox[2] <= 0 ||
    viewBox[3] <= 0
  )
    fail('MOBILE_VIEWBOX', 'Expected a positive numeric mobile viewBox')
  const sizes = elements
    .filter(({ name }) => name === 'text' || name === 'tspan')
    .map(({ attrs }) => attrs.get('font-size'))
    .filter(Boolean)
  const numerical = sizes
    .filter((value) => /^\d+(?:\.\d+)?(?:px)?$/.test(value))
    .map(Number.parseFloat)
  return {
    viewBoxWidth: viewBox[2],
    scaleAt320: +(320 / viewBox[2]).toFixed(4),
    explicitFontSizes: [...new Set(numerical)]
      .sort((a, b) => a - b)
      .map((size) => ({ svg: size, estimatedCssPxAt320: +((size * 320) / viewBox[2]).toFixed(2) })),
    caveat:
      'Static full-width 320px estimate only; excludes container padding, transforms, inheritance, CSS and text wrapping. No browser/device readability test performed.'
  }
}

async function verifyFile(absolute) {
  const resolved = await realpath(absolute),
    root = await realpath(ROOT)
  if (!inside(root, resolved)) fail('REALPATH', 'Symlink/junction escapes repository')
  if (!(await stat(resolved)).isFile()) fail('IMAGE_FILE', 'Expected a regular image file')
  return resolved
}

async function svgFiles(directory) {
  const found = []
  let entries
  try {
    entries = await readdir(directory, { withFileTypes: true })
  } catch (error) {
    if (error.code === 'ENOENT') return found
    throw error
  }
  for (const entry of entries) {
    const filename = path.join(directory, entry.name)
    if (entry.isSymbolicLink())
      fail('ASSET_LINK', 'Symlinks/junctions are not allowed in homepage assets')
    if (entry.isDirectory()) found.push(...(await svgFiles(filename)))
    else if (/\.svg$/i.test(entry.name)) found.push(filename)
  }
  return found
}

async function run() {
  const markdown = await readFile(path.join(ROOT, 'README.md'), 'utf8'),
    errors = readmePolicy(markdown),
    local = [],
    remote = [],
    svgs = new Set()
  for (const reference of imageReferences(markdown)) {
    try {
      const filename = localImagePath(reference)
      if (!filename) {
        remote.push(reference)
        continue
      }
      const verified = await verifyFile(filename)
      local.push(reference)
      if (/\.svg$/i.test(verified)) svgs.add(verified)
    } catch (error) {
      errors.push(`${reference}: ${error.message}`)
    }
  }
  for (const filename of await svgFiles(path.join(ROOT, '.github', 'assets')))
    svgs.add(await verifyFile(filename))
  const mobile = []
  for (const filename of [...svgs].sort()) {
    try {
      const svg = await readFile(filename, 'utf8')
      inspectSvg(svg)
      if (/mobile/i.test(path.basename(filename)))
        mobile.push({
          file: path.relative(ROOT, filename).split(path.sep).join('/'),
          ...mobileMetrics(svg)
        })
    } catch (error) {
      errors.push(`${path.relative(ROOT, filename)}: ${error.message}`)
    }
  }
  const report = {
    status: errors.length ? 'FAIL' : 'PASS',
    mode: 'offline-static',
    localImages: local,
    remoteImagesNotFetched: remote,
    svgFilesChecked: svgs.size,
    mobile,
    errors,
    limitations: [
      'No network: release availability and remote links are not verified.',
      'No browser/device rendering or accessibility certification.',
      'Availability wording checks are conservative heuristics, not proof of publishing status.'
    ]
  }
  console.log(JSON.stringify(report, null, 2))
  if (errors.length) process.exitCode = 1
}

function selfTest() {
  let count = 0
  const test = (name, fn) => {
    fn()
    count++
    console.log(`PASS ${name}`)
  }
  const svg = (body) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">${body}</svg>`
  test('safe SVG fragment paint', () =>
    inspectSvg(svg('<defs><linearGradient id="safe"/></defs><rect fill="url(#safe)"/>')))
  for (const [name, body] of [
    ['script', '<script>alert(1)</script>'],
    ['foreignObject', '<foreignObject/>'],
    ['handler', '<rect onload="x"/>'],
    ['remote image', '<image href="https://example.com/a.png"/>'],
    ['encoded external image', '<image href="&#104;ttps://example.com/a.png"/>'],
    ['external CSS url', '<rect fill="url(https://example.com/a.svg)"/>'],
    ['CSS escape', '<style>rect{fill:u\\72l(https://example.com)}</style>'],
    ['CSS comment URL', '<style>rect{fill:u/**/rl(https://example.com)}</style>'],
    ['CSS import', '<style>@import "https://example.com";</style>'],
    ['CSS relative image-set', '<style>rect{fill:image-set("remote.svg" 1x)}</style>'],
    ['relative image', '<image href="outside.svg"/>'],
    ['xlink', '<image xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="//example.com/a"/>'],
    ['event animation', '<set attributeName="href" to="https://example.com"/>'],
    ['duplicate attr', '<rect id="a" id="b"/>'],
    ['mismatched tag', '<g></rect>'],
    ['XML entity', '<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///secret">]>']
  ])
    test(`reject ${name}`, () => assert.throws(() => inspectSvg(svg(body))))
  test('reject stylesheet PI', () =>
    assert.throws(() => inspectSvg('<?xml-stylesheet href="https://example.com"?>' + svg(''))))
  test('safe relative path', () =>
    assert.equal(localImagePath('.github/assets/a.svg'), path.join(ROOT, '.github/assets/a.svg')))
  for (const input of [
    '../a.svg',
    '%2e%2e/a.svg',
    'assets/../../a.svg',
    '/a.svg',
    'C:/a.svg',
    '\\server\\a.svg',
    '.github%5c..%5ca.svg',
    'data:image/svg+xml,test',
    '.github/a.svg%00',
    '%252e%252e/a.svg'
  ])
    test(`reject path ${input}`, () => assert.throws(() => localImagePath(input)))
  test('remote HTTPS not fetched', () =>
    assert.equal(localImagePath('https://img.shields.io/a.svg'), null))
  test('srcset collects every candidate', () =>
    assert.deepEqual(srcset('a.svg 1x, b.svg 2x'), ['a.svg', 'b.svg']))
  test('img/source/Markdown references', () =>
    assert.deepEqual(
      imageReferences(
        '<source srcset="a.svg 1x, b.svg 2x"><img src="c.svg">\n![d](d.svg)\n![e][asset]\n[asset]: e.svg'
      ),
      ['a.svg', 'b.svg', 'c.svg', 'd.svg', 'e.svg']
    ))
  test('unresolved Markdown image fails', () =>
    assert.throws(() => imageReferences('![missing][asset]')))
  test('negative RC warning does not claim download', () =>
    assert.equal(
      readmePolicy(
        '未正式发布的 RC4、RC5、1.0 Stable 不可下载。\nRC4、RC5 等未正式发布的版本，不应视为可下载版本。\nUnreleased RC4, RC5 and 1.0 Stable builds are not available.'
      ).filter((e) => e.startsWith('UNRELEASED_CLAIM')).length,
      0
    ))
  for (const claim of [
    'RC4 已正式发布，可下载。',
    'RC5 is now available for download.',
    'Download RC4 now.',
    'RC4 is available but RC5 is not available.'
  ])
    test(`reject claim ${claim}`, () =>
      assert.ok(readmePolicy(claim).some((e) => e.startsWith('UNRELEASED_CLAIM'))))
  test('download primary cannot pin an installer', () =>
    assert.ok(
      readmePolicy(`[下载](${RELEASES}/download/v1.0.0-beta.7/Navio.exe)`).some((e) =>
        e.startsWith('DOWNLOAD_INDEX')
      )
    ))
  test('reference download cannot pin an installer', () =>
    assert.ok(
      readmePolicy(`[下载][pkg]\n[pkg]: ${RELEASES}/download/v1.0.0-beta.7/Navio.exe`).some((e) =>
        e.startsWith('DOWNLOAD_INDEX')
      )
    ))
  test('reference download index is allowed', () =>
    assert.ok(
      !readmePolicy(`[Downloads][index]\n[index]: ${RELEASES}`).some((e) =>
        e.startsWith('DOWNLOAD_')
      )
    ))
  test('unresolved reference download fails', () =>
    assert.ok(
      readmePolicy(`[Downloads][missing]\n[下载](${RELEASES})`).some((e) =>
        e.startsWith('DOWNLOAD_REFERENCE')
      )
    ))
  test('English destination is required', () =>
    assert.ok(readmePolicy('[English](#english)').some((e) => e.startsWith('ENGLISH_ANCHOR'))))
  test('mobile scale is explicit estimate', () =>
    assert.equal(
      mobileMetrics(svg('<text font-size="20">x</text>')).explicitFontSizes[0].estimatedCssPxAt320,
      16
    ))
  console.log(
    `Self-tests: ${count}/${count} passed. In-memory only; no browser/network/filesystem mutations.`
  )
}

if (process.argv[2] === '--self-test' && process.argv.length === 3) selfTest()
else if (process.argv.length === 2)
  await run().catch((error) => {
    console.error(`FAIL ${error.message}`)
    process.exitCode = 1
  })
else {
  console.error('Usage: node scripts/check-homepage.mjs [--self-test]')
  process.exitCode = 2
}
