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

- **SocialLink** (shared.social-link): Enlaces sociales del instructor

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

## Configuración de Desarrollo Local

### Requisitos Previos
1. **Docker Desktop**: Debe estar instalado y corriendo antes de iniciar el proyecto.
2. **Node.js**: Versión compatible con Strapi v5.

### Flujo de Inicio del Proyecto

**⚠️ IMPORTANTE**: PostgreSQL corre en un contenedor Docker (`cine_strapi_db`), NO como servicio de Windows.

#### Paso 1: Iniciar Docker Desktop
- Abrir Docker Desktop desde el menú de inicio de Windows
- Esperar a que el ícono de Docker en la barra de tareas esté activo (deja de parpadear)

#### Paso 2: Iniciar Base de Datos PostgreSQL
```powershell
docker-compose up -d
```
Esto inicia el contenedor `cine_strapi_db` en segundo plano.

#### Paso 3: Verificar que la Base de Datos está Corriendo
```powershell
docker ps
```
Deberías ver el contenedor `cine_strapi_db` con status "Up".

#### Paso 4: Iniciar Strapi
```powershell
npm run develop
```

### Troubleshooting

#### Error: `ECONNREFUSED 127.0.0.1:5432`
**Causa**: PostgreSQL no está corriendo.
**Solución**: 
1. Verificar que Docker Desktop esté corriendo
2. Ejecutar `docker-compose up -d`
3. Verificar con `docker ps` que el contenedor esté activo

#### Detener la Base de Datos
```powershell
docker-compose down
```
**Nota**: Los datos persisten en el volumen Docker `cine_strapi_data`, no se pierden al detener el contenedor.

## Comandos Comunes
- `npm run develop`: Iniciar servidor en modo desarrollo (con auto-reload).
- `npm run build`: Construir admin panel.
- `npm run start`: Iniciar servidor producción.
- `docker-compose up -d`: Iniciar base de datos PostgreSQL.
- `docker-compose down`: Detener base de datos.
- `docker ps`: Verificar contenedores activos.
