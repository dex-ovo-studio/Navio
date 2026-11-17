const { createHash } = require('node:crypto')
const { createReadStream } = require('node:fs')
const { lstat, readFile } = require('node:fs/promises')
const path = require('node:path')

async function sha256(file) {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(file)) hash.update(chunk)
  return hash.digest('hex')
}

async function verifyRelease(directory, version) {
  if (typeof version !== 'string' || !/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(version))
    throw new Error('Invalid candidate version.')

  const files = ['setup.exe', 'portable.zip'].map(
    (suffix) => `Navio-v${version}-Windows-x64-${suffix}`
  )
  const manifest = JSON.parse(await readFile(path.join(directory, 'RELEASE-MANIFEST.json'), 'utf8'))
  if (
    manifest.product !== 'Navio' ||
    manifest.version !== version ||
    manifest.architecture !== 'x64' ||
    !Array.isArray(manifest.files) ||
    manifest.files.length !== files.length
  )
    throw new Error('Release manifest does not match the Windows x64 candidate.')

  const checksums = []
  for (const name of files) {
    const file = path.join(directory, name)
    const stat = await lstat(file)
    const entry = manifest.files.find((item) => item?.name === name)
    if (!stat.isFile() || stat.size === 0 || entry?.size !== stat.size)
      throw new Error(`Release file or manifest size mismatch: ${name}`)
    const digest = await sha256(file)
    if (entry.sha256 !== digest) throw new Error(`SHA-256 mismatch: ${name}`)
    checksums.push(`${digest}  ${name}`)
  }

  const summary = await readFile(path.join(directory, 'SHA256SUMS.txt'), 'utf8')
  if (summary.replaceAll('\r\n', '\n') !== checksums.join('\n') + '\n')
    throw new Error('SHA256SUMS.txt does not match the verified files.')
}

module.exports = { verifyRelease }

if (require.main === module) {
  const directory = process.argv[2]
  const { version } = require('../package.json')
  if (process.argv.length !== 3) {
    console.error('Usage: node scripts/verify-release-windows.cjs <release directory>')
    process.exitCode = 1
  } else {
    verifyRelease(directory, version)
      .then(() => console.log(`Verified Windows x64 setup and portable SHA-256 for ${version}.`))
      .catch((error) => {
        console.error(error.message)
        process.exitCode = 1
      })
  }
}
