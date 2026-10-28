import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';

import { ComponentArchiveMapper } from '../../src/mappers/component-archive-mapper.js';
import { ComponentPlanMapper } from '../../src/mappers/component-plan-mapper.js';
import {
  archiveDownloadResponseSchema,
  archiveListResponseSchema,
  componentPlanResponseSchema,
} from '../../src/schemas/v2/archives.js';

describe('archive and plan mappers match the response schemas', () => {
  it('maps a populated archive page', () => {
    const archive = {
      _id: new Types.ObjectId(),
      component: {
        _id: new Types.ObjectId(),
        codigo: 'DA1MCTB021-17SA',
        disciplina: 'Algoritmos',
        season: '2026:3',
        turma: 'A1',
        turno: 'diurno',
      },
      file_name: '20263_DA1MCTB021-17SA.pdf',
      original_url: 'https://example.com/plan.pdf',
      s3_key: '/archives/1/plan.pdf',
      source: 'cmcc',
      status: 'stored',
    } as never;

    const page = new ComponentArchiveMapper().toPageResponse([archive], {
      limit: 20,
      page: 1,
      total: 1,
    });

    expect(archiveListResponseSchema.safeParse(page).success).toBe(true);
    expect(page.data[0].component).toEqual({
      _id: expect.any(String),
      code: 'DA1MCTB021-17SA',
      group: 'A1',
      name: 'Algoritmos',
      season: '2026:3',
      shift: 'day',
    });
    expect(page.data[0]).not.toHaveProperty('createdAt');
    expect(page.data[0]).not.toHaveProperty('timeline');
    expect(page.data[0]).not.toHaveProperty('s3_key');
    expect(page.data[0]).not.toHaveProperty('original_url');
  });

  it('maps the download and the plan', () => {
    const download = new ComponentArchiveMapper().toDownloadResponse(
      { file_name: 'plan.pdf' } as never,
      { expiresInSeconds: 300, url: 'https://example.com/signed' }
    );
    const plan = new ComponentPlanMapper().toResponse({
      planning: null,
      schedule: [{ date: '06/10', lesson: 'Intro' }],
      timetable: ['segunda'],
    } as never);

    expect(archiveDownloadResponseSchema.safeParse(download).success).toBe(
      true
    );
    expect(componentPlanResponseSchema.safeParse(plan).success).toBe(true);
  });
});
