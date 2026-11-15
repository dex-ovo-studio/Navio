const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { checkDistribution, publicDocuments } = require('./check-distribution.cjs')

test('rejects internal archive entries and missing public documents', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'navio-distribution-'))
  try {
    for (const file of [...publicDocuments, 'docs/internal.md', 'android/docs/plan.md']) {
      fs.mkdirSync(path.dirname(path.join(directory, file)), { recursive: true })
      fs.writeFileSync(path.join(directory, file), '')
    }
    execFileSync('git', ['init', '--quiet', directory])
    execFileSync('git', ['add', '.'], { cwd: directory })
    assert.throws(() => checkDistribution(directory), /Internal source archive entry/)
    fs.writeFileSync(
      path.join(directory, '.gitattributes'),
      'docs/** export-ignore\nandroid/docs/** export-ignore\ndocs/guide.md -export-ignore\n'
    )
    assert.doesNotThrow(() => checkDistribution(directory))
    fs.unlinkSync(path.join(directory, 'LICENSE'))
    assert.throws(() => checkDistribution(directory), /Missing public document: LICENSE/)
  } finally {
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()))
    fs.rmSync(directory, { recursive: true, force: true })
  }
})
