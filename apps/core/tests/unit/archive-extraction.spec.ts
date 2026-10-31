import { UnrecoverableError } from 'bullmq';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ArchiveExtractionService } from '../../src/services/archive-extraction-service.js';

const mocks = vi.hoisted(() => ({
  extractArchive: vi.fn(),
  findArchive: vi.fn(),
  findComponent: vi.fn(),
  getParserComponents: vi.fn(),
  getPresignedUrl: vi.fn(),
  upsertPlan: vi.fn(),
}));

vi.mock('../../src/connectors/extractor.js', () => ({
  ExtractorConnector: vi.fn(() => ({ extractArchive: mocks.extractArchive })),
}));
vi.mock('../../src/connectors/ufabc-parser.js', () => ({
  UfabcParserConnector: vi.fn(() => ({
    getComponentByClassroomCode: mocks.getParserComponents,
  })),
}));
vi.mock('../../src/repositories/component-archives-repository.js', () => ({
  ComponentArchivesRepository: vi.fn(() => ({ findById: mocks.findArchive })),
}));
vi.mock('../../src/repositories/components-repository.js', () => ({
  ComponentsRepository: vi.fn(() => ({
    findLeanById: mocks.findComponent,
  })),
}));
vi.mock('../../src/models/ComponentPlan.js', () => ({
  ComponentPlanModel: { updateOne: mocks.upsertPlan },
}));

const extraction = {
  planning: {
    assessment: 'a',
    methodology: 'm',
    objectives: 'o',
    syllabus: 'e',
  },
  schedule: [{ date: '2026-02-09', lesson: 'Intro' }],
};

function buildService() {
  return new ArchiveExtractionService({
    config: { AWS_BUCKET: 'bucket' } as never,
    globalTraceId: 'trace',
    storageConnector: { getPresignedUrl: mocks.getPresignedUrl } as never,
  });
}

describe('ArchiveExtractionService.extractArchive', () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) {
      mock.mockReset();
    }
  });

  it('rejects archives that are not stored', async () => {
    mocks.findArchive.mockResolvedValue({ status: 'failed' });

    await expect(buildService().extractArchive('a1')).rejects.toBeInstanceOf(
      UnrecoverableError
    );
  });

  it('upserts the plan for the archive', async () => {
    mocks.findArchive.mockResolvedValue({
      _id: 'a1',
      component: 'c1',
      s3_key: 'k.pdf',
      source: 'cmcc',
      status: 'stored',
    });
    mocks.findComponent.mockResolvedValue({
      _id: 'c1',
      season: '2026:1',
      uf_cod_turma: 'DA1MCTD019-18SA',
    });
    mocks.getParserComponents.mockResolvedValue([
      {
        timetable: [{ unparsed: 'seg 08:00' }],
        ufClassroomCode: 'DA1MCTD019-18SA',
      },
    ]);
    mocks.getPresignedUrl.mockResolvedValue('https://signed');
    mocks.extractArchive.mockResolvedValue(extraction);

    await buildService().extractArchive('a1');

    expect(mocks.extractArchive).toHaveBeenCalledWith('https://signed');
    expect(mocks.upsertPlan).toHaveBeenCalledWith(
      { archive: 'a1' },
      {
        $set: expect.objectContaining({
          component: 'c1',
          planning: extraction.planning,
          schedule: [{ date: '2026-02-09', lesson: 'Intro' }],
          timetable: ['seg 08:00'],
        }),
      },
      { upsert: true }
    );
  });
});
