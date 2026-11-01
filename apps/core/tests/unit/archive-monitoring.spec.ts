import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ArchiveMonitoringService } from '../../src/services/archive-monitoring-service.js';

const mocks = vi.hoisted(() => ({
  findById: vi.fn(),
  getPresignedUrl: vi.fn(),
}));

vi.mock('../../src/repositories/component-archives-repository.js', () => ({
  ComponentArchivesRepository: vi.fn(() => ({ findById: mocks.findById })),
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
