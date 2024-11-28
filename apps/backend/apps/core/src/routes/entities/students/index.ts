import { ComponentModel } from "@/models/Component.js";
import { StudentModel } from "@/models/Student.js";
import { listStudentsStatsComponents } from "@/schemas/entities/students.js";
import { FastifyPluginAsyncZodOpenApi } from "fastify-zod-openapi";
import { getAllCourses, getComponentsStudentsStats } from "./service.js";

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.get('/stats/components', { schema: listStudentsStatsComponents }, async (request, reply) => {
    const { season } = request.query;

    const isPrevious = await ComponentModel.countDocuments({
      season,
      before_kick: { $exists: true, $ne: [] }
    })

    const dataKey = isPrevious ? '$before_kick' : '$alunos_matriculados';
    const statusAggregate = await getComponentsStudentsStats(season, dataKey) 

    return statusAggregate;
  })

  app.get('/courses', async () => {
    const allStudentsCourses = await getAllCourses();
    return allStudentsCourses;
  })
}

export default plugin;