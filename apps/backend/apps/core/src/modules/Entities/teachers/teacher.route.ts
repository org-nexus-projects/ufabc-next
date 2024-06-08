import { admin } from "@/hooks/admin.js";
import { authenticate } from "@/hooks/authenticate.js";
import { type Teacher, TeacherModel } from "@/models/Teacher.js";
import {
  TeacherHandler,
  type UpdateTeacherRequest,
} from "./teacher.handlers.js";
import { TeacherRepository } from "./teacher.repository.js";
import {
  createTeacherSchema,
  listAllTeachersSchema,
  removeTeacherSchema,
  searchTeacherSchema,
  teacherReviewSchema,
  updateTeacherSchema,
} from "./teacher.schema.js";
import { TeacherService } from "./teacher.service.js";
import type { FastifyInstance } from "fastify";

// eslint-disable-next-line require-await
export async function teacherRoutes(app: FastifyInstance) {
  const teacherRepository = new TeacherRepository(TeacherModel);
  const teacherService = new TeacherService(teacherRepository);
  app.decorate("teacherService", teacherService);
  const teacherHandler = new TeacherHandler(teacherService);

  app.get(
    "/teacher",
    { schema: listAllTeachersSchema, onRequest: [authenticate] },
    teacherHandler.listAllTeachers,
  );

  app.post<{ Body: Teacher }>(
    "/private/teacher",
    { schema: createTeacherSchema, onRequest: [authenticate, admin] },
    teacherHandler.createTeacher,
  );

  app.put<UpdateTeacherRequest>(
    "/private/teacher/:teacherId",
    { schema: updateTeacherSchema, onRequest: [authenticate, admin] },
    teacherHandler.updateTeacher,
  );

  app.get<{ Querystring: { q: string } }>(
    "/teacher/search",
    { schema: searchTeacherSchema, onRequest: [authenticate] },
    teacherHandler.searchTeacher,
  );

  app.get<{ Params: { teacherId: string } }>(
    "/teacher/review/:teacherId",
    { schema: teacherReviewSchema, onRequest: [authenticate] },
    teacherHandler.teacherReview,
  );

  app.delete<{ Params: { teacherId: string } }>(
    "/private/teacher/:teacherId",
    { schema: removeTeacherSchema, onRequest: [admin, authenticate] },
    teacherHandler.removeTeacher,
  );
}