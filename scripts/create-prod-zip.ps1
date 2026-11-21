$root = if ($PSScriptRoot) { Split-Path $PSScriptRoot -Parent } else { (Get-Location).Path }
$staging = Join-Path $root "prod-stage"
$zipPath = Join-Path $root "mystic-builder-prod.zip"

if (Test-Path $staging) {
    Remove-Item -Recurse -Force $staging
}
if (Test-Path $zipPath) {
    Remove-Item -Force $zipPath
}

Write-Host "Staging files with robocopy..."
$cacheDir = Join-Path $root ".next\cache"
robocopy (Join-Path $root ".next") (Join-Path $staging ".next") /E /XD $cacheDir /NFL /NDL /NJH /NJS | Out-Null
robocopy (Join-Path $root "public") (Join-Path $staging "public") /E /NFL /NDL /NJH /NJS | Out-Null
robocopy (Join-Path $root "prisma") (Join-Path $staging "prisma") /E /NFL /NDL /NJH /NJS | Out-Null
Copy-Item (Join-Path $root "package.json") $staging
Copy-Item (Join-Path $root "server.js") $staging
Copy-Item (Join-Path $root ".env") $staging

Write-Host "Compressing to $zipPath using tar.exe (forward-slash POSIX paths for Linux / Pterodactyl)..."
Push-Location $staging
try {
    & "C:\Windows\system32\tar.exe" -a -c -f $zipPath .next prisma public package.json server.js .env
} finally {
    Pop-Location
}

Remove-Item -Recurse -Force $staging

$zipFile = Get-Item $zipPath
$sizeMb = [math]::Round($zipFile.Length / 1MB, 2)
Write-Host "Done! Created $zipPath ($sizeMb MB)"
