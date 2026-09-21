import { Types } from 'mongoose';
import { vi } from 'vitest';

import { UserModel } from '../../../src/models/User.js';
import { toPlainJson } from '../entities/v2-parity/fixtures.js';
import { simulacaoOfetch } from './simulacao-ofetch.js';

export const EMAIL_CONFIRMADO = 'aluno.teste@aluno.ufabc.edu.br';
export const EMAIL_NOVO = 'novo.aluno@aluno.ufabc.edu.br';
export const EMAIL_EXTERNO = 'alguem@gmail.com';

const MOMENTO = new Date('2024-03-01T12:00:00.000Z');

export const idsLogin = {
  confirmado: new Types.ObjectId('65f500000000000000000071'),
} as const;

export async function seedLogin() {
  await UserModel.collection.deleteMany({});

  await UserModel.collection.insertMany([
    {
      __v: 0,
      _id: idsLogin.confirmado,
      active: true,
      confirmed: true,
      createdAt: MOMENTO,
      devices: [],
      email: EMAIL_CONFIRMADO,
      expiresAt: null,
      oauth: {
        email: EMAIL_CONFIRMADO,
        emailGoogle: EMAIL_CONFIRMADO,
        google: 'google-confirmado',
      },
      permissions: [],
      ra: 11_202_230_000,
      updatedAt: MOMENTO,
    },
  ]);
}

export async function snapshotLogin() {
  const documentos = await UserModel.collection
    .find({})
    .sort({ email: 1 })
    .toArray();

  return { users: toPlainJson(documentos) };
}

const usuariosGoogle = new Map<string, { email: string; id: string }>([
  ['codigo-confirmado', { email: EMAIL_CONFIRMADO, id: 'google-confirmado' }],
  ['codigo-novo', { email: EMAIL_NOVO, id: 'google-novo' }],
  ['codigo-externo', { email: EMAIL_EXTERNO, id: 'google-externo' }],
]);

export function estado(payload: Record<string, string>) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

export function simularGoogle(oauth2: { getToken: unknown }) {
  vi.spyOn(oauth2 as { getToken: (params: { code: string }) => Promise<unknown> }, 'getToken').mockImplementation(
    async ({ code }) => {
      if (code === 'codigo-erro-provedor') {
        throw Object.assign(new Error('provedor recusou'), {
          data: {
            payload: {
              error: 'invalid_grant',
              error_description: 'Bad Request',
            },
            res: { statusCode: 400 },
          },
        });
      }

      return { token: { access_token: code, token_type: 'Bearer' } };
    }
  );

  simulacaoOfetch.resposta = async (_url, opcoes) => {
    const codigo =
      opcoes?.headers?.get('Authorization')?.replace('Bearer ', '') ?? '';
    const usuario = usuariosGoogle.get(codigo);

    if (!usuario) {
      throw new Error(`codigo nao previsto na simulacao: ${codigo}`);
    }

    return {
      displayName: 'Usuario Simulado',
      emails: [{ account: 'account', value: usuario.email }],
      etag: 'etag',
      id: usuario.id,
      image: { url: 'https://exemplo.invalido/foto.png' },
      kind: 'plus#person',
      language: 'pt-BR',
      nickname: 'simulado',
    };
  };
}

export function encerrarSimulacaoGoogle() {
  simulacaoOfetch.resposta = undefined;
}

export type CasoLogin = {
  ignorar?: readonly string[];
  method: 'GET' | 'POST';
  nome: string;
  payload?: Record<string, unknown>;
  url: string;
};

const CRIADO = ['_id', 'createdAt', 'updatedAt', 'expiresAt'] as const;

const callback = (codigo: string, payload: Record<string, string>) =>
  `/login/google/callback?code=${codigo}&state=${estado(payload)}`;

export const casosLogin: readonly CasoLogin[] = [
  {
    method: 'GET',
    nome: 'login: inicio para o next',
    url: '/login/google?requesterKey=ufabc-next',
  },
  {
    method: 'GET',
    nome: 'login: inicio para o cronos com usuario',
    url: `/login/google?requesterKey=ufabc-cronos&userId=${idsLogin.confirmado.toHexString()}`,
  },
  {
    method: 'GET',
    nome: 'login: inicio sem parametros',
    url: '/login/google',
  },
  {
    ignorar: ['updatedAt'],
    method: 'GET',
    nome: 'login: callback do next com usuario confirmado',
    url: callback('codigo-confirmado', { requesterKey: 'ufabc-next', userId: '' }),
  },
  {
    ignorar: ['updatedAt'],
    method: 'GET',
    nome: 'login: callback do next para web-local',
    url: callback('codigo-confirmado', {
      redirectTarget: 'web-local',
      requesterKey: 'ufabc-next',
      userId: '',
    }),
  },
  {
    ignorar: ['updatedAt'],
    method: 'GET',
    nome: 'login: callback do cronos com usuario confirmado',
    url: callback('codigo-confirmado', { requesterKey: 'ufabc-cronos', userId: '' }),
  },
  {
    ignorar: CRIADO,
    method: 'GET',
    nome: 'login: callback do cronos com usuario novo',
    url: callback('codigo-novo', { requesterKey: 'ufabc-cronos', userId: '' }),
  },
  {
    method: 'GET',
    nome: 'login: callback com email fora da ufabc',
    url: callback('codigo-externo', { requesterKey: 'ufabc-next', userId: '' }),
  },
  {
    method: 'GET',
    nome: 'login: callback com requester invalido',
    url: callback('codigo-confirmado', { requesterKey: 'outro', userId: '' }),
  },
  {
    method: 'GET',
    nome: 'login: callback web-local fora do next',
    url: callback('codigo-confirmado', {
      redirectTarget: 'web-local',
      requesterKey: 'ufabc-cronos',
      userId: '',
    }),
  },
  {
    method: 'GET',
    nome: 'login: callback com erro do provedor',
    url: callback('codigo-erro-provedor', { requesterKey: 'ufabc-next', userId: '' }),
  },
  {
    method: 'GET',
    nome: 'login: callback sem code',
    url: `/login/google/callback?state=${estado({ requesterKey: 'ufabc-next' })}`,
  },
  {
    method: 'GET',
    nome: 'login: callback com state ilegivel',
    url: '/login/google/callback?code=codigo-confirmado&state=nao-e-json',
  },
  {
    method: 'GET',
    nome: 'borda: login com requesterKey repetido',
    url: '/login/google?requesterKey=ufabc-next&requesterKey=ufabc-cronos',
  },
  {
    method: 'GET',
    nome: 'borda: login com query extra',
    url: '/login/google?requesterKey=ufabc-next&extra=1',
  },
];
