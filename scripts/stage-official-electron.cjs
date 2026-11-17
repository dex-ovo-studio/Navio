const { createHash } = require('node:crypto')
const { createReadStream } = require('node:fs')
const fs = require('node:fs/promises')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const root = path.resolve(__dirname, '..')
const VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/

async function sha256(file) {
  const hash = createHash('sha256')
  for await (const bytes of createReadStream(file)) hash.update(bytes)
  return hash.digest('hex')
}

async function verifyRuntimeArchive(archive, pin, installedVersion) {
  if (
    !pin ||
    !VERSION.test(pin.version) ||
    pin.version !== installedVersion ||
    !Number.isSafeInteger(pin.bytes) ||
    pin.bytes <= 0 ||
    !/^[a-f0-9]{64}$/.test(pin.sha256) ||
    !/^[a-f0-9]{64}$/.test(pin.electronExeSha256)
  ) {
    throw new Error('Electron pin does not match the locked dependency, size, and SHA-256 schema')
  }
  const filename = `electron-v${pin.version}-win32-x64.zip`
  const expectedUrl = `https://github.com/electron/electron/releases/download/v${pin.version}/${filename}`
  if (pin.url !== expectedUrl || path.basename(archive) !== filename) {
    throw new Error('Expected the exact official Electron Windows x64 archive')
  }
  const stat = await fs.lstat(archive)
  if (!stat.isFile() || stat.size !== pin.bytes) {
    throw new Error('Electron archive is not a regular file of the pinned size')
  }
  if ((await sha256(archive)) !== pin.sha256) {
    throw new Error('Electron archive SHA-256 does not match the approved pin')
  }
}

function overlaps(a, b) {
  const inside = (from, to) => {
    const relative = path.relative(from, to)
    return (
      relative === '' ||
      (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`))
    )
  }
  return inside(a, b) || inside(b, a)
}

async function stage(archiveArg, pinArg, resourcesArg, outputArg, sourceCommit) {
  if (process.platform !== 'win32' || process.arch !== 'x64') {
    throw new Error('Staging requires a Windows x64 Node.js process')
  }
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
  if (
    !/^[a-f0-9]{40}$/.test(sourceCommit) ||
    git('rev-parse', 'HEAD') !== sourceCommit ||
    git('status', '--porcelain', '--untracked-files=no')
  ) {
    throw new Error('Expected a clean checkout of the explicitly reviewed source commit')
  }

  const archive = path.resolve(archiveArg)
  const pin = JSON.parse(await fs.readFile(pinArg, 'utf8'))
  const electron = require('electron/package.json')
  await verifyRuntimeArchive(archive, pin, electron.version)
  const resources = await fs.realpath(resourcesArg)
  if (!(await fs.stat(resources)).isDirectory()) {
    throw new Error('Approved resources must be a directory')
  }
  const outputParent = await fs.realpath(path.dirname(path.resolve(outputArg)))
  const output = path.join(outputParent, path.basename(outputArg))
  const source = await fs.realpath(root)
  if ([source, resources, await fs.realpath(archive)].some((input) => overlaps(input, output))) {
    throw new Error('Output must be separate from source, Electron archive, and approved resources')
  }
  const distribution = path.join(output, 'electron-dist')
  const payloadRoot = path.join(output, 'app')
  const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'))
  if (!VERSION.test(pkg.version) || pkg.license !== 'GPL-3.0-only') {
    throw new Error('Expected a versioned GPL-3.0-only Navio package')
  }
  const previousBuild = await fs.lstat(path.join(root, 'out')).catch((error) => {
    if (error.code !== 'ENOENT') throw error
  })
  if (previousBuild) throw new Error('Use a clean checkout without existing build output')

  // Fresh run directory ensures electron-builder finds only the verified ZIP.
  await fs.mkdir(output)
  await fs.mkdir(distribution)
  const stagedArchive = path.join(distribution, path.basename(archive))
  await fs.copyFile(archive, stagedArchive)
  await verifyRuntimeArchive(stagedArchive, pin, electron.version)

  const previous = process.env.CSC_IDENTITY_AUTO_DISCOVERY
  process.env.CSC_IDENTITY_AUTO_DISCOVERY = 'false'
  try {
    execFileSync(process.execPath, ['scripts/build-native.mjs'], { cwd: root, stdio: 'inherit' })
    const { build, Arch, Platform } = require('electron-builder')
    await build({
      projectDir: root,
      targets: Platform.WINDOWS.createTarget('dir', Arch.x64),
      publish: 'never',
      config: {
        electronVersion: pin.version,
        electronDist: distribution,
        productName: 'Navio',
        forceCodeSigning: false,
        directories: { output: payloadRoot },
        extraResources: [{ from: resources, to: '.', filter: ['**/*'] }],
        extraFiles: [{ from: root, to: '.', filter: ['LICENSE', 'DEX-THIRD-PARTY-NOTICES.txt'] }],
        // Preserve the Electron launcher upstream bytes. It is not a Navio signing target.
        win: { signAndEditExecutable: false },
        publish: []
      }
    })
  } finally {
    if (previous === undefined) delete process.env.CSC_IDENTITY_AUTO_DISCOVERY
    else process.env.CSC_IDENTITY_AUTO_DISCOVERY = previous
  }

  const payload = path.join(payloadRoot, 'win-unpacked')
  if ((await sha256(path.join(payload, 'Navio.exe'))) !== pin.electronExeSha256) {
    throw new Error('The staged launcher is not the approved upstream Electron executable')
  }
  await fs.access(path.join(payload, 'resources', 'app.asar'))
  const evidence = {
    sourceCommit,
    version: pkg.version,
    runtime: pin,
    payload: 'app/win-unpacked',
    launcher: { path: 'Navio.exe', source: 'upstream Electron', signingScope: 'exclude' },
    status: 'unpacked-staging-only; requires payload policy verification before packaging'
  }
  await fs.writeFile(
    path.join(output, 'electron-stage.json'),
    JSON.stringify(evidence, null, 2) + '\n'
  )
}

module.exports = { verifyRuntimeArchive }

if (require.main === module) {
  const args = process.argv.slice(2)
  if (args.length !== 5) {
    console.error(
      'Usage: node scripts/stage-official-electron.cjs <electron-zip> <pin.json> <approved-resource-dir> <new-output-dir> <source-commit>'
    )
    process.exitCode = 2
  } else {
    stage(...args).catch((error) => {
      console.error(error.message)
      process.exitCode = 1
    })
  }
}
