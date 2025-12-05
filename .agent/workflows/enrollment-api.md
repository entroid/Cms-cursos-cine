---
description: How to work with the Enrollment API and course progress tracking
---

# Enrollment API Workflow

This document describes how to work with the Enrollment API for course progress tracking.

## Quick Reference

See `docs/API_REFERENCE.md` for complete endpoint documentation.

## Key Points

1. **Authentication Required**: All enrollment endpoints require JWT authentication.
   - Header: `Authorization: Bearer {jwt-token}`

2. **Field Names**:
   - Use `enrollmentStatus` (not `status`) due to PostgreSQL constraints
   - Valid values: `not-started`, `in-progress`, `completed`

3. **Lesson Identification**:
   - Lessons are identified by `lessonId` (auto-generated slug from title)
   - Use `lessonId` for `currentLesson` and `completedLessons` array

4. **Progress Auto-Calculation**:
   - `progressPercentage` is calculated automatically
   - `enrollmentStatus` updates based on progress (0% = not-started, 1-99% = in-progress, 100% = completed)

## Common Tasks

### Get Continue Watching
```bash
curl -X GET http://localhost:1337/api/enrollments/continue-watching \
  -H "Authorization: Bearer YOUR_JWT"
```

### Update Progress
```bash
curl -X PUT http://localhost:1337/api/enrollments/1 \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"data": {"currentLesson": "lesson-slug", "completedLessons": ["lesson-1", "lesson-2"]}}'
```

## Related Files

- Schema: `src/api/enrollment/content-types/enrollment/schema.json`
- Controller: `src/api/enrollment/controllers/enrollment.ts`
- Service: `src/api/enrollment/services/enrollment.ts`
- Routes: `src/api/enrollment/routes/enrollment.ts`
- Bootstrap permissions: `src/index.ts`
