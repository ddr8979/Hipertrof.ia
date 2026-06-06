# Base de datos (explicado para 12 años)

Pensalo así:

- Tu app es una **escuela**.
- Los **usuarios** son alumnos.
- El **perfil** es la ficha del alumno (edad, altura, peso, etc.).
- La **base de datos** es un cuaderno gigante donde guardamos esas fichas para que no se pierdan.

## ¿Qué usamos?

- Prisma = un “traductor” entre TypeScript y la base de datos.
- SQLite = una base de datos en un archivo (perfecta para empezar).

## Dónde está cada cosa

- `web/prisma/schema.prisma`: el “plano” de las tablas (qué campos existen).
- `web/.env`: la dirección de la base (en este caso un archivo `dev.db`).
- `web/src/server/db.ts`: crea el cliente de Prisma para poder guardar/leer.
- `web/src/app/api/profile/calorias/route.ts`: un endpoint (API) para guardar el perfil.

## Cómo se conecta el flujo

1. En `/calorias` tocás “Guardar en perfil”
2. El navegador hace un `fetch()` a `/api/profile/calorias`
3. Ese endpoint calcula calorías (misma función pura) y guarda en la DB

## Hecho

- Tenés persistencia real (guardar) aunque todavía no haya login.

