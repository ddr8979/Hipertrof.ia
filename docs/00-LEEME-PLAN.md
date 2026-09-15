# HIPERTROFIA — Carpeta de planificación

Creada: 2026-09-16

Orden de lectura:

1. `CHECKLISTS-DOD.md` ← **empezá acá**. Todas las tareas y Definition of Done
   por fase, para tildar día a día.
2. `ROADMAP.md` — el plan completo por fases (M0–M7), con dependencias,
   estimaciones y riesgos.
3. `ESTADO-Y-PLAN.md` — qué se hizo (limpieza, seguridad, comentarios), qué
   falta y recomendaciones priorizadas.
4. `AUDITORIA-SEGURIDAD.md` — 18 hallazgos de seguridad + runbook de rotación.
5. `POLITICA-SEGURIDAD.md` — reglas de secretos, rotación y checklist de release.
6. `DIAGNOSTICO-RUTINAS-TRAINER.md` — bugs P0/P1/P2 con causa raíz.

## Resumen en una frase

El bloqueante real no son los bugs: es el **drift de la base de datos** (tablas
y funciones que existen en producción pero no en las migraciones). Hasta
resolverlo (M0), no hay staging ni reproducibilidad. Después: M1 entrenamiento
sólido → M2 trainer → M3 mensajería = **MVP lanzable**.

## Los 3 pendientes que no pueden esperar

- [ ] Rotar `service_role`, Google y Spotify.
- [ ] Crear Supabase de staging separado de producción.
- [ ] Escribir las migraciones del drift.

> Los documentos originales viven en `~/Documentos/HIPERTROFIA/docs/`.
> Esta carpeta es una copia de trabajo en el Escritorio.
