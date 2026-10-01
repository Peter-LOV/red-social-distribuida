# Crea publicaciones de demostracion para probar el feed.
# Requisitos: backend corriendo y haber ejecutado antes scripts\seed.ps1 (usuarios y red de seguimiento).
# Uso (desde la raiz del repo):
#   powershell -ExecutionPolicy Bypass -File .\scripts\seed-posts.ps1
# Nota: no es idempotente, cada ejecucion agrega posts nuevos.

$api = "http://localhost:8080"

function Token($nombre) {
    $r = Invoke-RestMethod "$api/auth/login" -Method Post -ContentType "application/json" `
        -Body (@{ email = "$($nombre.ToLower())@demo.com"; password = "demo1234" } | ConvertTo-Json)
    return $r.token
}

function Publicar($nombre, $texto) {
    $t = Token $nombre
    # curl.exe viene con Windows 10+ y soporta multipart
    curl.exe -s -X POST "$api/posts" -H "Authorization: Bearer $t" -F "texto=$texto" | Out-Null
    Write-Host "Publicado por ${nombre}: $texto"
}

Publicar "Beto"   "Primer dia probando la red social distribuida."
Publicar "Carla"  "Neo4j hace que recorrer relaciones sea muy natural."
Publicar "Diego"  "Hoy aprendi a subir imagenes a un almacenamiento S3."
Publicar "Elena"  "Quien mas esta preparando la demo?"
Publicar "Fabian" "WebSocket para el chat, Web Push para avisar con la app cerrada."

Write-Host ""
Write-Host "Ana sigue a Beto y Carla: su feed debe mostrar 2 publicaciones (no las de Diego, Elena ni Fabian)."
$ta = Token "Ana"
Invoke-RestMethod "$api/feed" -Headers @{ Authorization = "Bearer $ta" } | Format-Table autorNombre, texto, reacciones