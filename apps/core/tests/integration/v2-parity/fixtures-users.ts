import { currentQuad } from '@next/utils';
import { Types } from 'mongoose';
import { vi } from 'vitest';

import { UfabcParserConnector } from '../../../src/connectors/ufabc-parser.js';
import { UfabcParserError } from '../../../src/errors/ufabc-parser.js';
import { ComponentModel } from '../../../src/models/Component.js';
import { StudentModel } from '../../../src/models/Student.js';
import { UserModel } from '../../../src/models/User.js';
import { toPlainJson } from '../entities/v2-parity/fixtures.js';

export const RA_ALUNO = 11_202_230_000;
export const RA_PENDENTE = 11_202_230_004;
export const RA_OAUTH = 11_202_230_005;
export const RA_ADMIN = 11_202_230_009;
export const RA_INEXISTENTE = 11_202_239_991;
export const RA_CONTRATO_PARSER = 11_202_239_992;
export const RA_PROFESSOR = 11_202_239_993;
export const RA_EMAIL_INVALIDO = 11_202_239_994;

export const EMAIL_ALUNO = 'aluno.teste@aluno.ufabc.edu.br';
export const EMAIL_PENDENTE = 'pendente.aluno@aluno.ufabc.edu.br';
export const EMAIL_OAUTH = 'oauth.aluno@aluno.ufabc.edu.br';
export const EMAIL_FACEBOOK = 'aluno.facebook@aluno.ufabc.edu.br';
export const EMAIL_FACEBOOK_ANTIGO = 'antigo.facebook@aluno.ufabc.edu.br';
export const TOKEN_CONFIRMACAO = '__TOKEN_CONFIRMACAO__';

const MOMENTO = new Date('2024-03-01T12:00:00.000Z');

export const idsUsers = {
  admin: new Types.ObjectId('65f400000000000000000079'),
  aluno: new Types.ObjectId('65f400000000000000000071'),
  oauth: new Types.ObjectId('65f400000000000000000073'),
  pendente: new Types.ObjectId('65f400000000000000000072'),
  studentAluno: new Types.ObjectId('65f400000000000000000081'),
} as const;

const ids = idsUsers;

function colecoes() {
  return [
    ComponentModel.collection,
    StudentModel.collection,
    UserModel.collection,
  ];
}

export async function seedUsers() {
  await Promise.all(
    colecoes().map(async (colecao) => colecao.deleteMany({}))
  );

  await UserModel.collection.insertMany([
    {
      __v: 0,
      _id: ids.aluno,
      active: true,
      confirmed: true,
      createdAt: MOMENTO,
      devices: [],
      email: EMAIL_ALUNO,
      expiresAt: null,
      oauth: {
        email: EMAIL_ALUNO,
        emailFacebook: EMAIL_FACEBOOK,
        emailGoogle: EMAIL_ALUNO,
        facebookEmail: EMAIL_FACEBOOK_ANTIGO,
        google: 'google-aluno',
      },
      permissions: [],
      ra: RA_ALUNO,
      updatedAt: MOMENTO,
    },
    {
      __v: 0,
      _id: ids.pendente,
      active: true,
      confirmed: false,
      createdAt: MOMENTO,
      devices: [],
      email: EMAIL_PENDENTE,
      expiresAt: null,
      oauth: {
        email: 'pendente.google@aluno.ufabc.edu.br',
        google: 'google-pendente',
      },
      permissions: [],
      ra: RA_PENDENTE,
      updatedAt: MOMENTO,
    },
    {
      __v: 0,
      _id: ids.oauth,
      active: true,
      confirmed: false,
      createdAt: MOMENTO,
      devices: [],
      expiresAt: null,
      oauth: {
        email: EMAIL_OAUTH,
        google: 'google-oauth',
      },
      permissions: [],
      updatedAt: MOMENTO,
    },
    {
      __v: 0,
      _id: ids.admin,
      active: true,
      confirmed: true,
      createdAt: MOMENTO,
      devices: [],
      email: 'admin.next@ufabc.edu.br',
      expiresAt: null,
      oauth: { email: 'admin.next@ufabc.edu.br', google: 'google-admin' },
      permissions: ['admin'],
      ra: RA_ADMIN,
      updatedAt: MOMENTO,
    },
  ]);

  await StudentModel.collection.insertMany([
    {
      __v: 0,
      _id: ids.studentAluno,
      aluno_id: 5001,
      createdAt: MOMENTO,
      cursos: [],
      login: 'aluno.teste',
      ra: RA_ALUNO,
      season: currentQuad(),
      updatedAt: MOMENTO,
    },
  ]);
}

export async function snapshotUsers() {
  const snapshot: Record<string, unknown> = {};

  for (const colecao of colecoes()) {
    const documentos = await colecao.find({}).sort({ _id: 1 }).toArray();
    snapshot[colecao.collectionName] = toPlainJson(documentos);
  }

  return snapshot;
}

function erroParser(code: string) {
  return new UfabcParserError({
    code,
    description: `erro simulado ${code}`,
    status: 400,
    title: 'Erro simulado',
  });
}

const alunosDoParser = new Map<string, { email: string | string[]; login: string }>([
  [String(RA_ALUNO), { email: [EMAIL_ALUNO], login: 'aluno.teste' }],
  [String(RA_PENDENTE), { email: [EMAIL_PENDENTE], login: 'pendente.aluno' }],
  [
    String(RA_OAUTH),
    { email: [EMAIL_OAUTH, 'oauth.aluno@ufabc.edu.br'], login: 'oauth.aluno' },
  ],
  [
    String(RA_PROFESSOR),
    { email: ['professor.contrato@ufabc.edu.br'], login: 'professor.contrato' },
  ],
  [
    String(RA_EMAIL_INVALIDO),
    { email: 'email.invalido@aluno.ufabc.edu.br', login: 'email.invalido' },
  ],
]);

export function simularParser() {
  vi.spyOn(UfabcParserConnector.prototype, 'getStudent').mockImplementation(
    async (ra: string) => {
      const chave = String(ra);

      if (chave === String(RA_INEXISTENTE)) {
        throw erroParser('UFP0015');
      }

      if (chave === String(RA_CONTRATO_PARSER)) {
        throw erroParser('UFP0031');
      }

      const aluno = alunosDoParser.get(chave);

      if (!aluno) {
        throw new Error(`RA nao previsto na simulacao: ${chave}`);
      }

      return {
        email: aluno.email as string[],
        login: aluno.login,
        metadata: {},
        ra: chave,
        studentKey: `chave-${chave}`,
      };
    }
  );

  vi.spyOn(UfabcParserConnector.prototype, 'getTeacher').mockImplementation(
    async (login: string) =>
      login === 'professor.contrato'
        ? {
            aliases: [],
            email: ['professor.contrato@ufabc.edu.br'],
            metadata: {},
            name: 'Professor Contrato',
            room: null,
            teacherKey: 'professor-contrato',
          }
        : null
  );
}

export function formularioMultipart(
  campos: Record<string, string>,
  imagem?: { conteudo: string; nome: string; tipo: string }
) {
  const limite = 'limite-paridade';
  const partes = Object.entries(campos).map(
    ([nome, valor]) =>
      `--${limite}\r\nContent-Disposition: form-data; name="${nome}"\r\n\r\n${valor}\r\n`
  );

  if (imagem) {
    partes.push(
      `--${limite}\r\nContent-Disposition: form-data; name="image"; filename="${imagem.nome}"\r\nContent-Type: ${imagem.tipo}\r\n\r\n${imagem.conteudo}\r\n`
    );
  }

  return {
    headers: { 'content-type': `multipart/form-data; boundary=${limite}` },
    payload: `${partes.join('')}--${limite}--\r\n`,
  };
}

export type CredencialUsers = 'admin' | 'aluno' | 'oauth' | 'pendente';

export type CasoUsers = {
  credencial?: CredencialUsers;
  falharJob?: boolean;
  headers?: Record<string, string>;
  ignorar?: readonly string[];
  method: 'DELETE' | 'GET' | 'POST' | 'PUT';
  nome: string;
  payload?: Record<string, unknown> | string;
  semDeprecation?: boolean;
  url: string;
};

const RELOGIO = ['updatedAt', 'expiresAt'] as const;

const CAMPOS_AJUDA = {
  email: EMAIL_ALUNO,
  problemDescription: 'Nao consigo ver minhas notas',
  problemTitle: 'Notas sumiram',
  ra: String(RA_ALUNO),
};

export const casosUsers: readonly CasoUsers[] = [
  {
    credencial: 'aluno',
    method: 'GET',
    nome: 'users: info do aluno',
    url: '/users/info',
  },
  {
    method: 'GET',
    nome: 'users: info sem credencial',
    url: '/users/info',
  },
  {
    method: 'GET',
    nome: 'users: validacao de ra existente',
    url: `/users/validate/${RA_ALUNO}`,
  },
  {
    method: 'GET',
    nome: 'users: validacao de ra inexistente',
    url: `/users/validate/${RA_INEXISTENTE}`,
  },
  {
    method: 'GET',
    nome: 'users: validacao de ra nao numerico',
    url: '/users/validate/abc',
  },
  {
    method: 'POST',
    nome: 'users: login facebook',
    payload: { email: EMAIL_FACEBOOK, ra: RA_ALUNO },
    url: '/users/facebook',
  },
  {
    method: 'POST',
    nome: 'users: login facebook de usuario inexistente',
    payload: { email: EMAIL_FACEBOOK, ra: RA_INEXISTENTE },
    url: '/users/facebook',
  },
  {
    method: 'POST',
    nome: 'users: login facebook com email antigo',
    payload: { email: EMAIL_FACEBOOK_ANTIGO, ra: RA_ALUNO },
    url: '/users/facebook',
  },
  {
    method: 'POST',
    nome: 'users: login facebook sem campos',
    payload: {},
    url: '/users/facebook',
  },
  {
    credencial: 'pendente',
    method: 'POST',
    nome: 'users: reenvio de confirmacao',
    url: '/users/resend',
  },
  {
    credencial: 'aluno',
    method: 'POST',
    nome: 'users: reenvio para usuario ja confirmado',
    url: '/users/resend',
  },
  {
    credencial: 'oauth',
    ignorar: RELOGIO,
    method: 'PUT',
    nome: 'users: cadastro com email do oauth',
    payload: { email: EMAIL_OAUTH, ra: RA_OAUTH },
    url: '/users/complete',
  },
  {
    credencial: 'pendente',
    ignorar: RELOGIO,
    method: 'PUT',
    nome: 'users: cadastro com envio de confirmacao',
    payload: { email: EMAIL_PENDENTE.toUpperCase(), ra: RA_PENDENTE },
    url: '/users/complete',
  },
  {
    credencial: 'pendente',
    method: 'PUT',
    nome: 'users: cadastro com email divergente',
    payload: { email: EMAIL_ALUNO, ra: RA_PENDENTE },
    url: '/users/complete',
  },
  {
    credencial: 'pendente',
    method: 'PUT',
    nome: 'users: cadastro com ra inexistente',
    payload: { email: EMAIL_PENDENTE, ra: RA_INEXISTENTE },
    url: '/users/complete',
  },
  {
    credencial: 'pendente',
    method: 'PUT',
    nome: 'users: cadastro de professor',
    payload: { email: 'professor.contrato@ufabc.edu.br', ra: RA_PROFESSOR },
    url: '/users/complete',
  },
  {
    credencial: 'pendente',
    method: 'PUT',
    nome: 'users: cadastro com erro UFP0031 do parser',
    payload: { email: EMAIL_PENDENTE, ra: RA_CONTRATO_PARSER },
    url: '/users/complete',
  },
  {
    credencial: 'pendente',
    method: 'PUT',
    nome: 'users: cadastro com email do parser invalido',
    payload: { email: 'email.invalido@aluno.ufabc.edu.br', ra: RA_EMAIL_INVALIDO },
    url: '/users/complete',
  },
  {
    method: 'PUT',
    nome: 'users: cadastro sem credencial',
    payload: { email: EMAIL_PENDENTE, ra: RA_PENDENTE },
    url: '/users/complete',
  },
  {
    credencial: 'pendente',
    ignorar: RELOGIO,
    method: 'POST',
    nome: 'users: confirmacao por token',
    payload: { token: TOKEN_CONFIRMACAO },
    url: '/users/confirm',
  },
  {
    credencial: 'pendente',
    method: 'POST',
    nome: 'users: confirmacao com token invalido',
    payload: { token: 'token-invalido' },
    url: '/users/confirm',
  },
  {
    credencial: 'aluno',
    ignorar: RELOGIO,
    method: 'DELETE',
    nome: 'users: desativacao',
    url: '/users/remove',
  },
  {
    method: 'GET',
    nome: 'users: consulta de email',
    url: `/users/check-email?ra=${RA_ALUNO}`,
  },
  {
    method: 'GET',
    nome: 'users: consulta de email com ra inexistente',
    url: `/users/check-email?ra=${RA_INEXISTENTE}`,
  },
  {
    method: 'GET',
    nome: 'users: consulta de email com erro UFP0031',
    url: `/users/check-email?ra=${RA_CONTRATO_PARSER}`,
  },
  {
    method: 'GET',
    nome: 'users: consulta de email sem ra',
    url: '/users/check-email',
  },
  {
    method: 'POST',
    nome: 'users: recuperacao de conta',
    payload: { email: EMAIL_ALUNO },
    url: '/users/recover',
  },
  {
    method: 'POST',
    nome: 'users: recuperacao com email desconhecido',
    payload: { email: 'desconhecido@aluno.ufabc.edu.br' },
    url: '/users/recover',
  },
  {
    method: 'POST',
    nome: 'help: formulario com campos',
    ...formularioMultipart(CAMPOS_AJUDA),
    url: '/help/form',
  },
  {
    method: 'POST',
    nome: 'help: formulario com imagem',
    ...formularioMultipart(CAMPOS_AJUDA, {
      conteudo: 'conteudo-da-imagem',
      nome: 'print.png',
      tipo: 'image/png',
    }),
    url: '/help/form',
  },
  {
    falharJob: true,
    method: 'POST',
    nome: 'help: formulario com falha ao enfileirar',
    ...formularioMultipart(CAMPOS_AJUDA),
    url: '/help/form',
  },
  {
    method: 'POST',
    nome: 'help: formulario sem multipart',
    payload: CAMPOS_AJUDA,
    url: '/help/form',
  },
  {
    credencial: 'admin',
    method: 'PUT',
    nome: 'sync: matriculados como admin',
    payload: { operation: 'after_kick' },
    url: '/sync/enrolled?season=2024:1',
  },
  {
    credencial: 'admin',
    method: 'PUT',
    nome: 'sync: operacao invalida',
    payload: { operation: 'outra' },
    url: '/sync/enrolled',
  },
  {
    credencial: 'aluno',
    method: 'PUT',
    nome: 'sync: matriculados sem permissao',
    payload: { operation: 'after_kick' },
    url: '/sync/enrolled',
  },
  {
    method: 'PUT',
    nome: 'sync: matriculados sem credencial',
    payload: { operation: 'after_kick' },
    url: '/sync/enrolled',
  },
  {
    credencial: 'aluno',
    method: 'GET',
    nome: 'borda: users info com query extra',
    url: '/users/info?extra=1',
  },
  {
    method: 'GET',
    nome: 'borda: validate com barra final',
    semDeprecation: true,
    url: '/users/validate/abc/',
  },
];
