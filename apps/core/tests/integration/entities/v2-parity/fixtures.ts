import { Types } from 'mongoose';

import { EnrollmentModel } from '../../../../src/models/Enrollment.js';

export const RA_ALUNO = 11_202_230_000;
export const RA_OUTRO_ALUNO = 11_202_230_001;
export const SEASON = '2024:1';

const MOMENTO = new Date('2024-03-01T12:00:00.000Z');

export const ids = {
  commentAlgebra: new Types.ObjectId('65f000000000000000000031'),
  componentAlgebra: new Types.ObjectId('65f000000000000000000041'),
  enrollmentAlgebra: new Types.ObjectId('65f000000000000000000021'),
  enrollmentCalculo: new Types.ObjectId('65f000000000000000000022'),
  enrollmentOutroAluno: new Types.ObjectId('65f000000000000000000023'),
  subjectAlgebra: new Types.ObjectId('65f000000000000000000001'),
  subjectCalculo: new Types.ObjectId('65f000000000000000000002'),
  teacherJoao: new Types.ObjectId('65f000000000000000000012'),
  teacherMaria: new Types.ObjectId('65f000000000000000000011'),
} as const;

const COLECOES = [
  'comments',
  'components',
  'enrollments',
  'subjects',
  'teachers',
] as const;

type Colecao = (typeof COLECOES)[number];

function colecao(nome: Colecao) {
  return EnrollmentModel.db.collection(nome);
}

export async function seedEntities() {
  await Promise.all(COLECOES.map(async (nome) => colecao(nome).deleteMany({})));

  await colecao('subjects').insertMany([
    {
      __v: 0,
      _id: ids.subjectAlgebra,
      createdAt: MOMENTO,
      creditos: 6,
      name: 'Algebra Linear',
      search: 'Algebra Linear',
      uf_subject_code: ['MCTB001-17'],
      updatedAt: MOMENTO,
    },
    {
      __v: 0,
      _id: ids.subjectCalculo,
      createdAt: MOMENTO,
      creditos: 4,
      name: 'Calculo Numerico',
      search: 'Calculo Numerico',
      uf_subject_code: ['MCTB010-13'],
      updatedAt: MOMENTO,
    },
  ]);

  await colecao('teachers').insertMany([
    {
      __v: 0,
      _id: ids.teacherMaria,
      alias: ['maria silva'],
      createdAt: MOMENTO,
      name: 'maria silva',
      updatedAt: MOMENTO,
    },
    {
      __v: 0,
      _id: ids.teacherJoao,
      alias: [],
      createdAt: MOMENTO,
      name: 'joao souza',
      updatedAt: MOMENTO,
    },
  ]);

  await colecao('enrollments').insertMany([
    {
      __v: 0,
      _id: ids.enrollmentAlgebra,
      ca_acumulado: 0.5,
      campus: 'santo andre',
      comments: ['teoria'],
      conceito: 'A',
      cp_acumulado: 0.2,
      cr_acumulado: 3.2,
      createdAt: MOMENTO,
      creditos: 6,
      disciplina: 'Algebra Linear',
      disciplina_id: 1001,
      identifier: 'id-algebra',
      mainTeacher: ids.teacherMaria,
      pratica: ids.teacherJoao,
      quad: 1,
      ra: RA_ALUNO,
      season: SEASON,
      subject: ids.subjectAlgebra,
      teoria: ids.teacherMaria,
      turma: 'A1',
      turno: 'diurno',
      uf_cod_turma: 'DA1MCTB001-17SA',
      updatedAt: MOMENTO,
      year: 2024,
    },
    {
      __v: 0,
      _id: ids.enrollmentCalculo,
      ca_acumulado: 0.6,
      campus: 'santo andre',
      comments: [],
      conceito: 'B',
      cp_acumulado: 0.3,
      cr_acumulado: 3.1,
      createdAt: MOMENTO,
      creditos: 4,
      disciplina: 'Calculo Numerico',
      disciplina_id: 1002,
      identifier: 'id-calculo',
      mainTeacher: ids.teacherJoao,
      pratica: null,
      quad: 1,
      ra: RA_ALUNO,
      season: SEASON,
      subject: ids.subjectCalculo,
      teoria: ids.teacherJoao,
      turma: 'A1',
      turno: 'noturno',
      uf_cod_turma: 'NA1MCTB010-13SA',
      updatedAt: MOMENTO,
      year: 2024,
    },
    {
      __v: 0,
      _id: ids.enrollmentOutroAluno,
      ca_acumulado: 0.4,
      campus: 'santo andre',
      comments: [],
      conceito: 'C',
      cp_acumulado: 0.1,
      cr_acumulado: 2.1,
      createdAt: MOMENTO,
      creditos: 6,
      disciplina: 'Algebra Linear',
      disciplina_id: 1001,
      identifier: 'id-outro',
      mainTeacher: ids.teacherMaria,
      pratica: null,
      quad: 1,
      ra: RA_OUTRO_ALUNO,
      season: SEASON,
      subject: ids.subjectAlgebra,
      teoria: ids.teacherMaria,
      turma: 'A1',
      turno: 'diurno',
      uf_cod_turma: 'DA1MCTB001-17SA',
      updatedAt: MOMENTO,
      year: 2024,
    },
  ]);

  await colecao('comments').insertMany([
    {
      __v: 0,
      _id: ids.commentAlgebra,
      active: true,
      comment: 'Didatica excelente',
      createdAt: MOMENTO,
      enrollment: ids.enrollmentAlgebra,
      ra: String(RA_ALUNO),
      reactionsCount: { like: 0, recommendation: 0, star: 0 },
      subject: ids.subjectAlgebra,
      teacher: ids.teacherMaria,
      type: 'teoria',
      updatedAt: MOMENTO,
      viewers: 0,
    },
  ]);

  await colecao('components').insertMany([
    {
      __v: 0,
      _id: ids.componentAlgebra,
      campus: 'santo andre',
      codigo: 'DA1MCTB001-17SA',
      createdAt: MOMENTO,
      disciplina: 'Algebra Linear',
      disciplina_id: 1001,
      groupURL: 'https://chat.whatsapp.com/exemplo',
      season: SEASON,
      turma: 'A1',
      turno: 'diurno',
      uf_cod_turma: 'DA1MCTB001-17SA',
      updatedAt: MOMENTO,
    },
  ]);
}

export function toPlainJson(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value)) as unknown;
}

export async function snapshotEntities() {
  const snapshot: Record<string, unknown> = {};

  for (const nome of COLECOES) {
    const documentos = await colecao(nome).find({}).sort({ _id: 1 }).toArray();
    snapshot[nome] = toPlainJson(documentos);
  }

  return snapshot;
}

export function omitDeep(value: unknown, keys: ReadonlySet<string>): unknown {
  if (Array.isArray(value)) {
    return value.map((item: unknown) => omitDeep(item, keys));
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !keys.has(key))
        .map(([key, item]: [string, unknown]) => [key, omitDeep(item, keys)])
    );
  }

  return value;
}

export type CasoParidade = {
  credencial?: 'aluno';
  ignorar?: readonly string[];
  method: 'GET' | 'POST' | 'PUT';
  nome: string;
  ordemIndiferente?: boolean;
  payload?: Record<string, unknown>;
  url: string;
};

export function sortListsDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value
      .map((item: unknown) => sortListsDeep(item))
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]: [string, unknown]) => [
        key,
        sortListsDeep(item),
      ])
    );
  }

  return value;
}

export const casosEntities: readonly CasoParidade[] = [
  {
    credencial: 'aluno',
    method: 'GET',
    nome: 'enrollments: lista do aluno autenticado',
    url: '/entities/enrollments',
  },
  {
    credencial: 'aluno',
    method: 'GET',
    nome: 'enrollments: lista com barra final',
    url: '/entities/enrollments/',
  },
  {
    method: 'GET',
    nome: 'enrollments: lista sem credencial',
    url: '/entities/enrollments',
  },
  {
    method: 'GET',
    nome: 'enrollments: wpp com ra e season',
    url: `/entities/enrollments/wpp?ra=${RA_ALUNO}&season=${SEASON}`,
  },
  {
    method: 'GET',
    nome: 'enrollments: wpp sem ra',
    url: `/entities/enrollments/wpp?season=${SEASON}`,
  },
  {
    credencial: 'aluno',
    ignorar: ['updatedAt'],
    method: 'GET',
    nome: 'enrollments: detalhe com comentario',
    url: `/entities/enrollments/${ids.enrollmentAlgebra.toHexString()}`,
  },
  {
    credencial: 'aluno',
    method: 'GET',
    nome: 'enrollments: detalhe de outro aluno',
    url: `/entities/enrollments/${ids.enrollmentOutroAluno.toHexString()}`,
  },
  {
    credencial: 'aluno',
    method: 'GET',
    nome: 'enrollments: detalhe com id invalido',
    url: '/entities/enrollments/id-invalido',
  },
  {
    credencial: 'aluno',
    method: 'GET',
    nome: 'subjects: lista paginada',
    url: '/entities/subjects?limit=1&page=2',
  },
  {
    credencial: 'aluno',
    method: 'GET',
    nome: 'subjects: lista com valores padrao',
    url: '/entities/subjects',
  },
  {
    credencial: 'aluno',
    method: 'GET',
    nome: 'subjects: limit invalido',
    url: '/entities/subjects?limit=abc',
  },
  {
    credencial: 'aluno',
    method: 'GET',
    nome: 'subjects: busca',
    url: '/entities/subjects/search?q=algebra',
  },
  {
    method: 'GET',
    nome: 'subjects: reviews publicas',
    ordemIndiferente: true,
    url: `/entities/subjects/reviews/${ids.subjectAlgebra.toHexString()}`,
  },
  {
    method: 'GET',
    nome: 'subjects: reviews com id invalido',
    url: '/entities/subjects/reviews/id-invalido',
  },
  {
    credencial: 'aluno',
    method: 'GET',
    nome: 'teachers: lista',
    url: '/entities/teachers',
  },
  {
    method: 'GET',
    nome: 'teachers: lista sem credencial',
    url: '/entities/teachers',
  },
  {
    credencial: 'aluno',
    ignorar: ['_id', 'createdAt', 'updatedAt'],
    method: 'POST',
    nome: 'teachers: criacao em lote',
    payload: { names: ['Ana Lima', 'Bruno Reis'] },
    url: '/entities/teachers',
  },
  {
    credencial: 'aluno',
    method: 'POST',
    nome: 'teachers: criacao sem names',
    payload: {},
    url: '/entities/teachers',
  },
  {
    credencial: 'aluno',
    ignorar: ['updatedAt'],
    method: 'PUT',
    nome: 'teachers: atualizacao de alias',
    payload: { alias: 'mary' },
    url: `/entities/teachers/${ids.teacherMaria.toHexString()}`,
  },
  {
    credencial: 'aluno',
    method: 'PUT',
    nome: 'teachers: alias de professor inexistente',
    payload: { alias: 'x' },
    url: '/entities/teachers/65f000000000000000000099',
  },
  {
    credencial: 'aluno',
    method: 'GET',
    nome: 'teachers: busca',
    url: '/entities/teachers/search?q=maria',
  },
  {
    method: 'GET',
    nome: 'teachers: reviews publicas',
    ordemIndiferente: true,
    url: `/entities/teachers/reviews/${ids.teacherMaria.toHexString()}`,
  },
  {
    method: 'GET',
    nome: 'borda: wpp com season repetida',
    url: `/entities/enrollments/wpp?ra=${RA_ALUNO}&season=${SEASON}&season=2024:2`,
  },
  {
    method: 'GET',
    nome: 'borda: wpp com ra repetido',
    url: `/entities/enrollments/wpp?season=${SEASON}&ra=${RA_ALUNO}&ra=2`,
  },
  {
    method: 'GET',
    nome: 'borda: wpp com ra nao numerico',
    url: `/entities/enrollments/wpp?season=${SEASON}&ra=abc`,
  },
];
