import { mkdtemp, readFile, rm, writeFile } from 'fs/promises'
import path from 'path'
import { tmpdir } from 'os'
import AdmZip from 'adm-zip'
import { afterEach, expect, it } from 'vitest'
import { stagePortableUpdate, selectUpdateArtifact } from './update-package'
let root: string
afterEach(async () => {
  if (root) await rm(root, { recursive: true, force: true })
})
function archive(): AdmZip {
  const zip = new AdmZip(),
    exe = Buffer.alloc(128)
  exe.write('MZ')
  exe.writeUInt32LE(64, 60)
  exe.write('PE\0\0', 64)
  exe.writeUInt16LE(0x8664, 68)
  zip.addFile('Navio.exe', exe)
  zip.addFile('resources/app.asar', Buffer.from('app'))
  zip.addFile('PORTABLE', Buffer.alloc(0))
  return zip
}
async function stage(zip: AdmZip): Promise<void> {
  root = await mkdtemp(path.join(tmpdir(), 'navio-package-test-'))
  await writeFile(path.join(root, 'update.zip'), zip.toBuffer())
  return stagePortableUpdate(path.join(root, 'update.zip'), path.join(root, 'stage'))
}
it('extracts a valid root-level x64 package', async () => {
  await stage(archive())
  expect(await readFile(path.join(root, 'stage/resources/app.asar'), 'utf8')).toBe('app')
})
it('rejects a package containing user data', async () => {
  const zip = archive()
  zip.addFile('DEX-STUDIO-NEXT/config.yaml', Buffer.from('private'))
  await expect(stage(zip)).rejects.toThrow('不安全')
})
it('rejects a 32-bit or corrupt executable', async () => {
  const zip = archive()
  zip.updateFile('Navio.exe', Buffer.from('MZ'))
  await expect(stage(zip)).rejects.toThrow('有效')
})
it('rejects Windows device names', async () => {
  const zip = archive()
  zip.addFile('nul.txt', Buffer.from('bad'))
  await expect(stage(zip)).rejects.toThrow('不安全')
})
it('rejects an untrusted or mismatched artifact before download', () => {
  expect(() =>
    selectUpdateArtifact(
      {
        version: '1.0.0',
        notes: '',
        url: 'https://example.com/file.zip',
        sha256: '0'.repeat(64),
        size: 1
      },
      true
    )
  ).toThrow('地址')
})

it.each([true, false])('accepts the renamed official repository for portable=%s', (portable) => {
  const artifact = {
    url: `https://github.com/dex-ovo-studio/Navio/releases/download/v1.0.0-beta.7/Navio.${portable ? 'zip' : 'exe'}`,
    sha256: '0'.repeat(64),
    size: 1
  }
  expect(
    selectUpdateArtifact(
      {
        ...artifact,
        version: '1.0.0',
        notes: '',
        artifacts: { portable: artifact, installer: artifact }
      },
      portable
    )
  ).toEqual(artifact)
})
it.each(['dex-ovo-studio-fake', 'poniard-li-fake', 'another-owner'])(
  'rejects a release from untrusted owner %s',
  (owner) => {
    expect(() =>
      selectUpdateArtifact(
        {
          version: '1.0.0',
          notes: '',
          url: `https://github.com/${owner}/Navio/releases/download/v1.0.0/Navio.zip`,
          sha256: '0'.repeat(64),
          size: 1
        },
        true
      )
    ).toThrow('地址')
  }
)

it.each([true, false])(
  'canonicalizes legacy release metadata before download for portable=%s',
  (portable) => {
    const artifact = {
      url: `https://github.com/poniard-li/Navio/releases/download/v1.0.0-beta.6/Navio.${portable ? 'zip' : 'exe'}`,
      sha256: '0'.repeat(64),
      size: 1
    }
    const selected = selectUpdateArtifact(
      {
        ...artifact,
        version: '1.0.0-beta.6',
        notes: '',
        artifacts: { portable: artifact, installer: artifact }
      },
      portable
    )
    expect(selected.url).toBe(artifact.url.replace('/poniard-li/', '/dex-ovo-studio/'))
    expect(selected.sha256).toBe(artifact.sha256)
    expect(selected.size).toBe(artifact.size)
    expect(artifact.url).toContain('/poniard-li/')
  }
)
it.each([
  'https://example.com/poniard-li/Navio/releases/download/v1/Navio.zip',
  'https://github.com/poniard-li/Other/releases/download/v1/Navio.zip',
  'https://github.com/poniard-li/Navio/releases/download/v1/Navio.zip?token=test',
  'https://github.com/poniard-li/Navio/releases/download/v1/Navio.zip#fragment',
  'https://user@github.com/poniard-li/Navio/releases/download/v1/Navio.zip'
])('rejects invalid legacy metadata %s', (url) => {
  expect(() =>
    selectUpdateArtifact(
      { version: '1.0.0', notes: '', url, sha256: '0'.repeat(64), size: 1 },
      true
    )
  ).toThrow('地址')
})
