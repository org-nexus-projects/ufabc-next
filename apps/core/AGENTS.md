# Core API

Scope: `apps/core`, the Fastify API and its data-processing flows.

## Endpoint path

Before changing an endpoint, locate the handler that owns it. This API registers both explicit v2 controllers and filesystem routes; extend the existing path instead of creating a duplicate endpoint.

## Contract changes

When an API contract changes, account for its schema, handler, persistence path, `@next/services` client surface, and affected consumers.

Remote systems, database exports, and student records are sensitive-data boundaries. Follow the root instructions before operating on them.
