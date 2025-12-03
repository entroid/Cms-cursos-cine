# Cine Platform - CMS & Backend

**Entry Point for AI Agents & Developers**

## Contexto del Proyecto
Plataforma de cursos online "Cine". Este repositorio contiene el backend CMS (Strapi v5) encargado de la gestión de contenido editorial (cursos, lecciones, instructores) y la validación de accesos.

## Arquitectura
- **Backend**: Strapi v5 (Headless CMS)
- **Database**: PostgreSQL (via Docker en local)
- **Frontend**: Next.js (Repositorio separado, consume este API)
- **Auth**:
  - **Instructores**: Admin users (`admin::user`) - Acceso vía `/admin`
  - **Alumnos**: Users & Permissions (`plugin::users-permissions.user`) - Autenticación vía NextAuth en FE, sincronizados en Strapi

- **SocialLink** (shared.social-link): Enlaces sociales del instructor

## Gestión de Usuarios (Alumnos)

**Estrategia:**
1. **Autenticación**: Los alumnos se autentican en el frontend usando NextAuth v5
2. **Sincronización**: Durante el registro/login en NextAuth, el sistema crea/actualiza automáticamente un usuario en Strapi usando `plugin::users-permissions.user`
3. **Modelo**: Los alumnos se guardan en `plugin::users-permissions.user` con:
   - `email` (único, usado como identificador principal)
   - `username` (generado del email o proporcionado)
   - `displayName` (nombre visible, default: "Alumno")
   - `avatar` (imagen de perfil opcional)
   - `courses` (relación manyToMany con Course - matriculaciones)
   - `password` (aleatorio generado, NO usado para login ya que usan NextAuth)
   - `confirmed: true`, `blocked: false` (configurados automáticamente)

4. **Enrollments**: Los enrollments ahora se relacionan con usuarios vía `enrollment.user` (relación manyToOne)
   - Método nuevo: `userId` - Relaciona directamente con `plugin::users-permissions.user`
   - Método legacy: `externalUserId` - Mantenido para retrocompatibilidad

**Flujo de Registro/Login:**
```
Usuario → NextAuth (FE) → Callback → Strapi API (/api/auth/local/register o /api/users)
                                   ↓
                           Crear/Actualizar User en Strapi
                                   ↓
                           Retornar userId a NextAuth
```

**Validación de Acceso a Cursos:**
- Endpoint: `GET /api/enrollment/validate-access`
- Parámetros: `courseId` + (`userId` OR `externalUserId`)
- Respuesta: `{ hasAccess: boolean, enrollment?, method: 'user' | 'externalUserId' }`

---

## API Endpoints Disponibles

### Autenticación y Usuarios

#### `POST /api/auth/local/register`
Registro de nuevos usuarios (alumnos).

**Body**:
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "displayName": "string (opcional)"
}
```

**Response**: 
```json
{
  "jwt": "string",
  "user": { ... }
}
```

**Permisos**: Public

---

#### `POST /api/auth/local`
Login de usuarios existentes.

**Body**:
```json
{
  "identifier": "email o username",
  "password": "string"
}
```

**Response**:
```json
{
  "jwt": "string",
  "user": { ... }
}
```

**Permisos**: Public

---

#### `GET /POST /api/users/me`
Obtiene datos de un usuario por email. **Llamado desde backend de Next.js con API Token**.

**Métodos**:
- `GET` con query param `?email=user@example.com`
- `POST` con body `{"email": "user@example.com"}` (**Recomendado**)

**Headers**: `Authorization: Bearer <strapi-api-token>`

**Response**:
```json
{
  "id": 1,
  "username": "string",
  "email": "string",
  "displayName": "string",
  "avatar": {
    "url": "string"
  },
  "courses": [
    {
      "id": 1,
      "title": "string",
      "slug": "string",
      "coverImage": { ... },
      "instructor": { ... },
      "tags": [ ... ]
    }
  ]
}
```

**Características**:
- ✅ **Autenticación**: Strapi API Token (NO user JWT)
- ✅ **Llamado desde**: Backend de Next.js server-side
- ✅ Datos sanitizados (sin password, tokens)
- ✅ Relaciones populadas automáticamente
- ✅ Incluye cursos matriculados

**Permisos**:
- ❌ Public → NO
- ❌ Authenticated (user JWT) → NO
- ✅ API Token → Sí (con permisos `user.find` y `user.findOne`)

**Ubicación**: `src/extensions/users-permissions/controllers/user.ts`

**Ejemplo de uso**:
```typescript
// Next.js backend
const response = await fetch(`${STRAPI_URL}/api/users/me`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${STRAPI_API_TOKEN}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ email: session.user.email })
});
```

---

### Enrollments

#### `GET /api/enrollment/validate-access`
Valida si un usuario tiene acceso activo a un curso.

**Query Params**:
- `courseId`: ID del curso (requerido)
- `userId`: ID del usuario en Strapi (nuevo método)
- `externalUserId`: ID externo del usuario (método legacy)

**Nota**: Proporcionar `userId` O `externalUserId` (al menos uno)

**Response** (con acceso):
```json
{
  "hasAccess": true,
  "enrollment": {
    "id": 1,
    "status": "active",
    "enrolledAt": "2025-12-03T10:00:00.000Z",
    "expiresAt": "2026-12-03T10:00:00.000Z",
    "course": { ... },
    "user": {
      "id": 1,
      "email": "user@example.com",
      "avatar": { ... }
    }
  },
  "method": "user"
}
```

**Response** (sin acceso):
```json
{
  "hasAccess": false,
  "message": "No active enrollment found",
  "searchedBy": "userId: 1"
}
```

**Permisos**: Public (para permitir validación desde FE)

**Ubicación**: `src/api/enrollment/controllers/enrollment.ts`

---

### Cursos (Público)

#### `GET /api/courses`
Lista todos los cursos publicados.

**Query Params**:
- `populate`: Relaciones a popular (ej: `instructor,coverImage,tags`)
- `filters`: Filtros (ej: `filters[slug][$eq]=intro-cinema`)
- `sort`: Ordenamiento (ej: `createdAt:desc`)

**Permisos**: Public

---

#### `GET /api/courses/:id`
Obtiene un curso específico por ID.

**Permisos**: Public

---

### Integración con NextAuth

Para integrar estos endpoints con NextAuth en el frontend:

**1. Sincronizar usuarios al login/registro**:
```typescript
// En [...nextauth]/route.ts - callback signIn
async signIn({ user, account }) {
  if (account?.provider === "google") {
    // Crear usuario en Strapi si no existe
    const response = await fetch(
      `${STRAPI_URL}/api/users?filters[email][$eq]=${user.email}`,
      { headers: { Authorization: `Bearer ${API_TOKEN}` }}
    );
    
    if (response.data.length === 0) {
      await fetch(`${STRAPI_URL}/api/users`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${API_TOKEN}`,
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          username: user.email.split("@")[0],
          email: user.email,
          displayName: user.name,
          password: crypto.randomUUID(),
          confirmed: true
        })
      });
    }
  }
  return true;
}
```

**2. Obtener datos de Strapi en el JWT**:
```typescript
// En [...nextauth]/route.ts - callback jwt
async jwt({ token, user }) {
  if (user?.strapiToken) {
    const response = await fetch(`${STRAPI_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${user.strapiToken}` }
    });
    token.strapiUser = await response.json();
  }
  return token;
}
```

**3. Exponer en sesión**:
```typescript
// En [...nextauth]/route.ts - callback session
async session({ session, token }) {
  session.strapiUser = token.strapiUser;
  session.strapiToken = token.strapiToken;
  return session;
}
```

Ver archivo `nextauth_integration_guide.md` para guía completa.

---


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
