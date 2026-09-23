import { currentQuad } from '@next/utils';
import { Types } from 'mongoose';

import { ComponentModel } from '../../../../src/models/Component.js';
import { HistoryModel } from '../../../../src/models/History.js';
import { StudentModel } from '../../../../src/models/Student.js';
import { SubjectModel } from '../../../../src/models/Subject.js';
import { TeacherModel } from '../../../../src/models/Teacher.js';
import { UserModel } from '../../../../src/models/User.js';
import { toPlainJson } from './fixtures.js';

export const RA_ALUNO = 11_202_230_000;
export const RA_OUTRO_ALUNO = 11_202_230_001;
export const SEASON_KICKS = '2024:1';

const MOMENTO = new Date('2024-03-01T12:00:00.000Z');

export const idsComponentsStudents = {
  componentAlgebra: new Types.ObjectId('65f100000000000000000041'),
  componentCalculo: new Types.ObjectId('65f100000000000000000042'),
  history: new Types.ObjectId('65f100000000000000000061'),
  studentAtual: new Types.ObjectId('65f100000000000000000053'),
  studentKicks: new Types.ObjectId('65f100000000000000000051'),
  studentOutro: new Types.ObjectId('65f100000000000000000052'),
  subjectAlgebra: new Types.ObjectId('65f100000000000000000001'),
  teacherJoao: new Types.ObjectId('65f100000000000000000012'),
  teacherMaria: new Types.ObjectId('65f100000000000000000011'),
  user: new Types.ObjectId('65f100000000000000000071'),
} as const;

const ids = idsComponentsStudents;

function colecoes() {
  return [
    ComponentModel.collection,
    HistoryModel.collection,
    StudentModel.collection,
    SubjectModel.collection,
    TeacherModel.collection,
    UserModel.collection,
  ];
}

const CURSO_BCT = {
  ca: 0.7,
  cp: 0.5,
  cr: 3,
  id_curso: 10,
  ind_afinidade: 0.8,
  nome_curso: 'Bacharelado em Ciência e Tecnologia',
  turno: 'Matutino',
};

export async function seedComponentsStudents() {
  await Promise.all(
    colecoes().map(async (colecao) => colecao.deleteMany({}))
  );

  await SubjectModel.collection.insertMany([
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
  ]);

  await TeacherModel.collection.insertMany([
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

  await ComponentModel.collection.insertMany([
    {
      __v: 0,
      _id: ids.componentAlgebra,
      after_kick: [],
      alunos_matriculados: [5001, 5002],
      before_kick: [],
      campus: 'santo andre',
      codigo: 'DA1MCTB001-17SA',
      createdAt: MOMENTO,
      disciplina: 'Algebra Linear',
      disciplina_id: 1001,
      groupURL: 'https://chat.whatsapp.com/antigo',
      ideal_quad: false,
      identifier: 'comp-algebra',
      kind: 'api',
      obrigatorias: [10],
      origin_key: 'ORIGEM-ALGEBRA',
      pratica: ids.teacherJoao,
      quad: 1,
      season: SEASON_KICKS,
      subject: ids.subjectAlgebra,
      teoria: ids.teacherMaria,
      tpi: [4, 0, 4],
      turma: 'A1',
      turno: 'diurno',
      uf_cod_turma: 'DA1MCTB001-17SA',
      updatedAt: MOMENTO,
      vagas: 60,
      year: 2024,
    },
    {
      __v: 0,
      _id: ids.componentCalculo,
      after_kick: [5001],
      alunos_matriculados: [5001],
      before_kick: [5001, 5002],
      campus: 'santo andre',
      codigo: 'NA1MCTB010-13SA',
      createdAt: MOMENTO,
      disciplina: 'Calculo Numerico',
      disciplina_id: 1002,
      ideal_quad: true,
      identifier: 'comp-calculo',
      kind: 'api',
      obrigatorias: [20],
      origin_key: 'ORIGEM-CALCULO',
      pratica: null,
      quad: 1,
      season: SEASON_KICKS,
      subject: ids.subjectAlgebra,
      teoria: ids.teacherJoao,
      tpi: [4, 0, 4],
      turma: 'A1',
      turno: 'noturno',
      uf_cod_turma: 'NA1MCTB010-13SA',
      updatedAt: MOMENTO,
      vagas: 40,
      year: 2024,
    },
  ]);

  await StudentModel.collection.insertMany([
    {
      __v: 0,
      _id: ids.studentKicks,
      aluno_id: 5001,
      createdAt: MOMENTO,
      cursos: [CURSO_BCT],
      login: 'aluno.teste',
      ra: RA_ALUNO,
      season: SEASON_KICKS,
      updatedAt: MOMENTO,
    },
    {
      __v: 0,
      _id: ids.studentOutro,
      aluno_id: 5002,
      createdAt: MOMENTO,
      cursos: [
        {
          ca: 0.6,
          cp: 0.4,
          cr: 2.5,
          id_curso: 20,
          ind_afinidade: 0.6,
          nome_curso: 'Bacharelado em Ciência da Computação',
          turno: 'Noturno',
        },
      ],
      login: 'outro.aluno',
      ra: RA_OUTRO_ALUNO,
      season: SEASON_KICKS,
      updatedAt: MOMENTO,
    },
    {
      __v: 0,
      _id: ids.studentAtual,
      createdAt: MOMENTO,
      cursos: [CURSO_BCT],
      login: 'aluno.teste',
      ra: RA_ALUNO,
      season: currentQuad(),
      updatedAt: MOMENTO,
    },
  ]);

  await HistoryModel.collection.insertMany([
    {
      __v: 0,
      _id: ids.history,
      createdAt: MOMENTO,
      curso: 'Bacharelado em Ciência e Tecnologia',
      disciplinas: [
        {
          ano: 2024,
          categoria: 'obrigatoria',
          codigo: 'MCTB001-17',
          conceito: 'A',
          creditos: 6,
          disciplina: 'Algebra Linear',
          periodo: '1',
          situacao: 'Aprovado',
          turma: 'A1',
        },
      ],
      ra: RA_ALUNO,
      updatedAt: MOMENTO,
    },
  ]);

  await UserModel.collection.insertMany([
    {
      __v: 0,
      _id: ids.user,
      active: true,
      confirmed: true,
      createdAt: MOMENTO,
      email: 'aluno.teste@aluno.ufabc.edu.br',
      ra: RA_ALUNO,
      updatedAt: MOMENTO,
    },
  ]);
}

export async function snapshotComponentsStudents() {
  const snapshot: Record<string, unknown> = {};

  for (const colecao of colecoes()) {
    const documentos = await colecao.find({}).sort({ _id: 1 }).toArray();
    snapshot[colecao.collectionName] = toPlainJson(documentos);
  }

  return snapshot;
}

export type CasoComponentsStudents = {
  credencial?: 'extensao';
  headers?: Record<string, string>;
  ignorar?: readonly string[];
  method: 'GET' | 'PATCH' | 'PUT';
  nome: string;
  ordemIndiferente?: boolean;
  payload?: Record<string, unknown> | string;
  url: string;
};

const GROUP_URL_ALGEBRA = `/entities/components/update-group-urls/ORIGEM-ALGEBRA?season=${SEASON_KICKS}`;

export const casosComponentsStudents: readonly CasoComponentsStudents[] = [
  {
    method: 'GET',
    nome: 'components: lista da season',
    url: `/entities/components?season=${SEASON_KICKS}`,
  },
  {
    method: 'GET',
    nome: 'components: lista com barra final',
    url: `/entities/components/?season=${SEASON_KICKS}`,
  },
  {
    method: 'GET',
    nome: 'components: kicks antes do chute',
    url: `/entities/components/1001/kicks?season=${SEASON_KICKS}&studentId=5001`,
  },
  {
    method: 'GET',
    nome: 'components: kicks depois do chute',
    url: `/entities/components/1002/kicks?season=${SEASON_KICKS}&studentId=5001`,
  },
  {
    method: 'GET',
    nome: 'components: kicks com sort explicito',
    url: `/entities/components/1001/kicks?season=${SEASON_KICKS}&studentId=5001&sort=cr`,
  },
  {
    method: 'GET',
    nome: 'components: kicks de aluno inexistente',
    url: `/entities/components/1001/kicks?season=${SEASON_KICKS}&studentId=9999`,
  },
  {
    method: 'GET',
    nome: 'components: kicks de componente inexistente',
    url: `/entities/components/9999/kicks?season=${SEASON_KICKS}&studentId=5001`,
  },
  {
    method: 'GET',
    nome: 'components: kicks com id invalido',
    url: `/entities/components/abc/kicks?season=${SEASON_KICKS}&studentId=5001`,
  },
  {
    method: 'GET',
    nome: 'components: professores da materia',
    url: `/entities/components/teachers?season=${SEASON_KICKS}&subject=${ids.subjectAlgebra.toHexString()}`,
  },
  {
    ignorar: ['updatedAt'],
    method: 'PATCH',
    nome: 'components: atualiza groupURL',
    payload: { groupURL: 'https://chat.whatsapp.com/novo' },
    url: GROUP_URL_ALGEBRA,
  },
  {
    ignorar: ['updatedAt'],
    method: 'PATCH',
    nome: 'components: groupURL igual ao atual',
    payload: { groupURL: 'https://chat.whatsapp.com/antigo' },
    url: GROUP_URL_ALGEBRA,
  },
  {
    method: 'PATCH',
    nome: 'components: groupURL ausente',
    payload: {},
    url: GROUP_URL_ALGEBRA,
  },
  {
    method: 'PATCH',
    nome: 'components: origem inexistente',
    payload: { groupURL: null },
    url: `/entities/components/update-group-urls/ORIGEM-NENHUMA?season=${SEASON_KICKS}`,
  },
  {
    method: 'GET',
    nome: 'students: estatisticas da season',
    url: `/entities/students/stats/components?season=${SEASON_KICKS}`,
  },
  {
    method: 'GET',
    nome: 'students: cursos',
    ordemIndiferente: true,
    url: '/entities/students/courses',
  },
  {
    credencial: 'extensao',
    headers: { ra: String(RA_ALUNO), 'uf-login': 'aluno.teste' },
    method: 'GET',
    nome: 'students: aluno da season atual',
    url: '/entities/students',
  },
  {
    method: 'GET',
    nome: 'students: sem sessao',
    url: '/entities/students',
  },
  {
    credencial: 'extensao',
    headers: { 'uf-login': 'aluno.teste' },
    method: 'GET',
    nome: 'students: sem ra',
    url: '/entities/students',
  },
  {
    credencial: 'extensao',
    headers: { 'uf-login': 'aluno.teste', uf_login: 'aluno.teste' },
    method: 'GET',
    nome: 'students: matricula',
    url: `/entities/students/student?ra=${RA_ALUNO}&login=aluno.teste`,
  },
  {
    credencial: 'extensao',
    headers: { 'uf-login': 'aluno.teste' },
    method: 'GET',
    nome: 'students: matricula sem query',
    url: '/entities/students/student',
  },
  {
    credencial: 'extensao',
    ignorar: ['updatedAt'],
    method: 'PUT',
    nome: 'students: vinculo de aluno_id',
    payload: {
      graduationId: 10,
      login: 'aluno.teste',
      ra: RA_ALUNO,
      studentId: 5001,
    },
    url: '/entities/students',
  },
  {
    credencial: 'extensao',
    method: 'PUT',
    nome: 'students: atualizacao sem login',
    payload: { ra: RA_ALUNO },
    url: '/entities/students',
  },
  {
    method: 'GET',
    nome: 'borda: components com season repetida',
    url: `/entities/components?season=${SEASON_KICKS}&season=2024:2`,
  },
  {
    method: 'GET',
    nome: 'borda: components com query extra',
    url: `/entities/components?season=${SEASON_KICKS}&extra=1`,
  },
  {
    method: 'GET',
    nome: 'borda: cursos com query extra',
    ordemIndiferente: true,
    url: '/entities/students/courses?extra=1',
  },
  {
    method: 'PATCH',
    nome: 'borda: groupURL sem corpo',
    url: GROUP_URL_ALGEBRA,
  },
  {
    headers: { 'content-type': 'text/plain' },
    method: 'PATCH',
    nome: 'borda: groupURL com corpo em texto',
    payload: 'abc',
    url: GROUP_URL_ALGEBRA,
  },
  {
    ignorar: ['updatedAt'],
    method: 'PATCH',
    nome: 'borda: groupURL numerico',
    payload: { groupURL: 123 },
    url: GROUP_URL_ALGEBRA,
  },
  {
    ignorar: ['updatedAt'],
    method: 'PATCH',
    nome: 'borda: groupURL nulo',
    payload: { groupURL: null },
    url: GROUP_URL_ALGEBRA,
  },
  {
    ignorar: ['updatedAt'],
    method: 'PATCH',
    nome: 'borda: groupURL com campo extra',
    payload: { extra: 1, groupURL: 'https://exemplo.invalido/g' },
    url: GROUP_URL_ALGEBRA,
  },
  {
    ignorar: ['updatedAt'],
    method: 'PATCH',
    nome: 'borda: groupURL com season repetida',
    payload: { groupURL: 'https://exemplo.invalido/g' },
    url: `${GROUP_URL_ALGEBRA}&season=2024:2`,
  },
];
