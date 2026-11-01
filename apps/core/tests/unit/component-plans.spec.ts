import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ComponentPlansService } from '../../src/services/component-plans-service.js';

const mocks = vi.hoisted(() => ({
  findLatestPlan: vi.fn(),
}));

vi.mock('../../src/repositories/component-plans-repository.js', () => ({
  ComponentPlansRepository: vi.fn(() => ({
    findLatestByComponent: mocks.findLatestPlan,
  })),
}));

describe('ComponentPlansService.findLatestPlan', () => {
  beforeEach(() => {
    mocks.findLatestPlan.mockReset();
  });

  it('throws a custom error when the component has no plan', async () => {
    mocks.findLatestPlan.mockResolvedValue(null);

    await expect(
      new ComponentPlansService().findLatestPlan('component-id')
    ).rejects.toThrow('Component Plan Not Found');
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

    const result = await new ComponentPlansService().findLatestPlan(
      'component-id'
    );

    expect(result).not.toHaveProperty('extractedAt');
    expect(result.schedule).toEqual([{ date: '06/10', lesson: 'Intro' }]);
  });
});
