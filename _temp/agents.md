# Cine Platform - CMS & Backend

**Entry Point for AI Agents & Developers**

## Contexto del Proyecto
Plataforma de cursos online "Cine". Este repositorio contiene el backend CMS (Strapi v5) encargado de la gestión de contenido editorial (cursos, lecciones, instructores) y la validación de accesos.

## Arquitectura
- **Backend**: Strapi v5 (Headless CMS)
- **Database**: PostgreSQL (via Docker en local)
- **Frontend**: Next.js (Repositorio separado, consume este API)
- **Auth**:
  - **Instructores**: Autenticación nativa de Strapi.
  - **Alumnos**: Autenticación externa (NextAuth v5) en el FE. Strapi solo guarda referencia `externalUserId`.

## Tech Stack
- **Framework**: Strapi v5
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Infrastructure**: Docker (para DB local)
- **Payments**: Stripe & MercadoPago (futura integración)

## Estructura de Datos (Core)
- **Course**: Entidad principal.
- **Module**: Agrupador de lecciones.
- **Lesson**: Contenido educativo (Video URL + Rich Text).
- **Instructor**: Creador del contenido.
- **Enrollment**: Registro de acceso de un alumno a un curso.

## Convenciones
- **API Access**:
  - Public: Solo lectura de cursos publicados.
  - Authenticated (FE): Validación de enrollments.
- **Media**: Videos hosteados externamente (YouTube/Vimeo). Imágenes en Strapi.
- **Validation**: Endpoint custom `/api/validate-access` para verificar permisos de alumnos.

## Comandos Comunes
- `npm run develop`: Iniciar servidor en modo desarrollo (con auto-reload).
- `npm run build`: Construir admin panel.
- `npm run start`: Iniciar servidor producción.
- `docker-compose up -d`: Iniciar base de datos.
