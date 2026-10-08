# Consultas Cypher — Persona A (grafo social)

Todas viven en `GrafoRepository.java`. Usan parámetros (`$id`, `$yo`, `$otro`) para evitar inyección Cypher.

## 1. Seguidores de un usuario (1 nivel)

**Problema:** listar quién sigue a un usuario.

```cypher
MATCH (u:Usuario)-[:SIGUE]->(:Usuario {id: $id})
RETURN u.id AS id, u.nombre AS nombre, u.bio AS bio
ORDER BY u.nombre
```

**Patrón:** `(seguidor)-[:SIGUE]->(yo)`

---

## 2. Usuarios seguidos (1 nivel)

```cypher
MATCH (:Usuario {id: $id})-[:SIGUE]->(u:Usuario)
RETURN u.id AS id, u.nombre AS nombre, u.bio AS bio
ORDER BY u.nombre
```

**Patrón:** `(yo)-[:SIGUE]->(seguido)`

---

## 3. En común entre dos usuarios (patrón en V, 2 ramas)

**Problema:** personas que sigo yo y también sigue otro.

```cypher
MATCH (a:Usuario {id: $yo})-[:SIGUE]->(comun:Usuario)<-[:SIGUE]-(b:Usuario {id: $otro})
RETURN comun.id AS id, comun.nombre AS nombre, comun.bio AS bio
ORDER BY comun.nombre
```

**Patrón:** `(yo)-[:SIGUE]->(comun)<-[:SIGUE]-(otro)`

---

## 4. Sugerencias — amigos de amigos (2 niveles) ⭐

**Problema:** recomendar gente sin aleatoriedad.

**Criterio:** usuarios a 2 saltos que yo no sigo; ranking por cuántos de mis seguidos ya los siguen (`enComun`) y, como desempate, popularidad.

```cypher
MATCH (yo:Usuario {id: $id})-[:SIGUE]->(amigo:Usuario)-[:SIGUE]->(c:Usuario)
WHERE c <> yo AND NOT (yo)-[:SIGUE]->(c)
WITH c, collect(DISTINCT amigo.nombre) AS mediadores
RETURN c.id AS id, c.nombre AS nombre,
       size(mediadores) AS enComun,
       mediadores[0..3] AS via,
       COUNT { (c)<-[:SIGUE]-() } AS popularidad
ORDER BY enComun DESC, popularidad DESC, nombre
LIMIT 10
```

**Patrón:** `(yo)-[:SIGUE]->(amigo)-[:SIGUE]->(candidato)`  
La UI muestra *“Lo siguen Ana y Beto”* con el campo `via`.

---

## 5. Alcanzables hasta 3 saltos (variable length) ⭐

**Problema:** alcance de la red de un usuario (recorrido de **más de un nivel**).

```cypher
MATCH p = (yo:Usuario {id: $id})-[:SIGUE*1..3]->(u:Usuario)
WHERE u <> yo
WITH u, min(length(p)) AS saltos
RETURN u.id AS id, u.nombre AS nombre, saltos
ORDER BY saltos, nombre
LIMIT 50
```

**Nota:** Cypher no permite parametrizar `*1..$n`; el límite `3` va fijo.

---

## 6. Estado de relación (botón Seguir del perfil)

```cypher
MATCH (u:Usuario {id: $otro})
RETURN EXISTS { (:Usuario {id: $yo})-[:SIGUE]->(u) } AS sigo,
       EXISTS { (u)-[:SIGUE]->(:Usuario {id: $yo}) } AS meSigue,
       COUNT { (u)<-[:SIGUE]-() } AS seguidores,
       COUNT { (u)-[:SIGUE]->() } AS seguidos
```

---

## 7. Grafo completo (visualización)

```cypher
MATCH (u:Usuario)
OPTIONAL MATCH (u)-[:SIGUE]->(v:Usuario)
RETURN u.id AS id, u.nombre AS nombre, collect(v.id) AS sigue
```

El backend lo transforma a `{ nodos: [{id, nombre}], enlaces: [{source, target}] }` para `react-force-graph-2d`.

---

## Cómo probar en Neo4j Browser

1. Abrir http://localhost:7474  
2. Tras el seed, por ejemplo:

```cypher
:param id => 'pegar-aqui-el-id-de-ana'
```

3. Ejecutar cualquiera de las consultas de arriba.

Para ver todo el grafo social:

```cypher
MATCH (a:Usuario)-[r:SIGUE]->(b:Usuario)
RETURN a, r, b
```
