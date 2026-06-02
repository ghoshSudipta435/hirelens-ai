# Staff Review of V1 Specification

This review evaluates the provided V1 PRD, API notes, schema outline, folder structure, and engineering rules.

## Critical Gaps

1. Authorization boundaries are undefined.
   The current spec defines student and recruiter roles, but it does not specify which resources each role can create, read, update, or delete. Without explicit authorization rules, the first implementation will likely leak candidate data across users.

2. The data model is too shallow for recruiter workflows.
   Recruiters need job postings, applications, candidate-job relationships, and ranking scoped to a specific posting. The current tables do not model applications at all, so candidate ranking cannot be implemented correctly.

3. Matching results are modeled as a single flat record.
   A match score without versioning, scoring rationale, extracted skills, or source snapshots is not auditable. If parsing or scoring logic changes later, historical results become misleading and irreproducible.

4. Resume ownership and visibility are underspecified.
   It is unclear whether a student resume is private, shareable to selected job postings, or globally visible to recruiters. That ambiguity has both privacy and product implications.

5. AI features are not isolated behind a provider boundary.
   The stack mentions OpenAI later and HuggingFace now, but the spec does not define a provider abstraction. Implementing directly against one provider now would create avoidable lock-in.

## High-Risk Issues

1. Auth is incomplete.
   The current auth spec has register, login, and profile only. It omits password hashing requirements, token expiry, refresh strategy, logout semantics, email uniqueness behavior, password reset, and rate limiting.

2. File upload and parsing flows are incomplete.
   Resume upload requires file validation, malware/format handling assumptions, PDF extraction behavior, storage lifecycle rules, and failure handling. None of these are documented.

3. Job descriptions are modeled too narrowly.
   The current schema stores title, description, and skills, but not owner, status, employment type, location, seniority, or recruiter association. Recruiter dashboards will become ad hoc without those fields.

4. API contracts are too thin to support frontend work safely.
   Responses are mostly placeholder examples with no pagination, error shape, validation rules, or authorization outcomes. This will create frontend-backend drift immediately.

5. The folder structure is not sufficient for maintainability.
   Shared validation, DTOs, logging, background jobs, provider adapters, and test fixtures are not represented. The structure needs to anticipate modular growth without overengineering.

## Medium-Term Scalability Concerns

1. Skill extraction is treated as a single field instead of normalized data.
   If skills remain a text array embedded in multiple tables, analytics, deduplication, and ranking quality will degrade quickly.

2. Matching and interview generation are designed as synchronous endpoints only.
   AI-assisted workflows can become slow or rate-limited. The API should be designed so these operations can move to background jobs without contract churn.

3. There is no observability plan.
   No logging, metrics, tracing, or audit guidance is included. That makes debugging match quality and upload failures much harder.

4. Candidate ranking lacks explainability requirements.
   Recruiters need to know why a score was assigned. A black-box score alone will erode trust.

## Missing Requirements

- Pagination, filtering, and sorting rules
- Role-based access control matrix
- Application lifecycle states
- Upload size and file type limits
- Standard error response format
- Request validation standards
- Data retention and delete behavior
- Audit logging requirements
- Basic compliance/privacy expectations
- Rate limiting and abuse controls
- Non-functional targets with concrete numbers
- Test strategy beyond “generate unit tests”

## Recommended Direction

1. Model the product around users, resumes, job postings, and applications.
2. Treat parsing, matching, and interview generation as services with versioned outputs.
3. Make recruiter visibility explicit through applications or candidate sharing, not implicit global access.
4. Normalize skills enough to support gap analysis and search later.
5. Standardize API contracts, error handling, and security before coding starts.
