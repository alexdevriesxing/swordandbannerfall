# Installs the exact owner-commissioned artwork pack provided in this chat.
# No network, no external download, no fabricated art; checks every SHA-256.
param([string]$ZipPath = "$env:USERPROFILE\Downloads\Sword_Bannerfall_Original_Art_Pack_v1.zip")
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$lock = Get-Content -LiteralPath (Join-Path $root 'assets\generated-pack-lock.json') -Raw | ConvertFrom-Json
if (-not (Test-Path -LiteralPath $ZipPath -PathType Leaf)) {
    throw "Download the artwork ZIP from this ChatGPT conversation and save it to $ZipPath (or pass its path)."
}
$stage = Join-Path ([System.IO.Path]::GetTempPath()) ("sword-art-" + [guid]::NewGuid().ToString('N'))
New-Item -Path $stage -ItemType Directory | Out-Null
try {
    Expand-Archive -LiteralPath $ZipPath -DestinationPath $stage
    # Validate the unchanged original generation source sheets.
    foreach ($source in $lock.sourceSheets) {
        $file = Join-Path $stage ('source_sheets\' + $source.filename)
        if (-not (Test-Path -LiteralPath $file)) { throw "Missing original source sheet: $($source.filename)" }
        $hash = (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($hash -ne $source.sha256) { throw "Original source sheet checksum mismatch: $($source.filename)" }
    }
    # Validate all files and pre-existing files BEFORE the first copy.
    foreach ($entry in $lock.assets.PSObject.Properties) {
        $relative = $entry.Name
        if ($relative.StartsWith('/') -or $relative.Contains('..')) { throw "Unsafe path: $relative" }
        $original = Join-Path $stage ("public\assets\" + $relative.Replace('/','\'))
        $dest = Join-Path $root ("public\assets\" + $relative.Replace('/','\'))
        if (-not (Test-Path -LiteralPath $original)) { throw "Missing asset: $relative" }
        $actual = (Get-FileHash -LiteralPath $original -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($actual -ne $entry.Value.sha256) { throw "Art source mismatch: $relative" }
        if (Test-Path -LiteralPath $dest) {
            $existing = (Get-FileHash -LiteralPath $dest -Algorithm SHA256).Hash.ToLowerInvariant()
            if ($existing -ne $actual) { throw "Different existing artwork — refusing replacement: $relative" }
        }
    }
    $installed = 0
    foreach ($entry in $lock.assets.PSObject.Properties) {
        $relative = $entry.Name.Replace('/','\')
        $dest = Join-Path $root ("public\assets\" + $relative)
        if (-not (Test-Path -LiteralPath $dest)) {
            New-Item -Path (Split-Path -Parent $dest) -ItemType Directory -Force | Out-Null
            Copy-Item -LiteralPath (Join-Path $stage ("public\assets\" + $relative)) -Destination $dest
            $installed++
        }
    }
    Write-Host ("PASS: all " + $lock.assets.PSObject.Properties.Count + " generated art assets verified; " + $installed + " new files installed.")
    Write-Host "Official original Fire Dragon logo unchanged."
    Write-Host "Run: npm run check:release; npm test; npm run build"
    Write-Host "Then execute real Chromium gameplay testing before releasing any installer."
} finally {
    Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue
}
