import { StudentModel } from "@/models/Student.js";
import { listStudentSchema } from "@/schemas/students.js";
import { currentQuad } from "@next/common";
import { FastifyPluginAsyncZodOpenApi } from "fastify-zod-openapi";

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  
}

export default plugin;