import { LRUCache } from 'lru-cache';
import { z } from 'zod';
import { HistoryModel } from '@/models/History.js';
import { SubjectModel } from '@/models/Subject.js';
import { logger } from '@next/common';
import { transformCourseName } from '../utils/transformCourseName.js';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ufProcessor } from '@/services/ufprocessor.js';

const CACHE_TTL = 1000 * 60 * 60;
const cache = new LRUCache<string, any>({
  max: 3,
  ttl: CACHE_TTL,
});

const validateSigaaComponents = z.object({
  ano: z.coerce.number(),
  periodo: z
    .string()
    .transform((periodo) => (periodo === 'QS' ? '3' : periodo)),
  codigo: z.string(),
  situacao: z
    .enum(['APROVADO', 'REPROVADO', 'REPROVADO POR FALTAS', '--', ''])
    .transform((situation) => situation.toLocaleLowerCase()),
  disciplina: z.string().transform((name) => name.trim().toLocaleLowerCase()),
  resultado: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'O', '--', '']),
});

const validateSigaaHistory = z.object({
  //updateTime: z.date().optional(),
  course: z.string().transform((c) => c.toLocaleLowerCase()),
  ra: z.number(),
  courseKind: z.string().toLowerCase(),
  components: validateSigaaComponents.array(),
});

type StudentComponent = z.infer<typeof validateSigaaComponents>;

export async function createHistory(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const studentHistory = validateSigaaHistory.parse(request.body);

  if (!studentHistory.ra) {
    return reply.badRequest('Missing user RA');
  }

  const cacheKey = `history:${studentHistory.ra}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    return {
      msg: 'Retrieved from cache',
      history: cached,
    };
  }

  // coisas que o processor vai ter que mandar
  // grades para cadastros novos
  // mapear os IDs dos cursos do SIGAA

  // disciplina é o que precisamos de saudável para a feat de kicks
  // junto com tabela de alunos
  // enrollments é o queprecisamos saudável para os comentários
  // histories é o que precisamos saudável para os coeficientes
  // subjectsgraduations, historiesgraduation e graduations são para a feat de planning

  // comments by joabe vulgo job

  // todo: improve this hardcoded valuessssss
  // todo: maybe consulting history before hydrate
  const normalizedSubjects = await getNormalizedSubjects(73710, '2017');

  const hydratedComponentsPromises = studentHistory.components.map(
    (component) =>
      hydrateComponents(component, studentHistory.ra, normalizedSubjects),
  );
  const hydratedComponents = await Promise.all(hydratedComponentsPromises);
  const course = transformCourseName(
    studentHistory.course,
    studentHistory.courseKind,
  );

  let history = await HistoryModel.findOne({
    ra: studentHistory.ra,
  });

  if (!history && hydratedComponents.length > 0) {
    history = await HistoryModel.create({
      ra: studentHistory.ra,
      curso: course,
      disciplinas: hydratedComponents,
      coefficients: null,
      grade: null,
    });
    cache.set(cacheKey, history);
    return {
      msg: `Created history for ${studentHistory.ra}`,
      history,
    };
  }

  history = await HistoryModel.findOneAndUpdate(
    {
      ra: studentHistory.ra,
      curso: course,
    },
    {
      $set: {
        disciplinas: hydratedComponents,
      },
    },
    {
      new: true,
    },
  );

  cache.set(cacheKey, history);

  return {
    msg: `Updated history for ${studentHistory.ra}`,
    history,
  };
}

async function getNormalizedSubjects(courseId: number, appliedYear: string) {
  const subjects = await SubjectModel.find({
    creditos: {
      $exists: true,
    },
  });

  const graduationComponents = await ufProcessor.getGraduationComponents(
    courseId,
    appliedYear,
  );

  const normalizedSubjects = subjects.map((subject) => ({
    name: subject.name.trim().toLocaleLowerCase(),
    credits: subject.creditos,
    category: graduationComponents.components.find(
      (o) => o.name === subject.name.trim().toLocaleLowerCase(),
    )?.category,
  }));

  return normalizedSubjects;
}

async function getCategoryFromHistory(
  ra: number,
  subject: {
    name: string;
    credits: number;
    category: 'limited' | 'mandatory' | undefined;
  },
  component: StudentComponent,
) {
  const existingHistory = await HistoryModel.findOne({ ra });

  if (existingHistory) {
    const existingComponent = existingHistory.disciplinas.find((disciplina) => {
      return disciplina.codigo === component.codigo;
    });

    if (!existingComponent?.categoria) {
      return subject.category === undefined ? 'livre' : subject.category;
    }

    return existingComponent.categoria;
  }
}

async function hydrateComponents(
  component: StudentComponent,
  ra: number,
  normalizedSubjects: {
    name: string;
    credits: number;
    category: 'limited' | 'mandatory' | undefined;
  }[],
) {
  const componentSubject = component.disciplina.trim().toLocaleLowerCase();

  const validSubject = normalizedSubjects.find(
    (subject) => subject.name === componentSubject,
  );

  if (!validSubject) {
    logger.warn({ name: componentSubject, ra }, 'No valid component found');

    await SubjectModel.create({
      name: componentSubject,
      creditos: 0,
    });

    return {
      disciplina: componentSubject,
      creditos: 0,
      conceito: component.resultado,
      periodo: component.periodo,
      situacao: component.situacao,
      ano: component.ano,
      codigo: component.codigo,
      categoria: null,
    };
  }

  const categoria = await getCategoryFromHistory(ra, validSubject, component);

  return {
    conceito: component.resultado === '--' || '' ? null : component.resultado,
    periodo: component.periodo,
    situacao: component.situacao === '--' || '' ? null : component.situacao,
    ano: component.ano,
    codigo: component.codigo,
    creditos: validSubject.credits,
    disciplina: validSubject.name,
    categoria,
  };
}
