const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { spawn } = require('node:child_process')
const asar = require('@electron/asar')
const { build, Arch, Platform } = require('electron-builder')
const { verifyRuntimeArchive } = require('./stage-official-electron.cjs')
const { verifyWindowsAsar } = require('./verify-windows-asar-integrity.cjs')

const fixtureEntry = [
  "const { app } = require('electron')",
  "const { writeFileSync } = require('node:fs')",
  "app.whenReady().then(() => { writeFileSync(process.env.NAVIO_ASAR_MARKER, 'loaded'); app.exit(0) })"
].join('\n')

const emptyLockfile = [
  "lockfileVersion: '9.0'",
  'settings:',
  '  autoInstallPeers: true',
  '  excludeLinksFromLockfile: false',
  'importers:',
  '  .: {}',
  ''
].join('\n')

function launch(executable, workspace, mode) {
  const profile = path.join(workspace, 'profiles', mode)
  const marker = path.join(workspace, `${mode}.txt`)
  fs.mkdirSync(profile, { recursive: true })
  const env = {
    ...process.env,
    NAVIO_ASAR_MARKER: marker,
    APPDATA: profile,
    LOCALAPPDATA: profile,
    ELECTRON_ENABLE_LOGGING: '1'
  }
  delete env.ELECTRON_RUN_AS_NODE
  delete env.ELECTRON_NO_ASAR

  return new Promise((resolve, reject) => {
    const child = spawn(
      executable,
      [
        `--user-data-dir=${profile}`,
        '--disable-background-networking',
        '--disable-crash-reporter',
        '--enable-logging=stderr'
      ],
      {
        cwd: path.dirname(executable),
        windowsHide: true,
        env,
        stdio: ['ignore', 'pipe', 'pipe']
      }
    )
    let diagnostics = ''
    let timedOut = false
    for (const stream of [child.stdout, child.stderr]) {
      stream.on('data', (chunk) => {
        diagnostics = (diagnostics + chunk.toString('utf8')).slice(-8192)
      })
    }
    const timeout = setTimeout(() => {
      timedOut = true
      child.kill()
    }, 15_000)
    child.on('error', (error) => {
      clearTimeout(timeout)
      reject(error)
    })
    child.on('close', (code, signal) => {
      clearTimeout(timeout)
      resolve({ mode, code, signal, timedOut, entryRan: fs.existsSync(marker), diagnostics })
    })
  })
}

function corruptHeader(archive) {
  const header = asar.getRawHeader(archive)
  const index = Buffer.from(header.headerString).indexOf(Buffer.from('"files"'))
  assert.ok(index >= 0, 'Expected a JSON files key')
  const file = fs.openSync(archive, 'r+')
  try {
    // The header string begins after the two Pickle headers and their size fields.
    const offset = 16 + index + 1
    const byte = Buffer.alloc(1)
    assert.equal(fs.readSync(file, byte, 0, 1, offset), 1)
    byte[0] ^= 1
    fs.writeSync(file, byte, 0, 1, offset)
  } finally {
    fs.closeSync(file)
  }
}

async function run(archive, pinFile, workspaceArg) {
  if (process.platform !== 'win32' || process.arch !== 'x64') {
    throw new Error('This fixture requires Windows x64')
  }
  const pin = JSON.parse(fs.readFileSync(pinFile, 'utf8'))
  const sourcePackage = require('../package.json')
  const installed = require('electron/package.json').version
  await verifyRuntimeArchive(archive, pin, installed)

  const workspace = path.resolve(workspaceArg)
  const fixture = path.join(workspace, 'fixture')
  const output = path.join(workspace, 'output')
  const runtime = path.join(workspace, 'runtime')
  fs.mkdirSync(workspace)
  fs.mkdirSync(fixture)
  fs.mkdirSync(runtime)
  const runtimeArchive = path.join(runtime, path.basename(archive))
  fs.copyFileSync(archive, runtimeArchive, fs.constants.COPYFILE_EXCL)
  await verifyRuntimeArchive(runtimeArchive, pin, installed)

  const fixturePackage = JSON.stringify({
    name: 'asar-loader-fixture',
    productName: 'AsarLoaderFixture',
    description: 'Inert fixture for checking the Electron ASAR loader',
    author: 'Navio contributors',
    version: '1.0.0',
    main: 'main.cjs',
    packageManager: sourcePackage.packageManager
  })
  fs.writeFileSync(path.join(fixture, 'package.json'), fixturePackage)
  fs.writeFileSync(path.join(fixture, 'main.cjs'), fixtureEntry)
  fs.writeFileSync(path.join(fixture, 'pnpm-lock.yaml'), emptyLockfile)
  process.env.CSC_IDENTITY_AUTO_DISCOVERY = 'false'
  await build({
    projectDir: fixture,
    targets: Platform.WINDOWS.createTarget('dir', Arch.x64),
    publish: 'never',
    config: {
      appId: 'local.navio.asar.fixture',
      productName: 'AsarLoaderFixture',
      electronVersion: pin.version,
      electronDist: runtime,
      directories: { output },
      npmRebuild: false,
      forceCodeSigning: false,
      files: ['package.json', 'main.cjs'],
      electronFuses: {
        enableEmbeddedAsarIntegrityValidation: true,
        onlyLoadAppFromAsar: true
      },
      win: { signAndEditExecutable: false, signExecutable: false }
    }
  })

  const unpacked = path.join(output, 'win-unpacked')
  const executable = path.join(unpacked, 'AsarLoaderFixture.exe')
  const resources = path.join(unpacked, 'resources')
  const packaged = path.join(resources, 'app.asar')
  const integrity = await verifyWindowsAsar(executable, packaged)
  const intact = await launch(executable, workspace, 'intact')
  assert.equal(intact.code, 0, 'Intact fixture must run')
  assert.equal(intact.entryRan, true, 'Intact fixture must execute its inert entry')

  const saved = path.join(workspace, 'intact-app.asar')
  fs.copyFileSync(packaged, saved, fs.constants.COPYFILE_EXCL)
  corruptHeader(packaged)
  const tampered = await launch(executable, workspace, 'tampered')
  assert.equal(tampered.timedOut, false)
  assert.equal(tampered.entryRan, false, 'Tampered fixture must not execute its entry')
  assert.notEqual(tampered.code, 0)

  fs.renameSync(packaged, path.join(workspace, 'tampered-app.asar'))
  const fallback = path.join(resources, 'app')
  fs.mkdirSync(fallback)
  fs.writeFileSync(path.join(fallback, 'package.json'), fixturePackage)
  fs.writeFileSync(path.join(fallback, 'main.cjs'), fixtureEntry)
  const unarchived = await launch(executable, workspace, 'unarchived-fallback')
  assert.equal(unarchived.timedOut, false)
  assert.equal(unarchived.entryRan, false, 'ASAR-only loader must not use the directory fallback')
  assert.notEqual(unarchived.code, 0)
  fs.copyFileSync(saved, packaged, fs.constants.COPYFILE_EXCL)

  const report = {
    scope: 'Inert Electron runtime fixture; no product executable or installation package',
    runtime: pin,
    integrity,
    results: [intact, tampered, unarchived]
  }
  fs.writeFileSync(path.join(workspace, 'runtime-readback.json'), JSON.stringify(report, null, 2))
  console.log(
    JSON.stringify(report.results.map(({ mode, code, entryRan }) => ({ mode, code, entryRan })))
  )
}

const args = process.argv.slice(2)
if (args.length !== 3) {
  console.error(
    'Usage: node scripts/test-windows-asar-runtime.cjs <official-electron-zip> <pin.json> <new-workdir>'
  )
  process.exitCode = 2
} else {
  run(...args).catch((error) => {
    console.error(error)
    process.exitCode = 1
    process.on('exit', () => {
      process.exitCode = 1
    })
  })
}
