# Genera el par de llaves RSA para firmar/verificar los JWT.
# Uso (desde la raíz del repo):  .\scripts\generate-jwt-keys.ps1
$ErrorActionPreference = "Continue"

$destino = Join-Path $PSScriptRoot "..\backend\src\main\resources"
if (-not (Test-Path $destino)) { throw "No existe $destino. Crea primero el proyecto Quarkus en /backend." }
$destino = (Resolve-Path $destino).Path

$openssl = (Get-Command openssl -ErrorAction SilentlyContinue).Source
if (-not $openssl) {
    $git = "C:\Program Files\Git\usr\bin\openssl.exe"
    if (Test-Path $git) { $openssl = $git }
}
if (-not $openssl) { throw "No se encontró openssl. Usa Git Bash o instala Git for Windows." }

$tmp  = Join-Path $destino "rsaPrivateKey.pem"
$priv = Join-Path $destino "privateKey.pem"
$pub  = Join-Path $destino "publicKey.pem"

& $openssl genrsa -out $tmp 2048 2>$null
& $openssl pkcs8 -topk8 -nocrypt -inform pem -in $tmp -outform pem -out $priv
& $openssl rsa -pubout -in $tmp -out $pub 2>$null
Remove-Item $tmp -ErrorAction SilentlyContinue

if ((Test-Path $priv) -and (Test-Path $pub)) {
    Write-Host "Llaves generadas en $destino (están en .gitignore, no se suben a Git)."
} else {
    Write-Host "Algo falló al generar las llaves." -ForegroundColor Red
}
