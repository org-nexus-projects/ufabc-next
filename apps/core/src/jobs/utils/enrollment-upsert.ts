import type { QueryFilter as FilterQuery } from 'mongoose';

import { FastifyBaseLogger } from 'fastify';

import { EnrollmentModel, type Enrollment } from '@/models/Enrollment.js';

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
}

export async function upsertEnrollment(
  enrollmentData: Partial<Enrollment>,
  log: FastifyBaseLogger
): Promise<string | null> {
  // @ts-ignore - Mongoose FilterQuery type
  const base: FilterQuery<Enrollment> = {
    ra: enrollmentData.ra,
    season: enrollmentData.season,
  };

  let query = { ...base, uf_cod_turma: enrollmentData.uf_cod_turma };
  let enrollment = await EnrollmentModel.findOneAndUpdate(
    query,
    { $set: enrollmentData },
    { new: true }
  );

  if (!enrollment && enrollmentData.disciplina_id) {
    // @ts-ignore - Mongoose FilterQuery type
    query = { ...base, disciplina_id: enrollmentData.disciplina_id };
    enrollment = await EnrollmentModel.findOneAndUpdate(
      query,
      { $set: enrollmentData },
      { new: true }
    );
  }

  if (!enrollment && enrollmentData.subject) {
    // @ts-ignore - Mongoose FilterQuery type
    query = { ...base, subject: enrollmentData.subject };
    enrollment = await EnrollmentModel.findOneAndUpdate(
      query,
      { $set: enrollmentData },
      { new: true }
    );
  }

  if (!enrollment && enrollmentData.disciplina) {
    const normalizedDisciplina = normalizeText(enrollmentData.disciplina);
    // @ts-ignore - Mongoose FilterQuery type
    query = {
      ...base,
      disciplina: { $regex: normalizedDisciplina, $options: 'i' },
    } as FilterQuery<Enrollment>;
    enrollment = await EnrollmentModel.findOneAndUpdate(
      query,
      { $set: enrollmentData },
      { new: true }
    );
  }

  if (!enrollment) {
    enrollment = await EnrollmentModel.create(enrollmentData);
    log.debug({
      enrollmentId: enrollment?.identifier,
      ra: enrollment?.ra,
      disciplina: enrollment?.disciplina,
      uf_cod_turma: enrollment?.uf_cod_turma,
      season: enrollment?.season,
    });
  } else {
    log.debug(
      {
        enrollmentId: enrollment?.identifier,
        ra: enrollment?.ra,
        disciplina: enrollment?.disciplina,
        uf_cod_turma: enrollment?.uf_cod_turma,
        season: enrollment?.season,
      },
      'Enrollment updated'
    );
  }

  return enrollment?._id?.toString() || null;
}
