$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Fichier .env cree - pensez a modifier NTFY_TOPIC avant de lancer."
}

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host ""
    Write-Host "Node.js n'est pas installe." -ForegroundColor Red
    Write-Host "Installez-le depuis https://nodejs.org/ puis relancez .\run.ps1"
    exit 1
}

if (-not (Test-Path "node_modules")) {
    Write-Host "Installation des dependances..."
    npm install
}

# Charger le port depuis .env (defaut 8080)
$port = 8080
if (Test-Path ".env") {
    $envLine = Get-Content ".env" | Where-Object { $_ -match '^\s*PORT\s*=\s*(\d+)' } | Select-Object -First 1
    if ($envLine -match '=\s*(\d+)') {
        $port = [int]$Matches[1]
    }
}

# Arreter une ancienne instance qui occupe deja le port
$listeners = netstat -ano | Select-String "127\.0\.0\.1:$port\s+.*LISTENING"
foreach ($line in $listeners) {
    if ($line -match '\s+(\d+)\s*$') {
        $pid = [int]$Matches[1]
        if ($pid -gt 0) {
            Write-Host "Arret de l'ancienne instance (PID $pid) sur le port $port..." -ForegroundColor Yellow
            taskkill /PID $pid /F | Out-Null
            Start-Sleep -Seconds 1
        }
    }
}

Write-Host ""
Write-Host "Demarrage sur http://127.0.0.1:$port" -ForegroundColor Green
Write-Host "Ctrl+C pour arreter"
Write-Host ""

npm start
