import { currentQuad, lastQuad } from '@next/utils';
import { Types } from 'mongoose';

import { CommentModel } from '../../../src/models/Comment.js';
import { ComponentModel } from '../../../src/models/Component.js';
import { EnrollmentModel } from '../../../src/models/Enrollment.js';
import { GraduationModel } from '../../../src/models/Graduation.js';
import { GraduationHistoryModel } from '../../../src/models/GraduationHistory.js';
import { GraduationSubjectModel } from '../../../src/models/GraduationSubject.js';
import { HistoryModel } from '../../../src/models/History.js';
import { StudentModel } from '../../../src/models/Student.js';
import { SubjectModel } from '../../../src/models/Subject.js';
import { TeacherModel } from '../../../src/models/Teacher.js';
import { UserModel } from '../../../src/models/User.js';
import { toPlainJson } from '../entities/v2-parity/fixtures.js';

export const RA_ALUNO = 11_202_230_000;
export const RA_OUTRO_ALUNO = 11_202_230_001;
export const RA_TERCEIRO_ALUNO = 11_202_230_002;
export const RA_ADMIN = 11_202_230_009;
export const SEASON_STATS = '2024:1';

const MOMENTO = new Date('2024-03-01T12:00:00.000Z');

export const idsStats = {
  admin: new Types.ObjectId('65f300000000000000000079'),
  aluno: new Types.ObjectId('65f300000000000000000071'),
  comment: new Types.ObjectId('65f300000000000000000031'),
  componentAlgebra: new Types.ObjectId('65f300000000000000000041'),
  componentAtual: new Types.ObjectId('65f300000000000000000044'),
  componentCalculo: new Types.ObjectId('65f300000000000000000042'),
  componentSemVagas: new Types.ObjectId('65f300000000000000000043'),
  enrollmentAprovado: new Types.ObjectId('65f300000000000000000021'),
  enrollmentTrancado: new Types.ObjectId('65f300000000000000000022'),
  graduationBct: new Types.ObjectId('65f300000000000000000051'),
  graduationSemGrade: new Types.ObjectId('65f300000000000000000052'),
  graduationSubjectAlgebra: new Types.ObjectId('65f300000000000000000053'),
  graduationSubjectBio: new Types.ObjectId('65f300000000000000000054'),
  historyAluno: new Types.ObjectId('65f300000000000000000061'),
  historyGraduationAluno: new Types.ObjectId('65f300000000000000000064'),
  historyOutro: new Types.ObjectId('65f300000000000000000062'),
  historyTerceiro: new Types.ObjectId('65f300000000000000000063'),
  outro: new Types.ObjectId('65f300000000000000000072'),
  studentBcc: new Types.ObjectId('65f300000000000000000082'),
  studentBct: new Types.ObjectId('65f300000000000000000081'),
  studentBctOutroId: new Types.ObjectId('65f300000000000000000083'),
  subjectAlgebra: new Types.ObjectId('65f300000000000000000001'),
  subjectBio: new Types.ObjectId('65f300000000000000000002'),
  teacherJoao: new Types.ObjectId('65f300000000000000000012'),
  teacherMaria: new Types.ObjectId('65f300000000000000000011'),
  terceiro: new Types.ObjectId('65f300000000000000000073'),
} as const;

const ids = idsStats;

function colecoes() {
  return [
    CommentModel.collection,
    ComponentModel.collection,
    EnrollmentModel.collection,
    GraduationHistoryModel.collection,
    GraduationModel.collection,
    GraduationSubjectModel.collection,
    HistoryModel.collection,
    StudentModel.collection,
    SubjectModel.collection,
    TeacherModel.collection,
    UserModel.collection,
  ];
}

function coeficiente(crAcumulado: number, credits: number) {
  return {
    accumulated_credits: credits,
    ca_acumulado: crAcumulado - 0.1,
    ca_quad: crAcumulado - 0.2,
    cp_acumulado: 0.25,
    cr_acumulado: crAcumulado,
    cr_quad: crAcumulado + 0.1,
    percentage_approved: 1,
    period_credits: 10,
  };
}

const DISCIPLINA_ALGEBRA = {
  ano: 2024,
  categoria: 'Obrigatória',
  codigo: 'MCTB001-17',
  conceito: 'A',
  creditos: 6,
  disciplina: 'Algebra Linear',
  periodo: '1',
  situacao: 'Aprovado',
  turma: 'A1',
};

export async function seedStats() {
  await Promise.all(
    colecoes().map(async (colecao) => colecao.deleteMany({}))
  );

  const anterior = lastQuad();
  const atual = currentQuad();

  await UserModel.collection.insertMany([
    {
      __v: 0,
      _id: ids.aluno,
      active: true,
      confirmed: true,
      createdAt: MOMENTO,
      email: 'aluno.teste@aluno.ufabc.edu.br',
      permissions: [],
      ra: RA_ALUNO,
      updatedAt: MOMENTO,
    },
    {
      __v: 0,
      _id: ids.outro,
      active: true,
      confirmed: true,
      createdAt: MOMENTO,
      email: 'outro.aluno@aluno.ufabc.edu.br',
      permissions: [],
      ra: RA_OUTRO_ALUNO,
      updatedAt: MOMENTO,
    },
    {
      __v: 0,
      _id: ids.admin,
      active: true,
      confirmed: true,
      createdAt: MOMENTO,
      email: 'admin@ufabc.edu.br',
      permissions: ['admin'],
      updatedAt: MOMENTO,
    },
  ]);

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
    {
      __v: 0,
      _id: ids.subjectBio,
      createdAt: MOMENTO,
      creditos: 4,
      name: 'Biodiversidade',
      search: 'Biodiversidade',
      uf_subject_code: ['BIS0005-15'],
      updatedAt: MOMENTO,
    },
  ]);

  await TeacherModel.collection.insertMany([
    {
      __v: 0,
      _id: ids.teacherMaria,
      alias: [],
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

  await HistoryModel.collection.insertMany([
    {
      __v: 0,
      _id: ids.historyAluno,
      coefficients: {
        2024: {
          1: coeficiente(3, 20),
          2: coeficiente(3.1, 30),
        },
        [anterior.year]: {
          [anterior.quad]: coeficiente(3.2, 40),
        },
      },
      createdAt: MOMENTO,
      curso: 'Bacharelado em Ciência e Tecnologia',
      disciplinas: [DISCIPLINA_ALGEBRA],
      grade: '2017',
      ra: RA_ALUNO,
      updatedAt: MOMENTO,
    },
    {
      __v: 0,
      _id: ids.historyOutro,
      coefficients: {
        [anterior.year]: {
          [anterior.quad]: coeficiente(1.1, 12),
        },
      },
      createdAt: MOMENTO,
      curso: 'Bacharelado em Ciência e Tecnologia',
      disciplinas: [],
      grade: '2017',
      ra: RA_OUTRO_ALUNO,
      updatedAt: MOMENTO,
    },
    {
      __v: 0,
      _id: ids.historyTerceiro,
      createdAt: MOMENTO,
      curso: 'Bacharelado em Ciência e Tecnologia',
      disciplinas: [
        DISCIPLINA_ALGEBRA,
        {
          ano: 2024,
          categoria: 'Livre Escolha',
          codigo: 'BIS0005-15',
          conceito: 'C',
          creditos: 4,
          disciplina: 'Biodiversidade',
          periodo: '2',
          situacao: 'Aprovado',
          turma: 'B1',
        },
      ],
      grade: '2017',
      ra: RA_TERCEIRO_ALUNO,
      updatedAt: MOMENTO,
    },
  ]);

  await GraduationHistoryModel.collection.insertMany([
    {
      __v: 0,
      _id: ids.historyGraduationAluno,
      coefficients: {
        2024: {
          1: coeficiente(3, 20),
        },
      },
      createdAt: MOMENTO,
      curso: 'Bacharelado em Ciência e Tecnologia',
      disciplinas: [DISCIPLINA_ALGEBRA],
      grade: '2017',
      graduation: ids.graduationBct,
      ra: RA_ALUNO,
      updatedAt: MOMENTO,
    },
  ]);

  await GraduationModel.collection.insertMany([
    {
      __v: 0,
      _id: ids.graduationBct,
      createdAt: MOMENTO,
      credits_total: 190,
      creditsBreakdown: [{ choosableCredits: 10, quad: 1, year: 1 }],
      curso: 'Bacharelado em Ciência e Tecnologia',
      free_credits_number: 43,
      grade: '2017',
      limited_credits_number: 57,
      locked: false,
      mandatory_credits_number: 90,
      updatedAt: MOMENTO,
    },
    {
      __v: 0,
      _id: ids.graduationSemGrade,
      createdAt: MOMENTO,
      credits_total: 100,
      curso: 'Curso sem grade',
      free_credits_number: 10,
      limited_credits_number: 10,
      locked: false,
      mandatory_credits_number: 80,
      updatedAt: MOMENTO,
    },
  ]);

  await GraduationSubjectModel.collection.insertMany([
    {
      __v: 0,
      _id: ids.graduationSubjectAlgebra,
      category: 'mandatory',
      codigo: 'MCTB001-17',
      createdAt: MOMENTO,
      creditos: 6,
      equivalents: [],
      graduation: ids.graduationBct,
      quad: 1,
      subject: ids.subjectAlgebra,
      updatedAt: MOMENTO,
      year: 1,
    },
    {
      __v: 0,
      _id: ids.graduationSubjectBio,
      category: 'free',
      codigo: 'BIS0005-15',
      createdAt: MOMENTO,
      creditos: 4,
      equivalents: [],
      graduation: ids.graduationBct,
      quad: 2,
      subject: ids.subjectBio,
      updatedAt: MOMENTO,
      year: 1,
    },
  ]);

  await ComponentModel.collection.insertMany([
    {
      __v: 0,
      _id: ids.componentAlgebra,
      after_kick: [],
      alunos_matriculados: [5001, 5002, 5003],
      before_kick: [],
      campus: 'santo andre',
      codigo: 'DA1MCTB001-17SA',
      createdAt: MOMENTO,
      disciplina: 'Algebra Linear',
      obrigatorias: [10, 20],
      pratica: ids.teacherJoao,
      season: SEASON_STATS,
      subject: ids.subjectAlgebra,
      teoria: ids.teacherMaria,
      turma: 'A1',
      turno: 'diurno',
      updatedAt: MOMENTO,
      vagas: 60,
    },
    {
      __v: 0,
      _id: ids.componentCalculo,
      after_kick: [],
      alunos_matriculados: [5001, 5002, 5003],
      before_kick: [],
      campus: 'santo andre',
      codigo: 'NA1MCTB010-13SA',
      createdAt: MOMENTO,
      disciplina: 'Calculo Numerico',
      obrigatorias: [10],
      season: SEASON_STATS,
      subject: ids.subjectBio,
      teoria: ids.teacherJoao,
      turma: 'A1',
      turno: 'noturno',
      updatedAt: MOMENTO,
      vagas: 2,
    },
    {
      __v: 0,
      _id: ids.componentSemVagas,
      after_kick: [],
      alunos_matriculados: [5001],
      before_kick: [],
      campus: 'sao bernardo',
      codigo: 'DA2BIS0005-15SB',
      createdAt: MOMENTO,
      disciplina: 'Biodiversidade',
      obrigatorias: [20],
      season: SEASON_STATS,
      subject: ids.subjectBio,
      teoria: ids.teacherMaria,
      turma: 'A2',
      turno: 'diurno',
      updatedAt: MOMENTO,
      vagas: 0,
    },
    {
      __v: 0,
      _id: ids.componentAtual,
      after_kick: [],
      alunos_matriculados: [5001, 5002],
      before_kick: [],
      campus: 'santo andre',
      codigo: 'DA1MCTB001-17SA',
      createdAt: MOMENTO,
      disciplina: 'Algebra Linear',
      obrigatorias: [10],
      pratica: ids.teacherJoao,
      season: atual,
      subject: ids.subjectAlgebra,
      teoria: ids.teacherMaria,
      turma: 'A1',
      turno: 'diurno',
      updatedAt: MOMENTO,
      vagas: 30,
    },
  ]);

  await StudentModel.collection.insertMany([
    {
      __v: 0,
      _id: ids.studentBct,
      aluno_id: 5001,
      createdAt: MOMENTO,
      cursos: [
        {
          id_curso: 10,
          nome_curso: 'Bacharelado em Ciência e Tecnologia',
          turno: 'Matutino',
        },
      ],
      login: 'aluno.teste',
      ra: RA_ALUNO,
      season: atual,
      updatedAt: MOMENTO,
    },
    {
      __v: 0,
      _id: ids.studentBcc,
      aluno_id: 5002,
      createdAt: MOMENTO,
      cursos: [
        {
          id_curso: 10,
          nome_curso: ' Bacharelado em Ciência e Tecnologia ',
          turno: 'Noturno',
        },
        {
          id_curso: 20,
          nome_curso: 'Bacharelado em Ciência da Computação',
          turno: 'Noturno',
        },
      ],
      login: 'outro.aluno',
      ra: RA_OUTRO_ALUNO,
      season: atual,
      updatedAt: MOMENTO,
    },
    {
      __v: 0,
      _id: ids.studentBctOutroId,
      aluno_id: 5003,
      createdAt: MOMENTO,
      cursos: [
        {
          id_curso: 12,
          nome_curso: 'Bacharelado em Ciência e Tecnologia',
          turno: 'Matutino',
        },
      ],
      login: 'terceiro.aluno',
      ra: RA_TERCEIRO_ALUNO,
      season: atual,
      updatedAt: MOMENTO,
    },
  ]);

  await EnrollmentModel.collection.insertMany([
    {
      __v: 0,
      _id: ids.enrollmentAprovado,
      conceito: 'A',
      createdAt: MOMENTO,
      disciplina: 'Algebra Linear',
      quad: 1,
      ra: RA_ALUNO,
      season: SEASON_STATS,
      updatedAt: MOMENTO,
      year: 2024,
    },
    {
      __v: 0,
      _id: ids.enrollmentTrancado,
      conceito: '-',
      createdAt: MOMENTO,
      disciplina: 'Calculo Numerico',
      quad: 1,
      ra: RA_ALUNO,
      season: SEASON_STATS,
      updatedAt: MOMENTO,
      year: 2024,
    },
  ]);

  await CommentModel.collection.insertMany([
    {
      __v: 0,
      _id: ids.comment,
      active: true,
      comment: 'Didatica excelente',
      createdAt: MOMENTO,
      enrollment: ids.enrollmentAprovado,
      ra: String(RA_ALUNO),
      reactionsCount: { like: 0, recommendation: 0, star: 0 },
      subject: ids.subjectAlgebra,
      teacher: ids.teacherMaria,
      type: 'teoria',
      updatedAt: MOMENTO,
      viewers: 0,
    },
  ]);
}

export async function snapshotStats() {
  const snapshot: Record<string, unknown> = {};

  for (const colecao of colecoes()) {
    const documentos = await colecao.find({}).sort({ _id: 1 }).toArray();
    snapshot[colecao.collectionName] = toPlainJson(documentos);
  }

  return snapshot;
}

export type CredencialStats =
  | 'admin'
  | 'aluno'
  | 'extensao'
  | 'outro'
  | 'terceiro';

export type DivergenciaIntencional = {
  motivo: string;
  statusV1: number;
  statusV2: number;
};

export type CasoStats = {
  credencial?: CredencialStats;
  divergencia?: DivergenciaIntencional;
  ignorar?: readonly string[];
  method: 'GET';
  nome: string;
  ordemIndiferente?: boolean;
  url: string;
};

const hex = (id: Types.ObjectId) => id.toHexString();

export const casosStats: readonly CasoStats[] = [
  {
    credencial: 'aluno',
    method: 'GET',
    nome: 'courseStats: distribuicao de CR',
    url: '/courseStats/grades',
  },
  {
    method: 'GET',
    nome: 'courseStats: distribuicao sem credencial',
    url: '/courseStats/grades',
  },
  {
    credencial: 'aluno',
    method: 'GET',
    nome: 'courseStats: historico do aluno',
    url: '/courseStats/history',
  },
  {
    credencial: 'outro',
    method: 'GET',
    nome: 'courseStats: historico sem disciplinas',
    url: '/courseStats/history',
  },
  {
    credencial: 'terceiro',
    method: 'GET',
    nome: 'courseStats: historico calculado sem coefficients',
    url: '/courseStats/history',
  },
  {
    credencial: 'aluno',
    method: 'GET',
    nome: 'courseStats: historicos de graduacao do aluno',
    url: '/courseStats/user/grades',
  },
  {
    credencial: 'outro',
    method: 'GET',
    nome: 'courseStats: historicos de graduacao vazios',
    url: '/courseStats/user/grades',
  },
  {
    method: 'GET',
    nome: 'public: resumo',
    url: '/public/summary',
  },
  {
    method: 'GET',
    nome: 'public: graduacoes',
    url: '/public/graduations',
  },
  {
    method: 'GET',
    nome: 'public: estatisticas de aluno da season',
    url: `/public/stats/student?season=${SEASON_STATS}`,
  },
  {
    method: 'GET',
    nome: 'public: estatisticas de aluno sem season',
    url: '/public/stats/student',
  },
  {
    method: 'GET',
    nome: 'public: uso da plataforma',
    url: '/public/stats/usage',
  },
  {
    method: 'GET',
    nome: 'public: turmas da season',
    ordemIndiferente: true,
    url: `/public/stats/components?season=${SEASON_STATS}`,
  },
  {
    method: 'GET',
    nome: 'public: visao geral',
    ordemIndiferente: true,
    url: `/public/stats/components/overview?season=${SEASON_STATS}`,
  },
  {
    method: 'GET',
    nome: 'public: por disciplina',
    ordemIndiferente: true,
    url: `/public/stats/components/component?season=${SEASON_STATS}`,
  },
  {
    method: 'GET',
    nome: 'public: por curso',
    ordemIndiferente: true,
    url: `/public/stats/components/courses?season=${SEASON_STATS}`,
  },
  {
    method: 'GET',
    nome: 'public: turmas filtradas por curso',
    ordemIndiferente: true,
    url: `/public/stats/components?season=${SEASON_STATS}&courseId=10`,
  },
  {
    method: 'GET',
    nome: 'public: turmas por turno e ratio',
    ordemIndiferente: true,
    url: `/public/stats/components?season=${SEASON_STATS}&turno=noturno&ratio=1`,
  },
  {
    method: 'GET',
    nome: 'public: turmas paginadas',
    url: `/public/stats/components?season=${SEASON_STATS}&limit=1&page=1`,
  },
  {
    method: 'GET',
    nome: 'public: acao invalida',
    url: `/public/stats/components/invalida?season=${SEASON_STATS}`,
  },
  {
    credencial: 'extensao',
    method: 'GET',
    nome: 'histories: cursos da season atual',
    ordemIndiferente: true,
    url: '/histories/courses',
  },
  {
    method: 'GET',
    nome: 'histories: cursos sem sessao',
    url: '/histories/courses',
  },
  {
    credencial: 'admin',
    divergencia: {
      motivo: 'decisao 18: legacyAdminHook so na V2, e o admin passa a receber resposta',
      statusV1: 0,
      statusV2: 200,
    },
    method: 'GET',
    nome: 'graduations: materias como admin',
    url: '/graduations/subjects',
  },
  {
    credencial: 'admin',
    divergencia: {
      motivo:
        'decisao 18 expos defeito anterior: /subjects/ casa com :graduationId vazio e o cast para ObjectId falha',
      statusV1: 0,
      statusV2: 500,
    },
    method: 'GET',
    nome: 'graduations: materias com barra final',
    url: '/graduations/subjects/',
  },
  {
    credencial: 'admin',
    divergencia: {
      motivo: 'decisao 18: legacyAdminHook so na V2, e o admin passa a receber resposta',
      statusV1: 0,
      statusV2: 200,
    },
    method: 'GET',
    nome: 'graduations: materias paginadas',
    url: '/graduations/subjects?limit=1&page=2',
  },
  {
    credencial: 'aluno',
    method: 'GET',
    nome: 'graduations: materias sem permissao',
    url: '/graduations/subjects',
  },
  {
    method: 'GET',
    nome: 'graduations: materias sem credencial',
    url: '/graduations/subjects',
  },
  {
    credencial: 'admin',
    divergencia: {
      motivo: 'decisao 18: legacyAdminHook so na V2, e o admin passa a receber resposta',
      statusV1: 0,
      statusV2: 200,
    },
    method: 'GET',
    nome: 'graduations: materias por graduacao',
    url: `/graduations/subjects/${hex(ids.graduationBct)}`,
  },
  {
    credencial: 'admin',
    method: 'GET',
    nome: 'graduations: materias por graduacao com limit',
    url: `/graduations/subjects/${hex(ids.graduationBct)}?limit=1`,
  },
  {
    method: 'GET',
    nome: 'borda: usage com season que a rota ignora',
    url: '/public/stats/usage?season=2026:3',
  },
  {
    method: 'GET',
    nome: 'borda: summary com query extra',
    url: '/public/summary?extra=1',
  },
  {
    credencial: 'aluno',
    method: 'GET',
    nome: 'borda: user grades com query extra',
    url: '/courseStats/user/grades?extra=1',
  },
  {
    credencial: 'extensao',
    method: 'GET',
    nome: 'borda: cursos com query extra',
    ordemIndiferente: true,
    url: '/histories/courses?extra=1',
  },
];
