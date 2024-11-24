import { StudentModel } from "@/models/Student.js";
import { listStudentSchema } from "@/schemas/students.js";
import { currentQuad } from "@next/common";
import { FastifyPluginAsyncZodOpenApi } from "fastify-zod-openapi";

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.get('/', { schema: listStudentSchema }, async ({ user }, reply) => {
    const season = currentQuad();

    const student = await StudentModel.findOne({
      ra: user.ra,
      season,
    },{ aluno_id: 1, login: 1 }).lean<{ aluno_id: number; login: string }>()

    if(!student) {
      return reply.badRequest('Student not found')
    }

    return {
      studentId: student.aluno_id,
      login: student.login,
    }
  })
}

export default plugin;