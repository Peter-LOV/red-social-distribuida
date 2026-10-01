# Crea 8 usuarios de demostracion y una red de seguimiento conectada.
# Requisitos: el backend debe estar corriendo (http://localhost:8080).
# Uso (desde la raiz del repo):
#   powershell -ExecutionPolicy Bypass -File .\scripts\seed.ps1
# Es repetible: si un usuario ya existe, inicia sesion en lugar de registrarlo.

$api = "http://localhost:8080"
$nombres = "Ana", "Beto", "Carla", "Diego", "Elena", "Fabian", "Gabriela", "Hugo"
$tokens = @{}
$ids = @{}

foreach ($n in $nombres) {
    $email = "$($n.ToLower())@demo.com"
    try {
        $r = Invoke-RestMethod "$api/auth/registro" -Method Post -ContentType "application/json" `
            -Body (@{ nombre = $n; email = $email; password = "demo1234" } | ConvertTo-Json)
    } catch {
        $r = Invoke-RestMethod "$api/auth/login" -Method Post -ContentType "application/json" `
            -Body (@{ email = $email; password = "demo1234" } | ConvertTo-Json)
    }
    $tokens[$n] = $r.token
    $ids[$n] = $r.usuario.id
    Write-Host "Usuario listo: $n ($email)"
}

function Seguir($a, $b) {
    Invoke-RestMethod "$api/social/seguir/$($ids[$b])" -Method Post `
        -Headers @{ Authorization = "Bearer $($tokens[$a])" } | Out-Null
}

Seguir Ana Beto;       Seguir Ana Carla
Seguir Beto Diego;     Seguir Carla Diego;    Seguir Carla Elena
Seguir Diego Fabian;   Seguir Elena Fabian;   Seguir Fabian Gabriela
Seguir Gabriela Hugo;  Seguir Hugo Ana

Write-Host ""
Write-Host "Red creada. Todos los usuarios tienen la clave: demo1234"
Write-Host ""
Write-Host "Sugerencias para Ana (debe salir Diego con 2 en comun y Elena con 1):"
Invoke-RestMethod "$api/social/sugerencias" -Headers @{ Authorization = "Bearer $($tokens['Ana'])" } |
    Format-Table nombre, enComun, popularidad
