# HireLens AI PRD V2

## 1. Product Summary

HireLens AI helps students improve job readiness and helps recruiters reduce manual resume screening time.

The MVP focuses on:

- Resume ingestion and parsing
- Job description creation and parsing
- Resume-to-job match scoring
- Skill gap analysis
- AI-assisted interview question generation
- Recruiter candidate ranking for a specific job posting

## 2. Product Goals

### Student Goals

- Understand how well a resume aligns with a specific job
- See missing or weak skill areas
- Improve interview preparation using JD-aware questions

### Recruiter Goals

- Create job postings quickly
- View applicants ranked against a posting
- Review structured candidate summaries faster than raw PDFs

## 3. Non-Goals for MVP

- Full ATS replacement
- Email automation
- Calendar scheduling
- Multi-language resume parsing
- Real-time collaborative hiring workflows
- Advanced analytics dashboards

## 4. User Roles

### Student

- Register and log in
- Manage own profile
- Upload and replace own resumes
- Submit a resume against a job posting or pasted job description
- View own match results and interview questions

### Recruiter

- Register and log in
- Create and manage own job postings
- View applications submitted to own job postings
- View ranking results and candidate summaries for own job postings

### Admin

Not included in MVP application scope. Operational access can be handled outside the app initially.

## 5. MVP User Flows

### Student Flow

1. Student signs up and logs in.
2. Student uploads a resume PDF.
3. System extracts resume text and skills.
4. Student selects an existing job posting or pastes a custom JD.
5. System calculates match score and missing skills.
6. Student views recommended interview questions.

### Recruiter Flow

1. Recruiter signs up and logs in.
2. Recruiter creates a job posting.
3. Students apply to that posting with a resume.
4. System parses applications and computes ranking.
5. Recruiter reviews ranked candidates and skill gap summaries.

## 6. Functional Requirements

### 6.1 Authentication

- Register with name, email, password, and role
- Login with email and password
- Get current authenticated profile
- Logout on client by discarding tokens
- Passwords must be hashed
- Role-based authorization must be enforced on protected routes

### 6.2 Profile

- View own profile
- Update basic profile metadata

### 6.3 Resume Management

- Upload PDF resume
- Validate MIME type and file size
- Store file in cloud storage
- Extract raw text from PDF
- Extract normalized skills
- Mark one resume as the default active resume
- View own resume list and individual resume details
- Soft-delete or archive a resume if it is not required for active records

### 6.4 Job Posting Management

- Recruiter can create, update, view, list, and archive job postings
- Job posting includes title, description, skills, location mode, employment type, and status
- System extracts normalized skills from the job description

### 6.5 Applications

- Student can apply to a recruiter job posting using one of their resumes
- A student can have at most one active application per resume per job posting in MVP
- Recruiter can list applications only for their own job postings

### 6.6 Matching

- System generates match results for a resume against a job posting or custom JD
- Result must include:
  - overall score
  - matched skills
  - missing skills
  - optional strengths
  - scoring version
- Matching logic must be deterministic for the non-AI MVP path

### 6.7 Interview Question Generation

- Generate job-aware interview questions
- Questions should be categorized by difficulty and focus area
- Students can regenerate questions for a given match context
- MVP can use templates plus extracted skills; full LLM generation is optional

### 6.8 Recruiter Ranking

- Recruiters can view candidate rankings per job posting
- Ranking must be based on each application’s latest match result
- Ranking view must show explainability fields, not score only

## 7. Non-Functional Requirements

- Responsive design for desktop and mobile
- P95 API response under 1.5s for standard CRUD endpoints
- Long-running parse and AI operations designed to move async later
- Centralized error handling
- Secure authentication and authorization
- Audit-friendly result versioning
- Free-tier-compatible deployment choices

## 8. Success Metrics for MVP

- Student receives a match result within 10 seconds for standard PDFs under the allowed limit
- Recruiter can view ranked applicants for a job posting in under 3 seconds once data is processed
- At least 95% of valid uploads complete without manual intervention
- Parsing and matching failures are visible in logs with traceable request IDs

## 9. Constraints and Assumptions

- PDF resumes only in MVP
- English-language resumes and job descriptions only
- Single-region deployment
- No background queue required on day one, but service boundaries must allow one later

## 10. Privacy and Data Handling

- Resume content is private to the owning student and recruiters who own the associated job posting application
- Raw uploaded files and parsed text are sensitive data
- Delete behavior must be documented and predictable
- Secrets must never be logged

## 11. Release Decision

Implementation should start only after the V2 API contracts, Prisma schema, and authorization rules are accepted as the baseline.
