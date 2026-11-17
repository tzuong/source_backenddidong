# Run from PowerShell with Docker Desktop running.
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
Write-Host 'Create MQTT passwords. Remember each password and use the same ones in .env / app.'
docker compose run --rm --no-deps --entrypoint mosquitto_passwd mosquitto -c /mosquitto/config/passwd backend
if ($LASTEXITCODE -ne 0) { throw 'Cannot create backend MQTT account' }
docker compose run --rm --no-deps --entrypoint mosquitto_passwd mosquitto /mosquitto/config/passwd simulator
if ($LASTEXITCODE -ne 0) { throw 'Cannot create simulator MQTT account' }
docker compose run --rm --no-deps --entrypoint mosquitto_passwd mosquitto /mosquitto/config/passwd mobile
if ($LASTEXITCODE -ne 0) { throw 'Cannot create mobile MQTT account' }
Write-Host 'Accounts created. Run docker compose up -d from broker folder.'
