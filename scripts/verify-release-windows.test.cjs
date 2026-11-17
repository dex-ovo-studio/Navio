const assert = require('node:assert/strict')
const { createHash } = require('node:crypto')
const { mkdtemp, rm, writeFile } = require('node:fs/promises')
const { tmpdir } = require('node:os')
const path = require('node:path')
const { test } = require('node:test')
const { verifyRelease } = require('./verify-release-windows.cjs')

const version = '1.2.3-rc.1'

async function candidate(t) {
  const directory = await mkdtemp(path.join(tmpdir(), 'navio-release-test-'))
  t.after(() => rm(directory, { recursive: true }))
  const files = []
  for (const suffix of ['setup.exe', 'portable.zip']) {
    const name = `Navio-v${version}-Windows-x64-${suffix}`
    const bytes = Buffer.from(suffix)
    await writeFile(path.join(directory, name), bytes)
    files.push({
      name,
      size: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex')
    })
  }
  await writeFile(
    path.join(directory, 'RELEASE-MANIFEST.json'),
    JSON.stringify({ product: 'Navio', version, architecture: 'x64', files })
  )
  await writeFile(
    path.join(directory, 'SHA256SUMS.txt'),
    files.map(({ sha256, name }) => `${sha256}  ${name}\n`).join('')
  )
  return { directory, files }
}

test('verifies a candidate and rejects a same-size modification', async (t) => {
  const { directory, files } = await candidate(t)
  await verifyRelease(directory, version)
  await writeFile(path.join(directory, files[0].name), Buffer.alloc(files[0].size))
  await assert.rejects(verifyRelease(directory, version), /SHA-256 mismatch/)
})

test('checks the public checksum list against the actual files', async (t) => {
  const { directory } = await candidate(t)
  await writeFile(path.join(directory, 'SHA256SUMS.txt'), '')
  await assert.rejects(verifyRelease(directory, version), /SHA256SUMS.txt does not match/)
})
