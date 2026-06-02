# Database Design V2

## Design Principles

- Model recruiter workflows around job postings and applications
- Preserve ownership boundaries explicitly
- Store parsing and matching outputs in a version-friendly way
- Keep the schema simple enough for MVP while avoiding dead-end shortcuts

## Core Entities

### User

- Represents both students and recruiters
- Role controls authorization behavior

### Resume

- Owned by a student
- Stores file metadata, parsed text, and parsing status

### JobPosting

- Owned by a recruiter
- Stores JD text, extracted skills, and status

### Application

- Connects a student resume to a recruiter job posting
- Scope for recruiter ranking and candidate review

### MatchResult

- Stores a score, matched skills, missing skills, strengths, and scoring version
- May attach either to an application or to a private student preview flow

### InterviewQuestionSet

- Stores generated questions tied to a source context

## MVP Tables

- `users`
- `resumes`
- `job_postings`
- `applications`
- `match_results`
- `refresh_tokens`
- `interview_question_sets`
- `interview_questions`

## Notes on Skills

Skills are stored as string arrays in MVP for speed of delivery, but the service layer should normalize casing and deduplicate values. If reporting/search becomes important, move to dedicated skill tables in V3.

## Notes on Deletes

- Users should not be hard-deleted in normal flows.
- Resumes and job postings should be archived using status fields or `deletedAt`.
- Historical match results should remain intact for auditability.
