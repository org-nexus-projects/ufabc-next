import { describe, expect, it, vi } from 'vitest';

import { ComponentArchivesRepository } from '../../src/repositories/component-archives-repository.js';

function buildFakeModel() {
  const find = vi.fn();
  const countDocuments = vi.fn().mockResolvedValue(0);
  const chain = {
    limit: vi.fn(() => chain),
    lean: vi.fn().mockResolvedValue([]),
    populate: vi.fn(() => chain),
    skip: vi.fn(() => chain),
    sort: vi.fn(() => chain),
  };
  find.mockReturnValue(chain);
  return { countDocuments, find };
}

describe('ComponentArchivesRepository.findPage search', () => {
  it('matches the file name case-insensitively', async () => {
    const model = buildFakeModel();
    const repository = new ComponentArchivesRepository({
      model: model as never,
    });

    await repository.findPage({ limit: 20, page: 1, q: 'plano' });

    expect(model.find).toHaveBeenCalledWith({
      file_name: { $options: 'i', $regex: 'plano' },
    });
    expect(model.countDocuments).toHaveBeenCalledWith({
      file_name: { $options: 'i', $regex: 'plano' },
    });
  });

  it('escapes regex characters typed by the user', async () => {
    const model = buildFakeModel();
    const repository = new ComponentArchivesRepository({
      model: model as never,
    });

    await repository.findPage({ limit: 20, page: 1, q: 'aula (1).pdf' });

    expect(model.find).toHaveBeenCalledWith({
      file_name: { $options: 'i', $regex: 'aula \\(1\\)\\.pdf' },
    });
  });

  it('does not filter by file name without a search', async () => {
    const model = buildFakeModel();
    const repository = new ComponentArchivesRepository({
      model: model as never,
    });

    await repository.findPage({ limit: 20, page: 1, source: 'cmcc' });

    expect(model.find).toHaveBeenCalledWith({ source: 'cmcc' });
  });
});
