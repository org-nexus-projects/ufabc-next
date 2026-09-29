---
paths:
  - 'apps/core/src/models/**'
  - 'packages/db/**'
---

# Mongoose models and data

- Schema, index, and hook changes are "Ask first". They hit production data on the next deploy of `main`.
- Hooks carry business logic (enrollments -> groups, comment uniqueness, reaction counters).
  `updateMany`, `bulkWrite`, and `findOneAndUpdate` skip document hooks; check the model before using them.
- New fields must be optional or have a default: existing documents do not have them.
  A required field or a new unique index needs a backfill plan in the PR description.
- Index changes build on the live cluster. Prefer adding an index over changing one, and mention collection size.
- Never write migration or cleanup scripts that run against production from a local machine.
- Use `.lean()` for read-only queries and project only the fields you need.
- Use the `data-model` skill for collection relationships and field meanings before writing queries.
