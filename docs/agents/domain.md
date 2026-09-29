# Domain docs

This repository uses a single-context domain documentation layout.

## Before exploring

Read the following when they are relevant:

- `CONTEXT.md` at the repository root.
- ADRs under `docs/adr/` that affect the area being changed.

If these files do not exist yet, proceed silently. They are created incrementally when domain terms and architectural decisions are resolved.

## Use the glossary vocabulary

Use terms as defined in `CONTEXT.md` consistently in:

- Code
- Tests
- Issue titles
- Specifications
- Documentation
- Technical communication

Do not replace established terms with synonyms that the glossary avoids.

If a required concept is missing, determine whether the proposed language is unnecessary or whether the glossary has a real gap.

## ADR conflicts

If a proposed change contradicts an existing ADR, surface the conflict explicitly instead of silently overriding the decision.
