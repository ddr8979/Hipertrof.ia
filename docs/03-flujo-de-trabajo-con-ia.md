# Flujo de trabajo con IA (sin humo)

La IA es mejor como:
- **Analista**: te ayuda a ordenar ideas, detectar bugs, y escribir tests.
- **Copiloto**: genera borradores que vos revisás.

Es mala como:
- **“Autopiloto”**: si no sabés qué cambió, vas a acumular deuda y bugs.

## Prompts útiles (copiar/pegar)

### 1) Entender el repo

> “Leé la estructura del proyecto y explicame qué hace cada carpeta. Después proponé el próximo cambio mínimo para implementar X.”

### 2) Implementar una feature pequeña

> “Quiero agregar un formulario para [X]. Requisitos: [lista]. Mostrame primero el diseño de archivos y tipos. Después implementalo. Al final, revisá lints.”

### 3) Debug serio (sin adivinar)

> “Tengo este error exacto: [pegar]. Decime 3 hipótesis ordenadas por probabilidad, cómo verificarlas, y recién después proponé el fix.”

### 4) Code review (aprender)

> “Revisá este archivo como si fueras mi lead: señalá problemas, mejoras de naming, y riesgos. Luego sugerí un refactor pequeño.”

## Cómo revisar cambios generados por IA

- ¿Los nombres son claros?
- ¿Hay lógica duplicada?
- ¿Dónde puede fallar (inputs raros)?
- ¿Se puede testear con una función pura?

## Hecho

- Tenés un playbook de prompts para avanzar sin perder control.

