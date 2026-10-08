#!/bin/sh
# Carga datos de demostracion usando la API REST (no escribe directamente en Neo4j).
# Funciona en Linux, macOS, Git Bash y dentro de Docker. Es repetible.
#
#   Con Docker (cualquier sistema):   docker compose --profile seed run --rm seed
#   Sin Docker (necesita curl):       sh scripts/seed.sh
#
# Crea 8 usuarios (clave demo1234), una red de seguimiento y, si aun no hay, 5 publicaciones.

API="${API:-http://localhost:8080}"
CLAVE="demo1234"
NOMBRES="Ana Beto Carla Diego Elena Fabian Gabriela Hugo"

campo() { sed -n "s/.*\"$1\":\"\\([^\"]*\\)\".*/\\1/p"; }

echo "Esperando al backend en $API ..."
intentos=0
until curl -fs "$API/q/health" >/dev/null 2>&1; do
  intentos=$((intentos + 1))
  if [ "$intentos" -ge 60 ]; then
    echo "El backend no responde en $API. Revisa: docker compose ps" >&2
    exit 1
  fi
  sleep 2
done

for n in $NOMBRES; do
  email="$(echo "$n" | tr '[:upper:]' '[:lower:]')@demo.com"
  r=$(curl -s -X POST "$API/auth/registro" -H 'Content-Type: application/json' \
      -d "{\"nombre\":\"$n\",\"email\":\"$email\",\"password\":\"$CLAVE\"}")
  case "$r" in
    *'"token"'*) ;;
    *) r=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' \
          -d "{\"email\":\"$email\",\"password\":\"$CLAVE\"}") ;;
  esac
  token=$(echo "$r" | campo token)
  id=$(echo "$r" | sed -n 's/.*"usuario":{"id":"\([^"]*\)".*/\1/p')
  if [ -z "$token" ] || [ -z "$id" ]; then
    echo "No se pudo crear ni iniciar sesion con $email. Respuesta: $r" >&2
    exit 1
  fi
  eval "TOKEN_$n=\$token"
  eval "ID_$n=\$id"
  echo "Usuario listo: $n ($email)"
done

seguir() {
  eval "t=\$TOKEN_$1"
  eval "destino=\$ID_$2"
  curl -s -o /dev/null -X POST "$API/social/seguir/$destino" -H "Authorization: Bearer $t"
}

seguir Ana Beto;      seguir Ana Carla
seguir Beto Diego;    seguir Carla Diego;   seguir Carla Elena
seguir Diego Fabian;  seguir Elena Fabian;  seguir Fabian Gabriela
seguir Gabriela Hugo; seguir Hugo Ana
echo "Red de seguimiento creada."

publicar() {
  eval "t=\$TOKEN_$1"
  curl -s -o /dev/null -X POST "$API/posts" -H "Authorization: Bearer $t" -F "texto=$2"
  echo "Publicado por $1: $2"
}

# Las publicaciones solo se crean la primera vez (si el feed de Ana esta vacio)
feed=$(curl -s "$API/feed" -H "Authorization: Bearer $TOKEN_Ana")
if [ "$feed" = "[]" ]; then
  publicar Beto   "Primer dia probando la red social distribuida."
  publicar Carla  "Neo4j hace que recorrer relaciones sea muy natural."
  publicar Diego  "Hoy aprendi a subir imagenes a un almacenamiento S3."
  publicar Elena  "Quien mas esta preparando la demo?"
  publicar Fabian "WebSocket para el chat, Web Push para avisar con la app cerrada."
else
  echo "Ya habia publicaciones: no se crean de nuevo."
fi

echo ""
echo "Listo. Usuarios: ana@demo.com, beto@demo.com, carla@demo.com ... hugo@demo.com"
echo "Clave de todos: $CLAVE"
echo "Ana sigue a Beto y Carla: su feed muestra 2 publicaciones y sus sugerencias son Diego (2 en comun) y Elena (1)."
