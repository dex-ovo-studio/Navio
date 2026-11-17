[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string] $PayloadDirectory,

    [Parameter(Mandatory)]
    [string] $PolicyFile,

    [Parameter(Mandatory)]
    [ValidatePattern('^[a-f0-9]{40}$')]
    [string] $SourceCommit,

    [string] $PortableZip
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Assert-RelativeFilePath([string] $RelativePath) {
    if ([string]::IsNullOrWhiteSpace($RelativePath) -or $RelativePath -match '[\\:*?"<>|\x00-\x1f]') {
        throw "Invalid payload path: $RelativePath"
    }
    foreach ($segment in $RelativePath.Split('/')) {
        if (-not $segment -or $segment -in @('.', '..') -or $segment -match '[ .]$') {
            throw "Invalid payload path: $RelativePath"
        }
    }
}

function Get-PayloadFiles([System.IO.DirectoryInfo] $Directory) {
    if ($Directory.Attributes -band [IO.FileAttributes]::ReparsePoint) {
        throw "Reparse point in payload: $($Directory.FullName)"
    }
    foreach ($item in Get-ChildItem -LiteralPath $Directory.FullName -Force) {
        if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
            throw "Reparse point in payload: $($item.FullName)"
        }
        if ($item.PSIsContainer) {
            Get-PayloadFiles $item
        } else {
            $item
        }
    }
}

function Test-NativeFile([System.IO.FileInfo] $File) {
    if ($File.Extension -in @('.exe', '.dll', '.node', '.sys', '.ocx', '.cpl', '.scr')) {
        return $true
    }
    $stream = $File.OpenRead()
    try {
        return $stream.ReadByte() -eq 0x4d -and $stream.ReadByte() -eq 0x5a
    } finally {
        $stream.Dispose()
    }
}

$root = Get-Item -LiteralPath $PayloadDirectory -Force
if (-not $root.PSIsContainer) { throw 'PayloadDirectory must be a directory' }
$policy = Get-Content -LiteralPath $PolicyFile -Raw | ConvertFrom-Json -AsHashtable
if ($policy.schemaVersion -ne 1 -or $policy.product -cne 'Navio' -or
    $policy.version -notmatch '^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$' -or
    $policy.sourceCommit -cne $SourceCommit -or @($policy.nativeFiles).Count -eq 0) {
    throw 'Expected a reviewed Navio policy with schemaVersion, version, sourceCommit, and nativeFiles'
}

$approved = @{}
foreach ($entry in $policy.nativeFiles) {
    if ($entry -isnot [System.Collections.IDictionary]) { throw 'Invalid native policy record' }
    $name = [string] $entry['path']
    Assert-RelativeFilePath $name
    if ($approved.ContainsKey($name) -or
        $entry['origin'] -cnotin @('electron-upstream', 'third-party', 'navio-built') -or
        [string]::IsNullOrWhiteSpace($entry['source']) -or
        [string]::IsNullOrWhiteSpace($entry['licenseEvidence'])) {
        throw "Invalid or duplicate native policy entry: $name"
    }
    if ($entry['origin'] -ceq 'navio-built') {
        if ($entry['sourceCommit'] -cne $policy.sourceCommit -or $entry['signingScope'] -cne 'navio-review') {
            throw "Invalid Navio source or signing scope: $name"
        }
    } elseif ($entry['sha256'] -notmatch '^[a-f0-9]{64}$' -or $entry['signingScope'] -cne 'exclude') {
        throw "Upstream file requires an approved hash and exclusion from Navio signing: $name"
    }
    $approved[$name] = $entry
}

$observed = @{}
$native = @{}
foreach ($file in Get-PayloadFiles $root) {
    $name = [IO.Path]::GetRelativePath($root.FullName, $file.FullName).Replace('\', '/')
    Assert-RelativeFilePath $name
    if ($observed.ContainsKey($name)) { throw "Duplicate payload path: $name" }
    $hash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    $observed[$name] = [ordered]@{ path = $name; bytes = $file.Length; sha256 = $hash }

    if (-not (Test-NativeFile $file)) { continue }
    if (-not $approved.ContainsKey($name)) { throw "Unreviewed native payload: $name" }
    $entry = $approved[$name]
    if ($entry['origin'] -ceq 'navio-built') {
        $versionInfo = $file.VersionInfo
        if ($versionInfo.ProductName -cne 'Navio' -or $versionInfo.ProductVersion -cne $policy.version) {
            throw "Navio product metadata mismatch: $name"
        }
    } elseif ($entry['sha256'] -cne $hash) {
        throw "Native payload hash mismatch: $name"
    }
    $native[$name] = [pscustomobject]@{
        path = $name
        sha256 = $hash
        origin = $entry['origin']
        signingScope = $entry['signingScope']
        source = $entry['source']
        licenseEvidence = $entry['licenseEvidence']
    }
}

foreach ($name in $approved.Keys) {
    if (-not $native.ContainsKey($name)) { throw "Approved native payload is missing: $name" }
}

if ($PortableZip) {
    $zip = [IO.Compression.ZipFile]::OpenRead((Get-Item -LiteralPath $PortableZip).FullName)
    $seen = @{}
    try {
        foreach ($entry in $zip.Entries) {
            $name = $entry.FullName
            if ($name.EndsWith('/')) {
                Assert-RelativeFilePath $name.TrimEnd('/')
                continue
            }
            Assert-RelativeFilePath $name
            if ($seen.ContainsKey($name) -or -not $observed.ContainsKey($name)) {
                throw "Unexpected or duplicate Portable entry: $name"
            }
            $file = $observed[$name]
            if ($file.path -cne $name -or $file.bytes -ne $entry.Length) {
                throw "Portable path or length does not match audited payload: $name"
            }
            $stream = $entry.Open()
            try {
                $hash = (Get-FileHash -InputStream $stream -Algorithm SHA256).Hash.ToLowerInvariant()
            } finally {
                $stream.Dispose()
            }
            if ($hash -cne $file.sha256) { throw "Portable SHA-256 does not match audited payload: $name" }
            $seen[$name] = $true
        }
        if ($seen.Count -ne $observed.Count) { throw 'Portable omitted audited files' }
    } finally {
        $zip.Dispose()
    }
}

[pscustomobject]@{
    sourceCommit = $policy.sourceCommit
    version = $policy.version
    payloadFiles = $observed.Count
    nativeFiles = @($native.Values | Sort-Object path)
    files = @($observed.Values | Sort-Object path)
    portableBytesMatch = [bool] $PortableZip
}
