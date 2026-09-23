import { Types } from 'mongoose';

import { CommentModel } from '../../../src/models/Comment.js';
import { EnrollmentModel } from '../../../src/models/Enrollment.js';
import { ReactionModel } from '../../../src/models/Reaction.js';
import { SubjectModel } from '../../../src/models/Subject.js';
import { TeacherModel } from '../../../src/models/Teacher.js';
import { UserModel } from '../../../src/models/User.js';
import { toPlainJson } from '../entities/v2-parity/fixtures.js';

export const RA_ALUNO = 11_202_230_000;
export const RA_OUTRO_ALUNO = 11_202_230_001;

const MOMENTO = new Date('2024-03-01T12:00:00.000Z');
const DEPOIS = new Date('2024-03-02T12:00:00.000Z');

export const idsComments = {
  commentAluno: new Types.ObjectId('65f200000000000000000031'),
  commentOutro: new Types.ObjectId('65f200000000000000000032'),
  enrollmentAlgebra: new Types.ObjectId('65f200000000000000000021'),
  enrollmentOutro: new Types.ObjectId('65f200000000000000000023'),
  enrollmentSemMateria: new Types.ObjectId('65f200000000000000000022'),
  inexistente: new Types.ObjectId('65f200000000000000000099'),
  reactionLike: new Types.ObjectId('65f200000000000000000041'),
  subjectAlgebra: new Types.ObjectId('65f200000000000000000001'),
  teacherJoao: new Types.ObjectId('65f200000000000000000012'),
  teacherMaria: new Types.ObjectId('65f200000000000000000011'),
  userAluno: new Types.ObjectId('65f200000000000000000071'),
  userOutro: new Types.ObjectId('65f200000000000000000072'),
} as const;

const ids = idsComments;

function colecoes() {
  return [
    CommentModel.collection,
    EnrollmentModel.collection,
    ReactionModel.collection,
    SubjectModel.collection,
    TeacherModel.collection,
    UserModel.collection,
  ];
}

export async function seedComments() {
  await Promise.all(
    colecoes().map(async (colecao) => colecao.deleteMany({}))
  );

  await UserModel.collection.insertMany([
    {
      __v: 0,
      _id: ids.userAluno,
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
      _id: ids.userOutro,
      active: true,
      confirmed: true,
      createdAt: MOMENTO,
      email: 'outro.aluno@aluno.ufabc.edu.br',
      permissions: [],
      ra: RA_OUTRO_ALUNO,
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

  await EnrollmentModel.collection.insertMany([
    {
      __v: 0,
      _id: ids.enrollmentAlgebra,
      comments: ['teoria'],
      conceito: 'A',
      createdAt: MOMENTO,
      creditos: 6,
      disciplina: 'Algebra Linear',
      mainTeacher: ids.teacherMaria,
      pratica: ids.teacherJoao,
      quad: 1,
      ra: RA_ALUNO,
      season: '2024:1',
      subject: ids.subjectAlgebra,
      teoria: ids.teacherMaria,
      updatedAt: MOMENTO,
      year: 2024,
    },
    {
      __v: 0,
      _id: ids.enrollmentSemMateria,
      comments: [],
      conceito: 'B',
      createdAt: MOMENTO,
      creditos: 4,
      disciplina: 'Disciplina sem materia',
      mainTeacher: ids.teacherJoao,
      quad: 1,
      ra: RA_ALUNO,
      season: '2024:1',
      teoria: ids.teacherJoao,
      updatedAt: MOMENTO,
      year: 2024,
    },
    {
      __v: 0,
      _id: ids.enrollmentOutro,
      comments: ['teoria'],
      conceito: 'C',
      createdAt: MOMENTO,
      creditos: 6,
      disciplina: 'Algebra Linear',
      mainTeacher: ids.teacherMaria,
      quad: 1,
      ra: RA_OUTRO_ALUNO,
      season: '2024:1',
      subject: ids.subjectAlgebra,
      teoria: ids.teacherMaria,
      updatedAt: MOMENTO,
      year: 2024,
    },
  ]);

  await CommentModel.collection.insertMany([
    {
      __v: 0,
      _id: ids.commentAluno,
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
    {
      __v: 0,
      _id: ids.commentOutro,
      active: true,
      comment: 'Provas justas',
      createdAt: DEPOIS,
      enrollment: ids.enrollmentOutro,
      ra: String(RA_OUTRO_ALUNO),
      reactionsCount: { like: 1, recommendation: 0, star: 0 },
      subject: ids.subjectAlgebra,
      teacher: ids.teacherMaria,
      type: 'teoria',
      updatedAt: DEPOIS,
      viewers: 3,
    },
  ]);

  await ReactionModel.collection.insertMany([
    {
      __v: 0,
      _id: ids.reactionLike,
      active: true,
      comment: ids.commentOutro,
      createdAt: DEPOIS,
      kind: 'like',
      slug: `like:${ids.commentOutro.toHexString()}:${ids.userAluno.toHexString()}`,
      updatedAt: DEPOIS,
      user: ids.userAluno,
    },
  ]);
}

export async function snapshotComments() {
  const snapshot: Record<string, unknown> = {};

  for (const colecao of colecoes()) {
    const documentos = await colecao.find({}).sort({ _id: 1 }).toArray();
    snapshot[colecao.collectionName] = toPlainJson(documentos);
  }

  return snapshot;
}

export type CasoComments = {
  credencial?: 'aluno';
  ignorar?: readonly string[];
  method: 'DELETE' | 'GET' | 'POST' | 'PUT';
  nome: string;
  ordemIndiferente?: boolean;
  payload?: Record<string, unknown>;
  url: string;
};

const hex = (id: Types.ObjectId) => id.toHexString();
const CRIADO = ['_id', 'createdAt', 'updatedAt'] as const;
const RELOGIO = ['updatedAt'] as const;

export const casosComments: readonly CasoComments[] = [
  {
    credencial: 'aluno',
    ignorar: RELOGIO,
    method: 'GET',
    nome: 'comments: pendentes do aluno',
    url: `/comments/${hex(ids.userAluno)}/missing`,
  },
  {
    credencial: 'aluno',
    method: 'GET',
    nome: 'comments: pendentes de outro usuario',
    url: `/comments/${hex(ids.userOutro)}/missing`,
  },
  {
    credencial: 'aluno',
    method: 'GET',
    nome: 'comments: pendentes com id invalido',
    url: '/comments/id-invalido/missing',
  },
  {
    method: 'GET',
    nome: 'comments: pendentes sem credencial',
    url: `/comments/${hex(ids.userAluno)}/missing`,
  },
  {
    credencial: 'aluno',
    ignorar: CRIADO,
    method: 'POST',
    nome: 'comments: criacao com barra final',
    payload: {
      comment: 'Pratica muito boa',
      enrollment: hex(ids.enrollmentAlgebra),
      type: 'pratica',
    },
    url: '/comments/',
  },
  {
    credencial: 'aluno',
    ignorar: CRIADO,
    method: 'POST',
    nome: 'comments: criacao sem barra final',
    payload: {
      comment: 'Pratica muito boa',
      enrollment: hex(ids.enrollmentAlgebra),
      type: 'pratica',
    },
    url: '/comments',
  },
  {
    credencial: 'aluno',
    ignorar: RELOGIO,
    method: 'POST',
    nome: 'comments: criacao duplicada',
    payload: {
      comment: 'De novo',
      enrollment: hex(ids.enrollmentAlgebra),
      type: 'teoria',
    },
    url: '/comments',
  },
  {
    credencial: 'aluno',
    method: 'POST',
    nome: 'comments: criacao em matricula de outro aluno',
    payload: {
      comment: 'Nao e minha',
      enrollment: hex(ids.enrollmentOutro),
      type: 'pratica',
    },
    url: '/comments',
  },
  {
    credencial: 'aluno',
    method: 'POST',
    nome: 'comments: criacao em matricula inexistente',
    payload: {
      comment: 'Sem matricula',
      enrollment: hex(ids.inexistente),
      type: 'teoria',
    },
    url: '/comments',
  },
  {
    credencial: 'aluno',
    method: 'POST',
    nome: 'comments: criacao em matricula sem materia',
    payload: {
      comment: 'Sem materia',
      enrollment: hex(ids.enrollmentSemMateria),
      type: 'teoria',
    },
    url: '/comments',
  },
  {
    credencial: 'aluno',
    method: 'POST',
    nome: 'comments: criacao sem campos',
    payload: {},
    url: '/comments',
  },
  {
    method: 'POST',
    nome: 'comments: criacao sem credencial',
    payload: {
      comment: 'Pratica muito boa',
      enrollment: hex(ids.enrollmentAlgebra),
      type: 'pratica',
    },
    url: '/comments',
  },
  {
    credencial: 'aluno',
    ignorar: RELOGIO,
    method: 'PUT',
    nome: 'comments: edicao',
    payload: { comment: 'Texto editado' },
    url: `/comments/${hex(ids.commentAluno)}`,
  },
  {
    credencial: 'aluno',
    method: 'PUT',
    nome: 'comments: edicao de comentario alheio',
    payload: { comment: 'Texto editado' },
    url: `/comments/${hex(ids.commentOutro)}`,
  },
  {
    credencial: 'aluno',
    method: 'PUT',
    nome: 'comments: edicao de comentario inexistente',
    payload: { comment: 'Texto editado' },
    url: `/comments/${hex(ids.inexistente)}`,
  },
  {
    credencial: 'aluno',
    method: 'PUT',
    nome: 'comments: edicao sem texto',
    payload: {},
    url: `/comments/${hex(ids.commentAluno)}`,
  },
  {
    credencial: 'aluno',
    ignorar: RELOGIO,
    method: 'DELETE',
    nome: 'comments: exclusao',
    url: `/comments/${hex(ids.commentAluno)}`,
  },
  {
    credencial: 'aluno',
    method: 'DELETE',
    nome: 'comments: exclusao de comentario alheio',
    url: `/comments/${hex(ids.commentOutro)}`,
  },
  {
    credencial: 'aluno',
    method: 'DELETE',
    nome: 'comments: exclusao de comentario inexistente',
    url: `/comments/${hex(ids.inexistente)}`,
  },
  {
    credencial: 'aluno',
    ignorar: RELOGIO,
    method: 'GET',
    nome: 'comments: lista por professor',
    url: `/comments/${hex(ids.teacherMaria)}`,
  },
  {
    credencial: 'aluno',
    ignorar: RELOGIO,
    method: 'GET',
    nome: 'comments: lista por professor e materia paginada',
    url: `/comments/${hex(ids.teacherMaria)}/${hex(ids.subjectAlgebra)}?limit=1&page=1`,
  },
  {
    credencial: 'aluno',
    ignorar: RELOGIO,
    method: 'GET',
    nome: 'comments: chamada getUserComment do site',
    url: `/comments/enrollment/${hex(ids.enrollmentAlgebra)}`,
  },
  {
    credencial: 'aluno',
    method: 'GET',
    nome: 'comments: lista com professor invalido',
    url: '/comments/id-invalido',
  },
  {
    method: 'GET',
    nome: 'comments: lista sem credencial',
    url: `/comments/${hex(ids.teacherMaria)}`,
  },
  {
    credencial: 'aluno',
    ignorar: CRIADO,
    method: 'POST',
    nome: 'reactions: like',
    payload: { kind: 'like' },
    url: `/comments/reactions/${hex(ids.commentAluno)}`,
  },
  {
    credencial: 'aluno',
    ignorar: CRIADO,
    method: 'POST',
    nome: 'reactions: recomendacao permitida',
    payload: { kind: 'recommendation' },
    url: `/comments/reactions/${hex(ids.commentOutro)}`,
  },
  {
    credencial: 'aluno',
    method: 'POST',
    nome: 'reactions: like duplicado',
    payload: { kind: 'like' },
    url: `/comments/reactions/${hex(ids.commentOutro)}`,
  },
  {
    credencial: 'aluno',
    method: 'POST',
    nome: 'reactions: comentario inexistente',
    payload: { kind: 'like' },
    url: `/comments/reactions/${hex(ids.inexistente)}`,
  },
  {
    credencial: 'aluno',
    ignorar: CRIADO,
    method: 'POST',
    nome: 'reactions: sem kind',
    payload: {},
    url: `/comments/reactions/${hex(ids.commentAluno)}`,
  },
  {
    method: 'POST',
    nome: 'reactions: sem credencial',
    payload: { kind: 'like' },
    url: `/comments/reactions/${hex(ids.commentAluno)}`,
  },
  {
    credencial: 'aluno',
    ignorar: RELOGIO,
    method: 'DELETE',
    nome: 'reactions: remocao',
    url: `/comments/reactions/${hex(ids.commentOutro)}/like`,
  },
  {
    credencial: 'aluno',
    method: 'DELETE',
    nome: 'reactions: remocao inexistente',
    url: `/comments/reactions/${hex(ids.commentAluno)}/like`,
  },
  {
    credencial: 'aluno',
    ignorar: CRIADO,
    method: 'POST',
    nome: 'borda: reaction com campo extra no corpo',
    payload: { extra: 1, kind: 'like' },
    url: `/comments/reactions/${hex(ids.commentAluno)}`,
  },
  {
    credencial: 'aluno',
    ignorar: CRIADO,
    method: 'POST',
    nome: 'borda: reaction com id invalido',
    payload: { kind: 'like' },
    url: '/comments/reactions/nao-e-objectid',
  },
];
