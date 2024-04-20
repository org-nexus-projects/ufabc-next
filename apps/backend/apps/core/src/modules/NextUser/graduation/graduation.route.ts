import { GraduationModel } from "@/models/Graduation.js";
import { GraduationSubjectModel } from "@/models/GraduationSubject.js";
import { admin } from "@/hooks/admin.js";
import { authenticate } from "@/hooks/authenticate.js";
import { GraduationRepository } from "./graduation.repository.js";
import { GraduationService } from "./graduation.service.js";
import { GraduationHandler } from "./graduation.handlers.js";
import type { FastifyInstance } from "fastify";

// eslint-disable-next-line require-await
export async function graduationRoutes(app: FastifyInstance) {
  const graduationRepository = new GraduationRepository(
    GraduationModel,
    GraduationSubjectModel,
  );
  const graduationService = new GraduationService(graduationRepository);
  const graduationHandler = new GraduationHandler(graduationService);

  app.decorate("graduationService", graduationService);

  app.get<{ Querystring: { limit: number } }>(
    "/",
    { onRequest: [authenticate] },
    graduationHandler.listGraduations,
  );
  app.get(
    "/subjects",
    { onRequest: [authenticate, admin] },
    graduationHandler.listGraduationsSubjects,
  );
  app.get<{ Params: { graduationId: number }; Querystring: { limit: number } }>(
    "/subjects/:graduationId",
    // {
    //   onRequest: [authenticate, admin],
    // },
    graduationHandler.listGraduationSubjectsByGraduationId,
  );
}
