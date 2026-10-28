import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ArchiveMonitoringService } from '../../src/services/archive-monitoring-service.js';

const mocks = vi.hoisted(() => ({
  findById: vi.fn(),
  findLatestPlan: vi.fn(),
  getPresignedUrl: vi.fn(),
}));

vi.mock('../../src/repositories/component-archives-repository.js', () => ({
  ComponentArchivesRepository: vi.fn(() => ({ findById: mocks.findById })),
}));
vi.mock('../../src/repositories/component-plans-repository.js', () => ({
  ComponentPlansRepository: vi.fn(() => ({
    findLatestByComponent: mocks.findLatestPlan,
  })),
}));

function buildService() {
  return new ArchiveMonitoringService({
    bucket: 'bucket',
    storageConnector: { getPresignedUrl: mocks.getPresignedUrl } as never,
  });
}

describe('ArchiveMonitoringService.createDownloadUrl', () => {
  beforeEach(() => {
    mocks.findById.mockReset();
    mocks.getPresignedUrl.mockReset();
  });

  it('presigns the s3 key of a stored archive', async () => {
    mocks.findById.mockResolvedValue({
      file_name: 'plan.pdf',
      s3_key: '/archives/1/plan.pdf',
      status: 'stored',
    });
    mocks.getPresignedUrl.mockResolvedValue('https://signed');

    const result = await buildService().createDownloadUrl('archive-id');

    expect(result).toEqual({
      expiresInSeconds: 300,
      fileName: 'plan.pdf',
      url: 'https://signed',
    });
    expect(mocks.getPresignedUrl).toHaveBeenCalledWith(
      'bucket',
      '/archives/1/plan.pdf',
      300
    );
  });

  it('rejects archives that are not stored yet', async () => {
    mocks.findById.mockResolvedValue({ status: 'failed' });

    await expect(
      buildService().createDownloadUrl('archive-id')
    ).rejects.toThrow('Archive Not Found');
    expect(mocks.getPresignedUrl).not.toHaveBeenCalled();
  });
});

describe('ArchiveMonitoringService.findLatestPlan', () => {
  beforeEach(() => {
    mocks.findLatestPlan.mockReset();
  });

  it('throws a custom error when the component has no plan', async () => {
    mocks.findLatestPlan.mockResolvedValue(null);

    await expect(buildService().findLatestPlan('component-id')).rejects.toThrow(
      'Component Plan Not Found'
    );
  });

  it('maps the latest plan to the response shape', async () => {
    mocks.findLatestPlan.mockResolvedValue({
      extractedAt: new Date('2026-10-10T12:00:00.000Z'),
      planning: {
        assessment: 'a',
        methodology: 'm',
        objectives: 'o',
        syllabus: 's',
      },
      schedule: [{ date: '06/10', lesson: 'Intro' }],
      timetable: ['segunda'],
    });

    const result = await buildService().findLatestPlan('component-id');

    expect(result).not.toHaveProperty('extractedAt');
    expect(result.schedule).toEqual([{ date: '06/10', lesson: 'Intro' }]);
  });
});
