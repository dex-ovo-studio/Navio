const { createHash } = require('node:crypto')
const { readFile } = require('node:fs/promises')
const path = require('node:path')
const asar = require('@electron/asar')
const { NtExecutable, NtExecutableResource } = require('pe-library')

const hash = (value) => createHash('sha256').update(value).digest('hex')

async function verifyWindowsAsar(executable, archive) {
  const builderPath = path.dirname(require.resolve('electron-builder/package.json'))
  const builderLibPath = path.dirname(
    require.resolve('app-builder-lib/package.json', { paths: [builderPath] })
  )
  const { FuseV1Options, getCurrentFuseWire } = require(
    require.resolve('@electron/fuses', { paths: [builderLibPath] })
  )
  const fuses = await getCurrentFuseWire(executable)
  for (const key of ['EnableEmbeddedAsarIntegrityValidation', 'OnlyLoadAppFromAsar']) {
    if (fuses[FuseV1Options[key]] !== '1'.charCodeAt(0)) {
      throw new Error(`Required Electron fuse is disabled: ${key}`)
    }
  }

  const PE = NtExecutable.from(await readFile(executable), { ignoreCert: true })
  const resources = NtExecutableResource.from(PE).entries.filter(
    ({ type, id }) => type === 'INTEGRITY' && id === 'ELECTRONASAR'
  )
  if (resources.length !== 1)
    throw new Error('Expected exactly one Electron ASAR integrity resource')
  const list = JSON.parse(Buffer.from(resources[0].bin).toString('utf8'))
  if (!Array.isArray(list)) throw new Error('Invalid Electron ASAR integrity resource')
  const matches = list.filter(({ file }) => file?.replaceAll('\\', '/') === 'resources/app.asar')
  if (matches.length !== 1 || matches[0].alg !== 'SHA256') {
    throw new Error('Expected one SHA-256 record for resources/app.asar')
  }
  const header = asar.getRawHeader(archive)
  const headerSha256 = hash(header.headerString)
  if (matches[0].value !== headerSha256) {
    throw new Error('ASAR header does not match the launcher integrity resource')
  }

  let packedFilesChecked = 0
  for (const member of asar.listPackage(archive)) {
    const relative = member.replace(/^[/\\]+/, '')
    const item = asar.statFile(archive, relative, false)
    if (item.files || item.link || item.unpacked) continue
    const data = asar.extractFile(archive, relative)
    if (
      /\.(?:exe|dll|node|sys|ocx|cpl|scr)$/i.test(relative) ||
      (data[0] === 0x4d && data[1] === 0x5a)
    ) {
      throw new Error(`Native file must be unpacked for payload audit: ${relative}`)
    }
    if (item.integrity?.algorithm !== 'SHA256' || item.integrity.hash !== hash(data)) {
      throw new Error(`Packed ASAR file integrity check failed: ${relative}`)
    }
    packedFilesChecked++
  }
  if (!packedFilesChecked) throw new Error('No packed files to verify')
  return { headerSha256, packedFilesChecked, integrityFuse: true, asarOnlyFuse: true }
}

module.exports = { verifyWindowsAsar }

if (require.main === module) {
  const args = process.argv.slice(2)
  if (args.length !== 2) {
    console.error('Usage: node scripts/verify-windows-asar-integrity.cjs <launcher> <app.asar>')
    process.exitCode = 2
  } else {
    verifyWindowsAsar(...args)
      .then((evidence) => console.log(JSON.stringify(evidence, null, 2)))
      .catch((error) => {
        console.error(error.message)
        process.exitCode = 1
      })
  }
}
