import { StudentStatsHandler } from "./student.handlers.js";
import { studentStatsSchema } from "./student.schema.js";
import type { FastifyInstance } from "fastify";

// eslint-disable-next-line require-await
export async function statsStudentRoute(app: FastifyInstance) {
  const studentStatsHandler = new StudentStatsHandler();
  app.get(
    "/stats/student",
    { schema: studentStatsSchema },
    studentStatsHandler.studentStats,
  );
}
