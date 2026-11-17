const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const root = path.resolve(__dirname, '..')
const publicDocuments = [
  'LICENSE',
  'SECURITY.md',
  'README.md',
  'DEX-THIRD-PARTY-NOTICES.txt',
  'DEX-BUILD.txt',
  'NATIVE-BUILD.txt',
  'PINNED-RESOURCES.json',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'README.en.md',
  'docs/guide.md',
  'docs/install.md',
  'docs/faq.md'
]

function isInternal(file) {
  return (
    file === 'AGENTS.md' ||
    /^Navio-(验证记录|使用说明)\.txt$/.test(file) ||
    file === 'scripts/service/IMPLEMENTATION-BOUNDARY.md' ||
    (/^(docs|design|android\/docs)\//.test(file) && !publicDocuments.includes(file))
  )
}

function checkDistribution(directory = root) {
  const git = (args) => execFileSync('git', args, { cwd: directory, encoding: 'utf8' })
  const files = git(['ls-files', '--cached', '--others', '--exclude-standard', '-z'])
    .split('\0')
    .filter(Boolean)
  const errors = []
  for (const file of files.filter(isInternal)) {
    if (!fs.existsSync(path.join(directory, file))) continue
    const result = git(['check-attr', 'export-ignore', '--', file]).trim()
    if (!result.endsWith(': set')) errors.push(`Internal source archive entry: ${file}`)
  }
  for (const file of publicDocuments) {
    if (!fs.existsSync(path.join(directory, file))) errors.push(`Missing public document: ${file}`)
    if (git(['check-attr', 'export-ignore', '--', file]).trim().endsWith(': set')) {
      errors.push(`Public document excluded from source archive: ${file}`)
    }
  }
  if (errors.length) throw new Error(errors.join('\n'))
  console.log('Distribution document boundaries passed.')
}

module.exports = { publicDocuments, isInternal, checkDistribution }
if (require.main === module) checkDistribution()
