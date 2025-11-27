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

## Gestión de Usuarios (Instructores)
**Estrategia MVP**:
1. **Acceso**: Los instructores acceden al **Strapi Admin Panel** (`/admin`).
2. **Rol**: Se les asigna el rol **Author** (pueden crear/editar contenido propio).
3. **Registro y Perfil**:
   - **Paso 1 (Invitación)**: Admin invita al instructor desde *Settings > Users > Invite new user* con rol **Author**.
   - **Paso 2 (Creación de Perfil)**: El instructor inicia sesión y crea **su propia entrada** en la colección `Instructor`.
   - **Validación**: Solo pueden crear **un único perfil** (validado por lifecycle hook).
   - **Auto-asociación**: El campo `user` se asigna automáticamente al usuario logueado.

### Lifecycle Hooks Implementados

#### Instructor (`src/api/instructor/content-types/instructor/lifecycles.ts`)
- **beforeCreate**: 
  - Valida que el usuario no tenga ya un perfil de instructor.
  - Auto-asigna el campo `user` al usuario creador (`createdBy`).
- **beforeUpdate**:
  - Protege los campos `user` y `courses` de modificación manual.
  - Garantiza que estos campos solo se gestionen automáticamente.

#### Course (`src/api/course/content-types/course/lifecycles.ts`)
- **beforeCreate**:
  - Busca el perfil de instructor del usuario creador.
  - Auto-asigna el curso a ese instructor.
  - Resultado: Los cursos se vinculan automáticamente sin intervención manual.

### Limitaciones Conocidas (Strapi CE)
- **UI Condicional**: No se puede ocultar el botón "Create new entry" para instructores que ya tienen perfil.
  - *Workaround*: El lifecycle hook lanza un error claro si intentan crear un segundo perfil.
- **Personalización de campos**: No se puede cambiar cómo se muestran las relaciones (ej: "Nombre - [ID]").
  - *Workaround*: Campo `user` marcado como `private: true` (oculto).

## Flujo de Trabajo Completo

1. **Admin crea usuario Author** → Invita al instructor por email.
2. **Instructor crea perfil** → Al iniciar sesión, crea su entrada en `Instructor`.
3. **Instructor crea cursos** → Va a Content Manager > Courses > Create.
4. **Auto-vinculación** → El curso se asigna automáticamente a su perfil.
5. **Estructura del curso** → Dentro del curso crea módulos, dentro de módulos crea lecciones.

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
