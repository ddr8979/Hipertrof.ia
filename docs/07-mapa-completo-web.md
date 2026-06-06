# Mapa completo de la web (simple)

Esto ya esta construido en `web/src/app`:

- `/calorias` -> calculo Harris-Benedict + guardado de perfil
- `/rutinas` -> crear/listar programas de entrenamiento
- `/nutricion` -> crear/listar recetas y macros
- `/marketplace` -> publicar/listar cursos
- `/gimnasio` -> socios + check-in + WhatsApp (simulado)

## Como viajan los datos

Ejemplo rutinas:

1. `web/src/app/rutinas/page.tsx` (pantalla) hace `fetch("/api/rutinas/programas")`
2. `web/src/app/api/rutinas/programas/route.ts` recibe la solicitud
3. Ese endpoint usa `web/src/server/db.ts` (Prisma)
4. Prisma guarda/lee en SQLite segun `web/prisma/schema.prisma`

El resto de modulos sigue ese mismo patron.

