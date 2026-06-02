# API Specification V2

Base path: `/api/v1`

All protected endpoints require `Authorization: Bearer <token>`.

## Standard Response Shapes

### Success

```json
{
  "success": true,
  "data": {}
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

## Auth

### POST `/auth/register`

Registers a student or recruiter account.

Request:

```json
{
  "name": "Ava Sharma",
  "email": "ava@example.com",
  "password": "StrongPassword123!",
  "role": "STUDENT"
}
```

Response:

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

Authenticates a user and returns an access token plus a refresh token.

### POST `/auth/refresh`

Rotates a valid refresh token and returns a new access token plus refresh token pair.

### POST `/auth/logout`

Revokes the submitted refresh token.

### GET `/auth/profile`

Returns the authenticated user profile.

## Users

### PATCH `/users/me`

Updates allowed profile fields for the authenticated user.

## Resumes

### POST `/resumes`

Upload a PDF resume for the authenticated student.

Multipart fields:

- `file`: PDF file
- `label`: optional human-readable name

Response data:

```json
{
  "id": "res_123",
  "status": "READY",
  "fileUrl": "https://...",
  "parsedTextAvailable": true,
  "skills": ["TypeScript", "React", "PostgreSQL"]
}
```

### GET `/resumes`

Lists the authenticated student’s resumes.

### GET `/resumes/:resumeId`

### DELETE `/resumes/:resumeId`

Archive a resume owned by the authenticated student.

## Job Postings

### POST `/jobs`

Recruiter-only endpoint.

Request:

```json
{
  "title": "Backend Engineer Intern",
  "description": "Build Node.js APIs with PostgreSQL and Docker.",
  "employmentType": "INTERNSHIP",
  "locationMode": "REMOTE"
}
```

### GET `/jobs`

Public list of active job postings with pagination.

### GET `/jobs/:jobId`

### PATCH `/jobs/:jobId`

Recruiter owner only.

### DELETE `/jobs/:jobId`

Archive recruiter-owned posting.

## Applications

### POST `/applications`

Student applies to a recruiter job using an owned resume.

Request:

```json
{
  "jobId": "job_123",
  "resumeId": "res_123"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "application": {
      "id": "app_123",
      "status": "SUBMITTED"
    },
    "latestMatchResult": {
      "score": 85,
      "matchedSkills": ["Node.js", "PostgreSQL"],
      "missingSkills": ["Docker", "Redis"],
      "scoreVersion": "v1"
    }
  }
}
```

### GET `/applications/me`

Student lists own applications.

### GET `/jobs/:jobId/applications`

Recruiter lists applications for own job posting.

## Matching

### POST `/matching/preview`

Student-only endpoint for matching a resume against a pasted custom JD without creating a recruiter job posting.

Request:

```json
{
  "resumeId": "res_123",
  "jobTitle": "Backend Engineer Intern",
  "jobDescription": "Need Node.js, PostgreSQL, Docker, and Redis."
}
```

Response:

```json
{
  "success": true,
  "data": {
    "score": 75,
    "matchedSkills": ["Node.js", "PostgreSQL"],
    "missingSkills": ["Docker", "Redis"],
    "strengths": ["Relevant backend project experience"],
    "scoreVersion": "v1"
  }
}
```

## Interview

### POST `/interview/generate`

Request:

```json
{
  "resumeId": "res_123",
  "jobId": "job_123"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "question": "How would you design a REST API for resume screening?",
        "difficulty": "MEDIUM",
        "category": "SYSTEM_DESIGN"
      }
    ]
  }
}
```

## Recruiter Ranking

### GET `/jobs/:jobId/rankings`

Recruiter owner only.

Response includes paginated ranking rows with candidate, score, explainability, and application status.

## Pagination Contract

List endpoints return:

```json
{
  "success": true,
  "data": {
    "items": [],
    "page": 1,
    "pageSize": 10,
    "totalItems": 42,
    "totalPages": 5
  }
}
```

## Authorization Rules

- Students cannot access other students’ resumes or applications.
- Recruiters can only manage job postings they created.
- Recruiters can only access applications and rankings for their own job postings.
- Students can only generate interview questions using their own resume and an accessible job context.
