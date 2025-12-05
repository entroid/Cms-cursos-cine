# Strapi API Reference

## Base URL
```
${STRAPI_URL}/api
```
> Default local: `http://localhost:1337/api`

---

## Authentication

### Login
```http
POST /api/auth/local
Content-Type: application/json

{
  "identifier": "user@email.com",
  "password": "password123"
}
```

**Response:** `{ "jwt": "...", "user": {...} }`

### Register
```http
POST /api/auth/local/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "user@email.com",
  "password": "password123"
}
```

---

## Users

### Get User by Email (Server-side)
```http
GET /api/users/me?email=user@email.com
Authorization: Bearer {API_TOKEN}
```

> **Note:** This endpoint uses Strapi API Token, not user JWT. Called from Next.js backend.

**Response:**
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "user@email.com",
  "displayName": "John Doe",
  "avatar": {...},
  "courses": [...]
}
```

---

## Courses

### List Courses (Public)
```http
GET /api/courses?populate=*
```

### Get Single Course
```http
GET /api/courses/{id}?populate=deep
```

**Schema:**
| Field | Type | Description |
|-------|------|-------------|
| `title` | String | Course title (required) |
| `slug` | UID | URL-friendly identifier |
| `coverImage` | Media | Course thumbnail |
| `shortDescription` | Text | Max 200 chars |
| `fullDescription` | Richtext | Full HTML description |
| `instructor` | Relation | Instructor reference |
| `level` | Enum | `beginner`, `intermediate`, `advanced` |
| `estimatedDuration` | Integer | Total minutes (auto-calculated) |
| `priceUsd` | Integer | Price in USD cents |
| `priceArg` | Integer | Price in ARS (required) |
| `tags` | Relation | Many-to-many with Tags |
| `modules` | Component[] | Course modules with lessons |
| `settings` | Component | Course settings (see below) |

**Settings Component (course.settings):**
| Field | Type | Description |
|-------|------|-------------|
| `visible` | Boolean | Show in public listings (default: true) |
| `featured` | Boolean | Highlight as featured course (default: false) |
| `language` | Enum | `es`, `en`, `pt` (default: es) |
| `releaseDate` | DateTime | Scheduled release date |
| `seo` | Component | SEO metadata (title, description, keywords) |

---

## Instructors

### List Instructors (Public)
```http
GET /api/instructors?populate=*
```

**Schema:**
| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Instructor name (required) |
| `slug` | UID | URL identifier |
| `bio` | Richtext | Biography |
| `avatar` | Media | Profile image |
| `email` | Email | Contact email |
| `socialLinks` | Component[] | Social media links |
| `courses` | Relation | Instructor's courses |

---

## Tags

### List Tags
```http
GET /api/tags
```

**Schema:**
| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Tag name (unique) |
| `slug` | UID | URL identifier |
| `description` | Text | Tag description |
| `color` | String | Hex color code |

---

## Enrollments (Auth Required)

### List User's Enrollments
```http
GET /api/enrollments
Authorization: Bearer {jwt}
```

### Update Progress
```http
PUT /api/enrollments/{id}
Authorization: Bearer {jwt}
Content-Type: application/json

{
  "data": {
    "currentLesson": "lesson-slug",
    "completedLessons": ["lesson-1", "lesson-2"]
  }
}
```
> Auto-calculates: `progressPercentage`, `enrollmentStatus`, `completedAt`

### Continue Watching
```http
GET /api/enrollments/continue-watching
Authorization: Bearer {jwt}
```

Returns most recent active enrollment or `{ "data": null }`.

### Validate Access (Public)
```http
GET /api/enrollments/validate-access?courseId={id}&userId={id}
```

**Enrollment Schema:**
| Field | Type | Description |
|-------|------|-------------|
| `user` | Relation | User reference |
| `course` | Relation | Course reference |
| `enrollmentStatus` | Enum | `not-started`, `in-progress`, `completed` |
| `progressPercentage` | Decimal | 0-100 |
| `currentLesson` | String | Current lessonId slug |
| `completedLessons` | JSON | Array of lessonId slugs |
| `enrolledAt` | DateTime | Enrollment date |
| `lastAccessedAt` | DateTime | Last activity |
| `completedAt` | DateTime | Completion date |
| `paymentProvider` | Enum | `stripe`, `mercadopago`, `free` |
| `paymentId` | String | Payment reference |
| `expiresAt` | DateTime | Access expiration |

---

## Components

### Lesson (course.lesson)
| Field | Type | Description |
|-------|------|-------------|
| `lessonId` | String | Auto-generated slug (read-only) |
| `title` | String | Lesson title (required) |
| `videoUrl` | String | Video URL |
| `textContent` | Richtext | Lesson content |
| `duration` | Integer | Duration in minutes |
| `freePreview` | Boolean | Free preview enabled |
| `order` | Integer | Display order |

---

## Notes

> [!IMPORTANT]
> **enrollmentStatus:** Field is named `enrollmentStatus` (not `status`) due to PostgreSQL.

> [!NOTE]
> **lessonId:** Auto-generated from title. Use for `currentLesson` and `completedLessons`.
