import { ComponentPlanNotFound } from '@/errors/custom-errors.js';
import { ComponentPlanMapper } from '@/mappers/component-plan-mapper.js';
import { ComponentPlansRepository } from '@/repositories/component-plans-repository.js';

import type { BaseServiceOptions } from './base-service.js';
import { BaseService } from './base-service.js';

export class ComponentPlansService extends BaseService {
  private readonly planMapper = new ComponentPlanMapper();
  private readonly plansRepository: ComponentPlansRepository;

  constructor(options: BaseServiceOptions = {}) {
    super({ globalTraceId: options.globalTraceId });
    this.plansRepository = new ComponentPlansRepository({
      globalTraceId: this.globalTraceId,
    });
  }

  async findLatestPlan(componentId: string) {
    const plan = await this.plansRepository.findLatestByComponent(componentId);

    if (!plan) {
      throw new ComponentPlanNotFound();
    }

    return this.planMapper.toResponse(plan);
  }
}
