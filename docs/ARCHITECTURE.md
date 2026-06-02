# Architecture and Folder Structure V2

## Architecture Overview

HireLens AI should use a modular monorepo with separate frontend and backend applications.

- `frontend`: React + TypeScript client
- `backend`: Node.js + Express + TypeScript API
- `docs`: product and engineering documentation

The backend follows a modular MVC pattern:

- `routes`: route declarations and middleware wiring
- `controllers`: request/response orchestration only
- `services`: business logic and provider orchestration
- `repositories`: Prisma data access wrappers where reuse justifies them
- `validators`: request schemas
- `middleware`: auth, error handling, rate limiting, request context
- `providers`: external adapters such as storage, parsing, and AI

## Design Decisions

### 1. Separate parsing, matching, and interview generation

These are independent domains with different performance and provider concerns. Keeping them separate makes AI provider swaps and async migration easier.

### 2. Model applications explicitly

Recruiter ranking only makes sense relative to a job posting. A direct recruiter-to-resume relationship is not sufficient.

### 3. Version scoring logic

Every match result should include a scoring version so ranking history remains interpretable after algorithm updates.

### 4. Prefer normalized skills plus source snapshots

Store extracted skills in structured form, but also keep raw parsed text for audit and future improvement.

## Recommended Folder Structure

```text
hirelens-ai/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── resumes/
│   │   │   ├── jobs/
│   │   │   ├── applications/
│   │   │   ├── matching/
│   │   │   └── interview/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   └── public/
├── backend/
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── config/
│   │   ├── constants/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── resumes/
│   │   │   ├── jobs/
│   │   │   ├── applications/
│   │   │   ├── matching/
│   │   │   └── interview/
│   │   ├── providers/
│   │   │   ├── ai/
│   │   │   ├── parser/
│   │   │   └── storage/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── types/
│   │   ├── utils/
│   │   └── validators/
│   ├── tests/
│   │   ├── integration/
│   │   ├── unit/
│   │   └── fixtures/
│   └── prisma/
│       ├── schema.prisma
│       └── migrations/
├── docs/
└── AGENTS.md
```

## Module Responsibilities

### Auth Module

- Registration
- Login
- Current user profile
- Password hashing and token issuance

### Resume Module

- Upload lifecycle
- Resume parsing orchestration
- Resume ownership checks

### Job Module

- Job CRUD
- JD parsing
- Recruiter ownership checks

### Application Module

- Apply to job
- Application status tracking
- Recruiter-scoped access

### Matching Module

- Match score calculation
- Skill gap analysis
- Explainability output

### Interview Module

- Template or AI-generated questions
- Difficulty tagging
- Match-context-aware generation

## Cross-Cutting Requirements

- Request ID per request
- Structured logger
- Standard error response
- Validation at route boundary
- Role-based auth middleware
- Pagination for list endpoints
