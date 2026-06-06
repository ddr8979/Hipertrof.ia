# hipertrof.ia

Ecosistema web-first (PWA) para **atletas**, **personal trainers** y **gimnasios**.

## Si querés aprender a programar (con IA)

Empezá por `docs/00-indice.md`. Está escrito para aprender “programando en un proyecto real” y usando la IA como copiloto.

## Alcance (según `Manual_Integral_HipertrofIA_Final.pdf`)

- **Atleta**
  - Rutinas interactivas + diario de cargas (series/peso/descanso)
  - Nutrición: cálculo calórico (Harris–Benedict) + registro
  - Chat IA (en el manual: pensado para correr en infraestructura propia)
- **Personal Trainer**
  - Gestión de alumnos
  - Constructor masivo de rutinas
  - Marketplace de cursos/guías
- **Gimnasio**
  - Check-in QR “semáforo” (bloqueo de morosos)
  - Alertas/recordatorios por WhatsApp
  - Gestión administrativa básica

## MVP propuesto (Mes 1 del roadmap)

- Registro / inicio de sesión
- Perfiles (rol + datos físicos)
- Calculadora Harris–Benedict (BMR + TDEE como punto de partida)
- Base técnica para incorporar IA local luego (endpoint stub)

## Estructura del repo (plan)

- `apps/web`: PWA (Next.js)
- `packages/db`: Prisma schema y migraciones
- `apps/api` (opcional): API separada si hace falta escalar

## Próximo paso

Inicializar el proyecto web (Next.js + Tailwind) y dejar corriendo el skeleton del MVP.

