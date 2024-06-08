import { admin } from "@/hooks/admin.js";
import { authenticate } from "@/hooks/authenticate.js";
import {
  type SyncDisciplinasRequest,
  syncDisciplinasHandler,
} from "./handlers/syncDisciplinas.js";
import {
  type SyncEnrollmentsRequest,
  syncEnrollments,
} from "./handlers/syncEnrollments.js";
import {
  type SyncMatriculasRequest,
  syncMatriculasHandler,
} from "./handlers/syncMatriculas.js";
import {
  type ParseTeachersRequest,
  parseTeachersHandler,
} from "./handlers/syncTeachersToSubject.js";
import {
  parseTeachersSchema,
  syncDisciplinasSchema,
  syncEnrollmentsSchema,
  syncMatriculasSchema,
} from "./sync.schema.js";
import type { FastifyInstance } from "fastify";

// eslint-disable-next-line require-await
export async function syncRoutes(app: FastifyInstance) {
  app.post<SyncDisciplinasRequest>(
    "/disciplinas",
    { schema: syncDisciplinasSchema, preValidation: [authenticate, admin] },
    syncDisciplinasHandler,
  );

  app.get<SyncMatriculasRequest>(
    "/matriculas",
    { schema: syncMatriculasSchema, preValidation: [authenticate, admin] },
    syncMatriculasHandler,
  );

  app.post<SyncEnrollmentsRequest>(
    "/enrollments",
    { schema: syncEnrollmentsSchema, preValidation: [authenticate, admin] },
    syncEnrollments,
  );

  app.put<ParseTeachersRequest>(
    "/disciplinas/teachers",
    { schema: parseTeachersSchema, preValidation: [authenticate, admin] },
    parseTeachersHandler,
  );
}
