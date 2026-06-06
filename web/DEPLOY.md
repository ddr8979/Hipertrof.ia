# Guía de Despliegue a Costo Cero - Hypertrof.IA

Esta guía detalla los pasos recomendados para hostear toda la infraestructura de la aplicación (Frontend, API Backend, Base de Datos y Almacenamiento) de forma 100% gratuita y sin límites de tiempo.

---

## 1. Frontend & Backend (Next.js) en Vercel
Vercel ofrece un plan Hobby gratuito que incluye soporte de primera clase para aplicaciones Next.js con Serverless Functions.

1. **Crear una cuenta**: Regístrate en [Vercel](https://vercel.com) importando tu repositorio de GitHub.
2. **Crear un nuevo proyecto**: Selecciona la carpeta `web` de tu repositorio.
3. **Variables de Entorno**:
   Agrega las variables necesarias de sesión (`SESSION_SECRET`, etc.) y la URL de la base de datos de producción (`DATABASE_URL`).
4. **Desplegar**: Cada commit a tu rama principal se desplegará automáticamente de forma continua y gratuita.

---

## 2. Base de Datos en Producción (Costo Cero)
Por defecto la aplicación usa SQLite. Si deseas mantener SQLite en producción de forma serverless y con latencia ultrabaja, o bien migrar a Postgres, tienes dos excelentes opciones gratuitas:

### Opción A: Turso (SQLite en el Edge - Gratuito)
Turso es un servicio de base de datos basado en libSQL (un fork compatible de SQLite) ideal para despliegues Next.js en Vercel:
- **Plan gratuito**: Hasta 500 bases de datos y 9 GB de almacenamiento.
- **Configuración**:
  1. Instala el cliente de Turso y crea una base de datos: `turso db create hypertrofia-db`.
  2. Obtén la URL de conexión y el token: `turso db show hypertrofia-db --show-urls`.
  3. Modifica tu `prisma/schema.prisma` para usar el proveedor compatible o utiliza la URL directa si se configuran los drivers correspondientes.

### Opción B: Supabase o Neon (PostgreSQL - Gratuito)
Si prefieres PostgreSQL en producción:
- **Plan gratuito**: Supabase ofrece 2 proyectos Postgres gratuitos. Neon provee bases de datos serverless rápidas con 0.5 GB.
- **Migración en Prisma**:
  En `prisma/schema.prisma`, cambia:
  ```prisma
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }
  ```
  Luego ejecuta `npx prisma db push` o crea una nueva migración con `npx prisma migrate dev`.

---

## 3. Almacenamiento de Imágenes (Optimización Base64)
Para evitar la necesidad de servicios de almacenamiento de pago (como AWS S3 o Cloudinary) o la pérdida de archivos por la naturaleza efímera del disco de Vercel, **Hypertrof.IA cuenta con almacenamiento de avatares en la propia base de datos**:
- **Compresión en el Cliente**: La aplicación comprime cualquier foto subida a `150x150 px` en JPEG a `70%` de calidad en el navegador antes de subirla.
- **Peso Promedio**: Entre 8 y 15 KB.
- **Persistencia**: Se almacena la cadena Base64 directamente en la tabla `Profile` (campo `avatarUrl`), lo que hace que sea 100% persistente, autohospedada, rápida de leer y de costo cero.
