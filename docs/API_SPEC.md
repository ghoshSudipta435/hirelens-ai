# API Specification

Base path: `/api/v1`

All protected endpoints require `Authorization: Bearer <token>`.

## Standard Response Shapes

### Success (single)

```json
{
  "success": true,
  "data": { }
}
```

### Success (paginated list)

```json
{
  "success": true,
  "data": {
    "items": [],
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": []
  }
}
```

## Health

### GET `/health`

No auth required.

## Auth

### POST `/auth/register`

Registers a student or recruiter account. Rate-limited.

Request:
```json
{
  "name": "Ava Sharma",
  "email": "ava@example.com",
  "password": "StrongPassword123!",
  "role": "STUDENT"
}
```

Response (201):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_123",
      "name": "Ava Sharma",
      "email": "ava@example.com",
      "role": "STUDENT"
    },
    "accessToken": "jwt-token"
  }
}
```

### POST `/auth/login`

Authenticates a user. Rate-limited.

```json
{
  "email": "ava@example.com",
  "password": "StrongPassword123!"
}
```

Returns `{ user, accessToken }`.

### POST `/auth/refresh`

Rotates a valid refresh token. Rate-limited.

```json
{ "refreshToken": "..." }
```

Returns `{ accessToken, refreshToken }`.

### POST `/auth/logout`

Revokes the submitted refresh token. Rate-limited.

```json
{ "refreshToken": "..." }
```

### GET `/auth/profile`

Returns the authenticated user with their profile (student or recruiter).

## Profiles

### GET `/profile`

Returns the current user's profile with role-specific data.

### PATCH `/profile`

Updates the current user's profile. Body differs by role.

**Student fields:** `fullName`, `headline`, `university`, `degree`, `graduationYear`, `githubUrl`, `linkedinUrl`, `portfolioUrl`, `bio`

**Recruiter fields:** `companyName`, `companyWebsite`, `designation`, `bio`

At least one field required.

### GET `/profile/:userId`

Returns a user's public profile by user ID.

## Uploads

### POST `/uploads`

Upload a file (resume PDF/DOCX or image). Rate-limited (20/hour). Multipart with field name `file`.

Allowed types: PDF, DOCX, PNG, JPEG. Max 10 MB.

Response (201):
```json
{
  "success": true,
  "data": {
    "id": "upl_123",
    "fileName": "resume.pdf",
    "fileSize": 123456,
    "fileType": "application/pdf",
    "fileUrl": "https://res.cloudinary.com/...",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### GET `/uploads`

Lists the authenticated user's uploads. Paginated.

Query: `?page=1&limit=20`

### GET `/uploads/:id`

Returns a single upload owned by the authenticated user.

### DELETE `/uploads/:id`

Soft-deletes a single upload (Cloudinary + DB). Owned by the authenticated user.

## Resumes

### POST `/resumes`

Creates a resume from an uploaded file.

```json
{
  "uploadedFileId": "upl_123",
  "title": "Software Engineering Intern Resume"
}
```

Response (201):
```json
{
  "success": true,
  "data": {
    "id": "res_123",
    "ownerId": "usr_123",
    "uploadedFileId": "upl_123",
    "title": "Software Engineering Intern Resume",
    "version": 1,
    "status": "DRAFT",
    "createdAt": "...",
    "updatedAt": "...",
    "fileUrl": "https://..."
  }
}
```

### GET `/resumes`

Lists the authenticated student's resumes. Paginated.

Query: `?page=1&limit=20`

### GET `/resumes/:id`

Returns a single resume owned by the authenticated student.

### PATCH `/resumes/:id`

Updates resume title and/or status.

```json
{ "title": "Updated Title", "status": "ACTIVE" }
```

Only one resume per title group can be ACTIVE at a time.

### DELETE `/resumes/:id`

Soft-deletes a resume owned by the authenticated student.

## Jobs

### POST `/jobs`

Recruiter-only. Creates a job posting.

```json
{
  "title": "Backend Engineer Intern",
  "description": "Build Node.js APIs...",
  "employmentType": "INTERNSHIP",
  "locationMode": "REMOTE",
  "extractedSkills": ["Node.js", "PostgreSQL"],
  "status": "DRAFT"
}
```

### GET `/jobs`

Lists active (non-deleted) job postings. Paginated.

Query: `?page=1&limit=20&status=ACTIVE&search=node&employmentType=INTERNSHIP&locationMode=REMOTE`

### GET `/jobs/:id`

Returns a single job posting with recruiter info.

### PATCH `/jobs/:id`

Recruiter-owner only. Updates job posting fields.

### DELETE `/jobs/:id`

Recruiter-owner only. Soft-deletes a job posting.

## Applications

### POST `/applications`

Student-only. Applies to a job with a resume.

```json
{
  "resumeId": "res_123",
  "jobPostingId": "job_123"
}
```

Validates that resume is ACTIVE, job is ACTIVE, and no duplicate exists.

Response (201):
```json
{
  "success": true,
  "data": {
    "id": "app_123",
    "resumeId": "res_123",
    "jobPostingId": "job_123",
    "status": "SUBMITTED",
    "resume": { "id": "res_123", "title": "...", "version": 1 },
    "jobPosting": { "id": "job_123", "title": "...", "employmentType": "INTERNSHIP", "locationMode": "REMOTE" },
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### GET `/applications`

Lists applications. Students see their own; recruiters see applications to their jobs. Paginated.

Query: `?page=1&limit=20&status=SUBMITTED&jobPostingId=job_123`

### GET `/applications/:id`

Returns a single application with auth check (student owns resume or recruiter owns job).

### PATCH `/applications/:id/status`

Recruiter-only. Updates application status.

```json
{ "status": "REVIEWED" }
```

## Matching

### POST `/matches/preview`

Student-only. Rate-limited (10/min). Generates an AI match score between a resume and a job.

```json
{
  "resumeId": "res_123",
  "jobPostingId": "job_123"
}
```

Response (201):
```json
{
  "success": true,
  "data": {
    "id": "match_123",
    "contextType": "PREVIEW",
    "score": 75,
    "matchedSkills": ["Node.js", "PostgreSQL"],
    "missingSkills": ["Docker", "Redis"],
    "strengths": ["Relevant backend project experience"],
    "scoreVersion": "1.0.0",
    "resume": { "id": "res_123", "title": "..." },
    "jobPosting": { "id": "job_123", "title": "..." },
    "createdAt": "..."
  }
}
```

### GET `/matches`

Lists the authenticated student's match results. Paginated.

Query: `?page=1&limit=20`

### GET `/matches/:id`

Returns a single match result by ID.

## Interviews

### POST `/interviews/generate`

Recruiter-only. Rate-limited (10/min). Generates AI interview questions from a match result.

```json
{
  "matchResultId": "match_123"
}
```

Response (201):
```json
{
  "success": true,
  "data": {
    "id": "qs_123",
    "matchResultId": "match_123",
    "questions": [
      {
        "id": "q_1",
        "question": "How would you design a REST API for resume screening?",
        "difficulty": "MEDIUM",
        "category": "SYSTEM_DESIGN"
      }
    ],
    "createdAt": "..."
  }
}
```

### GET `/interviews/:id`

Returns a question set by ID with all questions.

## Users

### GET `/users`

Recruiter-only. Lists all users. Paginated.

Query: `?page=1&limit=20&role=STUDENT&search=ava`

### GET `/users/:id`

Returns a single user by ID.

## Authorization Summary

| Role | Can do |
|------|--------|
| STUDENT | Manage own resumes, uploads, and applications; preview matches |
| RECRUITER | Manage own job postings; review applications; generate interview questions; list users |
| Both | Read own profile; update own profile; list jobs |
