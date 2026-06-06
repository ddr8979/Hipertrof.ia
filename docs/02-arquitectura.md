# Arquitectura (MVP)

## Objetivo del Mes 1 (del manual)

- Registro / perfiles
- Calculadora Harris–Benedict
- Base técnica para crecer a rutinas, nutrición y (más adelante) IA local

## Qué stack estamos usando

- **Frontend**: Next.js (App Router) + TypeScript
- **Estilos**: Tailwind CSS
- **Backend** (próximo): API routes / server actions + Prisma (y más adelante Postgres)

## Conceptos clave (lo mínimo que tenés que entender)

- **Componentes**: funciones que retornan UI.
- **Rutas**: archivos en `src/app/**` que se convierten en páginas.
- **Server vs Client**: algunas cosas corren en el servidor (más seguras), otras en el navegador (interacción).
- **Tipos**: TypeScript te ayuda a no romper cosas sin darte cuenta.

## “Vertical slices” (cómo vamos a construir)

En vez de “hacer primero toda la BD”, vamos por cortes verticales:

1. Pantalla + formulario
2. Cálculo (lógica pura)
3. Persistencia (guardar/leer)
4. Validación / edge cases

## Hecho

- Tenés un mapa mental de cómo se va a construir el MVP.

