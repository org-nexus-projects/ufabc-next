---
name: data-model
description: MongoDB data model of UFABC Next (collections, fields, relationships, indexes, Mongoose hooks). Use before writing or reviewing a query, aggregation, schema change, migration, or backfill, or when a question mentions users, alunos, enrollments, disciplinas, teachers, subjects, comments, reactions, groups, histories, graduations, summaries, RA, season, or conceito.
---

# UFABC Next data model

The full collection reference is in [collections.md](collections.md). Read the section for every collection
you are about to touch, then open the model file it points to: the model is the source of truth.

## Mental model

- A **student** is identified by `ra` everywhere. Collections join on `ra`, not on `users._id`.
  `users.ra` is a Number; `comments.ra` is a String. Cast when you join.
- A **season** is `"<year>:<quad>"`. Filter by `season` when an index exists for it; otherwise by `year` + `quad`.
- `subjects` is the catalog. `disciplinas` (model `ComponentModel`) is one offering of a subject in a season,
  with `teoria`/`pratica` teachers. `enrollments` is one student in one offering, with `conceito` once graded.
- `histories` is the transcript scraped from SIGAA; `historiesgraduations` scopes it to one curriculum
  (`graduations` + `subjectgraduations`).
- `comments` are reviews of a teacher, tied to an enrollment (one per enrollment and type);
  `reactions` update `comments.reactionsCount` through hooks. `summaries` are AI summaries of those comments.
- `student_sync` and `history_processing_jobs` (in `packages/db`) track the ufabc-parser webhook pipeline.

## Before writing a query

1. Check the indexes in the collection section. A query on `enrollments` or `comments` without an indexed
   filter scans a large collection in production.
2. Check the hooks. `enrollments` joins students to `groups` in `post('findOneAndUpdate')`;
   `comments` enforce uniqueness in `pre('save')`; `reactions` keep counters in `post('save')`/`post('deleteOne')`.
   `updateMany`, `bulkWrite`, and raw driver calls skip them, so the side effects must be done by hand.
3. Use `.lean()` for reads and project only needed fields. Never return a full `users` document: it holds OAuth ids and devices.
4. Treat RA, email, grades, and history as personal data: do not log them at `info` or above, and do not
   return them from an endpoint that another student can call.

## Changing the model

Schema, index, and hook changes are "Ask first" (see `.claude/rules/core-models.md`). In the proposal include:
the collection, whether existing documents need a backfill, the new or changed index, and every reader of the field
(`rg "<field>" apps packages -g '!node_modules'`). Update [collections.md](collections.md) in the same change.
