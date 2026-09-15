# Política de Seguridad — Hipertrof.ia

## Reporte de vulnerabilidades

Si encontrás una vulnerabilidad, **no abras un issue público**. Escribí a:

- **Email:** `security@hypertrofia.app` _(reemplazar por el correo real)_
- **Asunto:** `[SECURITY] Hipertrof.ia — <resumen>`

Incluí: descripción, pasos para reproducir, impacto estimado y, si es posible,
una prueba de concepto. Respondemos en un plazo objetivo de **72 h** y
coordinamos la divulgación responsable.

No realizamos acciones legales contra investigadores que actúen de buena fe y
respeten la privacidad de los usuarios.

---

## Reglas obligatorias para el equipo

1. **Nunca** commitear secretos. Si dudás, corré el escáner de secretos
   (`gitleaks detect`) antes de hacer push.
2. Los archivos `.env*` están ignorados por git; solo se versionan
   `.env.example`. **No** los fuerces con `git add -f`.
3. La **service_role** de Supabase:
   - Solo se usa server-side (route handlers) y vive en Vercel Env.
   - **Nunca** se usa en local contra el proyecto de producción.
   - **Nunca** se expone con prefijo `NEXT_PUBLIC_`.
4. Separación de entornos: **dev / staging / prod** son proyectos Supabase
   distintos. El `.env.local` apunta a dev.
5. MFA obligatorio en Supabase, Vercel, Google Cloud y Spotify.
6. Antes de agregar una tabla: `enable row level security` + políticas +
   test de RLS.
7. Revisar la [auditoría de seguridad](./docs/security/AUDITORIA-SEGURIDAD.md)
   y el plan de acción vigente.

---

## Rotación de secretos

| Secreto | Dónde rotar | Frecuencia |
|---------|-------------|------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | ante sospecha / 90 días |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API (rotate JWT) | ante sospecha |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → Credentials | ante sospecha / 180 días |
| `SPOTIFY_CLIENT_SECRET` | Spotify Developer Dashboard | ante sospecha / 180 días |
| `VAPID_*` | `web-push generate-vapid-keys` | anual |
| `PUSH_HOOK_SECRET` | generar aleatorio | ante sospecha |
| Tokens de Vercel | Vercel → Tokens | ante sospecha |

> Si un secreto estuvo en disco, en un backup, en un chat o en un ZIP
> compartido: **se considera comprometido y se rota**.

---

## Checklist previo a cada release

- [ ] `gitleaks detect --no-git` sin hallazgos.
- [ ] Typecheck y lint en verde.
- [ ] Sin `.env*` ni scripts locales en el diff (`git status`).
- [ ] Migraciones SQL revisadas y aplicadas en staging antes de prod.
- [ ] Dependencias sin vulnerabilidades críticas (`npm audit`).
