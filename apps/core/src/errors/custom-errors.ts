import type { Types } from 'mongoose';

import { NextError } from './base-error.js';

export class EmailVerificationFailed extends NextError {
  constructor(
    description = 'Unable to verify user email',
    translatedDescription = 'Não foi possível verificar o e-mail do usuário'
  ) {
    super(
      'Email Verification Failed',
      'NEX0001',
      400,
      description,
      translatedDescription
    );
  }
}

export class UserWithoutRA extends NextError {
  constructor() {
    super(
      'User Without RA',
      'NEX0002',
      403,
      'User does not have an RA registered',
      'Usuário não possui um RA cadastrado'
    );
  }
}

export class ArchiveParseFailed extends NextError {
  constructor(description: string) {
    super(
      'Archive Parse Failed',
      'NEX0003',
      400,
      description,
      'Não foi possível processar o arquivo enviado'
    );
  }
}

export class ArchiveNotFound extends NextError {
  constructor() {
    super(
      'Archive Not Found',
      'NEX0004',
      404,
      'Archive not found or not yet stored',
      'Arquivo não encontrado ou ainda não armazenado'
    );
  }
}

export class ArchiveFileEmpty extends NextError {
  constructor() {
    super(
      'Archive File Empty',
      'NEX0005',
      500,
      'Empty file on S3',
      'O arquivo enviado está vazio'
    );
  }
}

export class DuplicateComment extends NextError {
  constructor(enrollment: Types.ObjectId) {
    super(
      'Duplicate Comment',
      'NEX0006',
      409,
      'User already has a comment on this enrollment',
      'Você já possui um comentário neste vínculo',
      { enrollment }
    );
  }
}

export class DuplicateReaction extends NextError {
  constructor(comment: Types.ObjectId, user: Types.ObjectId, kind: string) {
    super(
      'Duplicate Reaction',
      'NEX0007',
      409,
      'User already reacted to this comment with this reaction kind',
      'Você não pode reagir duas vezes iguais ao mesmo comentário',
      { comment, user, kind }
    );
  }
}

export class RecommendationNotAllowed extends NextError {
  constructor(comment: Types.ObjectId, user: Types.ObjectId) {
    super(
      'Recommendation Not Allowed',
      'NEX0008',
      403,
      'User cannot recommend a comment for a teacher they have not taken',
      'Você não pode recomendar este comentário, pois não fez nenhuma matéria com este professor',
      { comment, user }
    );
  }
}

export class TeacherSummaryNotFound extends NextError {
  constructor(teacherId: string) {
    super(
      'Teacher Summary Not Found',
      'NEX0009',
      404,
      'No summary available for this teacher',
      'Nenhum resumo disponível para esse professor',
      { teacherId }
    );
  }
}

export class BoardUnauthorized extends NextError {
  constructor() {
    super(
      'Board Unauthorized',
      'NEX0010',
      401,
      'Missing or invalid board token',
      'Token de acesso ao painel ausente ou inválido'
    );
  }
}

export class BoardForbidden extends NextError {
  constructor(userId: string) {
    super(
      'Board Forbidden',
      'NEX0011',
      403,
      'User is not allowed to access the board',
      'Você não tem permissão para acessar o painel',
      { userId }
    );
  }
}

export class InvalidWebhookApiKey extends NextError {
  constructor() {
    super(
      'Invalid Webhook API Key',
      'NEX0012',
      401,
      'Invalid or missing webhook API key',
      'Chave de API do webhook inválida ou ausente'
    );
  }
}

export class InvalidInternalToken extends NextError {
  constructor() {
    super(
      'Invalid Internal Token',
      'NEX0013',
      401,
      'Invalid or missing x-internal-token header',
      'Token interno inválido ou ausente'
    );
  }
}

export class ComponentPlanNotFound extends NextError {
  constructor(componentId: string) {
    super(
      'Component Plan Not Found',
      'NEX0014',
      404,
      'No extracted plan available for this component',
      'Nenhum plano de ensino extraído para esta disciplina',
      { componentId }
    );
  }
}

export class ComponentNotFound extends NextError {
  constructor(externalKey: string) {
    super(
      'Component Not Found',
      'NEX0015',
      404,
      'No component found for this external key',
      'Disciplina não encontrada',
      { externalKey }
    );
  }
}
