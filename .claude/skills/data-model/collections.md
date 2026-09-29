# UFABC Next — MongoDB collections

Reference for the `data-model` skill. Adapted from the `ufabc_next/data-engineer` skill in
`org-nexus-projects/nexus-modules-skills` and checked against `apps/core/src/models` and `packages/db/src/models`.
When this file and a model disagree, the model wins; update this file in the same PR.

## Collections

### 1. `users`
**File**: `apps/core/src/models/User.ts`

Student/user accounts and authentication.

| Field | Type | Notes |
|---|---|---|
| `ra` | Number | Registration number. Unique with partial filter (only when present) |
| `email` | String | UFABC email, validates domain. Unique with partial filter |
| `confirmed` | Boolean | Email confirmation status (default: false) |
| `expiresAt` | Date | TTL index — auto-deletes unconfirmed accounts |
| `active` | Boolean | Soft-active flag (default: true) |
| `oauth.facebook` / `oauth.google` / `oauth.email` | String | OAuth provider IDs |
| `oauth.picture` | String | Profile picture URL |
| `devices` | Array | Push notification devices: `{ phone, token, deviceId }` |
| `permissions` | String[] | Role-based permission strings |

**Indexes**: TTL on `expiresAt`

---

### 2. `alunos` (students)
**File**: `apps/core/src/models/Student.ts`

Snapshot of student data per academic term.

| Field | Type | Notes |
|---|---|---|
| `ra` | Number | Registration number |
| `login` | String | UFABC portal login |
| `aluno_id` | Number | External ID |
| `cursos` | Array | Courses array with academic coefficients: `{ id_curso, nome_curso, cp, cr, ca, ind_afinidade, turno, creditos_* }` |
| `year` | Number | Academic year |
| `quad` | Number | Academic quarter (1–3) |
| `season` | String | Combined year+quad key (e.g. `2024:1`) |

---

### 3. `enrollments`
**File**: `apps/core/src/models/Enrollment.ts`

A student's enrollment in a specific course offering for a term.

| Field | Type | Notes |
|---|---|---|
| `ra` | Number | Student registration |
| `year` / `quad` | Number | Academic period |
| `season` | String | `year:quad` key |
| `identifier` | String | Course offering identifier |
| `disciplina` | String | Course name |
| `subject` | ObjectId | → `subjects` |
| `teoria` / `pratica` / `mainTeacher` | ObjectId | → `teachers` |
| `campus` / `turno` / `turma` | String | Class logistics |
| `conceito` | String | Final grade (A/B/C/D/F/O) |
| `creditos` | Number | Credit hours |
| `ca_acumulado` / `cr_acumulado` / `cp_acumulado` | Number | Cumulative academic coefficients |
| `comments` | String[] | Enum: `['teoria', 'pratica']` — comment types submitted |
| `syncedBy` | String | Sync source: `extension`, `matricula`, `ufabc-parser` |
| `kind` | String | Enrollment event: `ajuste`, `reajuste`, `auto` |
| `uf_cod_turma` | String | UFABC internal class code |
| `disciplina_id` | Number | UFABC internal offering ID |

**Indexes**:
- `{ identifier: asc, ra: asc }`
- `{ ra: asc }`
- `{ conceito: asc }`
- `{ mainTeacher, subject, cr_acumulado, conceito }`

**Hooks**:
- `pre('findOneAndUpdate')`: Sets `mainTeacher` from `teoria` or `pratica`
- `post('findOneAndUpdate')`: Adds student to the corresponding `groups` document

---

### 4. `teachers`
**File**: `apps/core/src/models/Teacher.ts`

Instructor records.

| Field | Type | Notes |
|---|---|---|
| `name` | String | Normalized to lowercase on save |
| `alias` | String[] | Alternative names |
| `siape` | String | Government ID. Unique, sparse |
| `externalKey` | String | External system key. Unique, sparse |

**Indexes**:
- Text index on `name` (weight 10) and `alias` (weight 5)
- `{ siape: 1 }` unique sparse
- `{ externalKey: 1 }` unique sparse

**Helpers**: `findBestLevenshteinMatch()` for fuzzy name matching

---

### 5. `subjects`
**File**: `apps/core/src/models/Subject.ts`

Academic subject master records.

| Field | Type | Notes |
|---|---|---|
| `name` | String | Display name |
| `search` | String | Normalized name for text search |
| `uf_subject_code` | String[] | UFABC subject codes. Unique, sparse |
| `creditos` | Number | Credit hours |

---

### 6. `disciplinas` (components)
**File**: `apps/core/src/models/Component.ts`

A specific class offering for a subject in a given term and turma.

| Field | Type | Notes |
|---|---|---|
| `disciplina_id` | Number | UFABC internal ID |
| `disciplina` | String | Course name |
| `subject` | ObjectId | → `subjects` |
| `teoria` / `pratica` | ObjectId | → `teachers` |
| `turno` | String | `diurno` or `noturno` |
| `turma` | String | Class section |
| `vagas` | Number | Available seats |
| `campus` | String | `sao bernardo` or `santo andre` |
| `tpi` | Number[3] | Theory/Practice/Individual hours |
| `alunos_matriculados` | Number[] | RAs of enrolled students |
| `before_kick` / `after_kick` | Number[] | RAs before/after enrollment adjustment |
| `obrigatorias` | Number[] | IDs of mandatory courses this satisfies |
| `identifier` | String | Course offering identifier |
| `uf_cod_turma` | String | UFABC internal class code |
| `year` / `quad` / `season` | Mixed | Academic period |
| `ideal_quad` | Boolean | Whether offered in ideal curriculum quarter |
| `kind` | String | Data source: `api` or `file` |
| `groupURL` | String | Linked group URL |
| `priorityOnCreateGroup` | Boolean | Group creation priority flag |

**Indexes**: `{ identifier: asc }`

---

### 7. `groups`
**File**: `apps/core/src/models/Group.ts`

Study groups automatically created per course+teacher+term.

| Field | Type | Notes |
|---|---|---|
| `disciplina` | String | Course name |
| `season` | String | Academic term |
| `mainTeacher` | ObjectId | → `teachers` |
| `users` | Number[] | RAs of members |

**Indexes**:
- `{ users: desc }`
- `{ mainTeacher: desc, season: desc, disciplina: desc }`

---

### 8. `comments`
**File**: `apps/core/src/models/Comment.ts`

Student reviews of teachers.

| Field | Type | Notes |
|---|---|---|
| `comment` | String | Review text |
| `ra` | String | Author's registration number |
| `enrollment` | ObjectId | → `enrollments` |
| `teacher` | ObjectId | → `teachers` |
| `subject` | ObjectId | → `subjects` |
| `type` | String | `teoria` or `pratica` |
| `active` | Boolean | Soft-delete flag |
| `viewers` | Number | View count |
| `reactionsCount.like` / `.recommendation` / `.star` | Number | Aggregated reaction counts |

**Indexes**:
- `{ comment: asc, user: asc }`
- `{ reactionsCount: desc }`
- `{ 'reactionsCount.recommendation': desc, 'reactionsCount.likes': desc, createdAt: desc }`

**Hooks**:
- `pre('save')`: Enforces one comment per enrollment+type
- `post('save')`: Marks enrollment's `comments` array
- `post('find')`: Increments `viewers`

---

### 9. `reactions`
**File**: `apps/core/src/models/Reaction.ts`

Reactions (likes, recommendations, stars) on comments.

| Field | Type | Notes |
|---|---|---|
| `kind` | String | `like`, `recommendation`, or `star` |
| `comment` | ObjectId | → `comments` |
| `user` | ObjectId | → `users` |
| `active` | Boolean | Soft-delete flag |
| `slug` | String | Composite dedup key: `userId:commentId:kind` |

**Indexes**: `{ comment: asc, kind: asc }`

**Hooks**:
- `pre('save')`: Validates slug uniqueness and recommendation rules
- `post('save')` / `post('deleteOne')`: Recalculates `comment.reactionsCount`

---

### 10. `histories`
**File**: `apps/core/src/models/History.ts`

Full academic transcript for a student in a given course.

| Field | Type | Notes |
|---|---|---|
| `ra` | Number | Student registration |
| `curso` | String | Degree program |
| `grade` | String | Curriculum grid year |
| `disciplinas` | Array | All completed courses: `{ periodo, codigo, disciplina, ano, situacao, creditos, categoria, conceito, turma, teachers[], disciplina_id, identifier }` |
| `coefficients` | Object | Nested map: `season → { ca_quad, ca_acumulado, cr_quad, cr_acumulado, cp_acumulado, percentage_approved, accumulated_credits, period_credits }` |

**Indexes**: `{ curso: asc, grade: asc }`

---

### 11. `graduations`
**File**: `apps/core/src/models/Graduation.ts`

Curriculum/graduation program definition.

| Field | Type | Notes |
|---|---|---|
| `curso` | String | Degree program name |
| `grade` | String | Curriculum grid year |
| `locked` | Boolean | Prevents modifications |
| `mandatory_credits_number` | Number | Required mandatory credits |
| `limited_credits_number` | Number | Required limited-choice credits |
| `free_credits_number` | Number | Required free-choice credits |
| `credits_total` | Number | Total credits required |
| `creditsBreakdown` | Array | Per-term credit expectations: `{ year, quad, choosableCredits }` |

**Indexes**: `{ curso: asc, grade: asc }`

---

### 12. `historiesgraduations` (graduation history)
**File**: `apps/core/src/models/GraduationHistory.ts`

A student's history scoped to a specific graduation curriculum.

| Field | Type | Notes |
|---|---|---|
| `ra` | Number | Student registration |
| `curso` | String | Degree program |
| `grade` | String | Curriculum grid year |
| `graduation` | ObjectId | → `graduations` |
| `disciplinas` | Array | Completed courses (same structure as `histories.disciplinas`) |
| `coefficients` | Object | Nested coefficients map (same structure as `histories`) |

---

### 13. `subjectgraduations`
**File**: `apps/core/src/models/GraduationSubject.ts`

Links a subject to a graduation curriculum, including category classification.

| Field | Type | Notes |
|---|---|---|
| `subject` | ObjectId | → `subjects` |
| `graduation` | ObjectId | → `graduations` |
| `codigo` | String | Subject code |
| `creditos` | Number | Credit hours |
| `year` / `quad` | Number | Term when offered in the curriculum |
| `category` | String | `mandatory`, `limited`, or `free` |
| `subcategory` | String | `firstLevelMandatory`, `secondLevelMandatory`, `thirdLevelMandatory` |
| `confidence` | String | Confidence level of category classification |
| `equivalents` | String[] | Codes for equivalent subjects |

**Indexes**: `{ graduation: asc }`

---

### 14. `student_sync`
**File**: `packages/db/src/models/student-sync.ts`

Tracks the processing state of student data synchronization jobs.

| Field | Type | Notes |
|---|---|---|
| `ra` | String | Student registration (indexed) |
| `status` | String | `created` → `awaiting` → `processing` → `completed` / `failed` / `in_queue` |
| `timeline` | Array | Status history: `{ status, timestamp, metadata }` |
| `payload` | Mixed | Raw payload for debugging |
| `error` | String | Error message if failed |
| `externalIds.serviceId` / `.jobId` / `.webhookId` | String | Integration tracking IDs |
| `metrics.totalDuration` | Number | Total processing time (ms) |
| `metrics.stepDurations` | Map | Per-step durations (ms) |

**Indexes**: `{ ra: 1 }`

**Methods**: `transition(status, metadata?)`, `markFailed(error, metadata?)`

---

### 15. `history_processing_jobs`
**File**: `packages/db/src/models/history-processing-job.ts`

Tracks webhook-driven history processing jobs with retry support.

| Field | Type | Notes |
|---|---|---|
| `ra` | String | Student registration (indexed) |
| `idempotencyKey` | String | Unique key for webhook replay safety |
| `status` | String | `created` → `in_queue` → `processing` → `completed` / `failed` |
| `timeline` | Array | Status history: `{ status, timestamp, metadata }` |
| `payload` | Mixed | Raw webhook payload |
| `error.code` / `.message` / `.details` | Mixed | Error info if failed |
| `retryCount` / `maxRetries` | Number | Retry tracking (default max: 3) |
| `traceId` | String | Correlation ID from request header |
| `source` | String | `webhook`, `retry`, or `manual` |
| `enrollments` | ObjectId[] | → `enrollments` (created/updated by this job) |

**Indexes**:
- `{ status: 1, createdAt: 1 }`
- `{ idempotencyKey: 1 }` unique
- `{ ra: 1, createdAt: -1 }`
- `{ enrollments: 1 }`
- TTL (7 days) on `createdAt` with partial filter for `completed`/`failed` jobs

**Methods**: `transition()`, `markFailed()`, `addTimelineEvent()`, `addEnrollmentReferences()`

---

### 16. `summaries`
**File**: `apps/core/src/models/Summary.ts`

AI-generated summary of the comments about a teacher (optionally per subject). Served by `GET /v2/teachers/:teacherId/summary`.

| Field | Type | Notes |
|---|---|---|
| `teacher` | ObjectId | → `teachers`, required |
| `subject` | ObjectId | → `subjects`, `null` for the teacher-wide summary |
| `summary` | String | Generated text |
| `didacticQuality` | Number | 0–5 or `null` |
| `takesAttendance` / `usesSigaa` / `usesMoodle` | Boolean | `null` when the comments do not say |
| `commentsCount`, `oldestComment`, `newestComment` | Number / Date | Input window used for generation |
| `model` / `promptVersion` | String | LLM model and prompt version that produced it |
| `status` | String | `active` or `inactive`; only one `active` summary is read |

**Indexes**: `SummaryTeacherLookupIndex` on `{ teacher, subject, status, createdAt: -1 }`

---

### 17. `component_archives`
**File**: `apps/core/src/models/ComponentArchive.ts`

PDFs (plano de ensino etc.) downloaded for a class offering and stored in S3.

| Field | Type | Notes |
|---|---|---|
| `component` | ObjectId | → `disciplinas` |
| `s3_key` | String | Object key once stored |
| `original_url` | String | Source URL |
| `status` | String | `created` → `downloaded` → `stored`, or `failed` / `deleted` |
| `timeline` | Array | `{ status, timestamp, metadata }` |

**Indexes**: `{ component: 1, status: 1 }`, `{ component: 1, original_url: 1 }` unique

---

### 18. `disciplinas_metadata`
**File**: `apps/core/src/models/ComponentMetadata.ts`

Parsed content of a class offering's plan: `planejamento`, `ementa`, `objetivos`, `metodologia`, `avaliacao`,
`cronograma`, plus `metadata.{ source_file, processed_at, disciplina_id, component_code, component_data }`.

**Indexes**: `{ 'metadata.component_code': 'asc' }`

## Relationship Map

```
users ──────────────────────────────────────────────────────────────────┐
                                                                         │ ref
reactions ──── ref ──► comments ──── ref ──► enrollments ◄── ref ───────┤
    │                      │                      │                      │
    └──── ref ──► users     ├─ ref ──► teachers ◄─┤                      │
                            ├─ ref ──► subjects ◄─┤                      │
                            └─ (viewers via hook)  │                      │
                                                   ├─ ref ──► teachers    │
disciplinas ─── ref ──► subjects                  ├─ ref ──► subjects    │
disciplinas ─── ref ──► teachers                  └─ auto ──► groups     │
groups ───────── ref ──► teachers                                         │
                                                                         │
alunos ──────────────────────────────────────────────────────────────────┘
   (keyed by ra, no direct ObjectId refs)

graduations ◄── ref ── subjectgraduations ── ref ──► subjects
graduations ◄── ref ── historiesgraduations
summaries ── ref ──► teachers, subjects
component_archives ── ref ──► disciplinas
histories ─────────────── (standalone, keyed by ra + curso + grade)

student_sync ────────────── (standalone, keyed by ra)
history_processing_jobs ─── ref ──► enrollments
```

---

## Key Design Patterns

| Pattern | Where |
|---|---|
| **TTL auto-expiry** | `users.expiresAt` (unconfirmed accounts), `history_processing_jobs` (7d after completion) |
| **Partial unique indexes** | `users.ra`, `users.email` — unique only when the field exists |
| **Timeline embedded arrays** | `student_sync`, `history_processing_jobs` — full audit trail of status transitions |
| **Idempotency keys** | `history_processing_jobs.idempotencyKey` — webhook replay safety |
| **Soft deletes** | `comments.active`, `reactions.active` |
| **Text search** | `teachers` — weighted text index on `name` (10) and `alias` (5) |
| **Denormalized counts** | `comments.reactionsCount.*` — kept in sync via Reaction hooks |
| **Auto-join via hooks** | Enrollment post-save hook adds student RA to `groups.users` |
| **Slug dedup** | `reactions.slug` = `userId:commentId:kind` prevents duplicate reactions |
| **Coefficients map** | `histories` and `historiesgraduations` store coefficients as nested map keyed by season |
