import { StudentStatsHandler } from "./student.handlers.js";
import { studentStatsSchema } from "./student.schema.js";
import type { FastifyInstance } from "fastify";


export async function statsStudentRoute(app: FastifyInstance) {
  const studentStatsHandler = new StudentStatsHandler();
  app.get(
    "/stats/student",
    { schema: studentStatsSchema },
    studentStatsHandler.studentStats,
  );
}
