import { AIProxyConnector } from '@/connectors/ai-proxy.js';
import {
  ComponentNotFound,
  ComponentPlanNotFound,
} from '@/errors/custom-errors.js';
import { ComponentPlansRepository } from '@/repositories/component-plans-repository.js';
import { ComponentsRepository } from '@/repositories/components-repository.js';

import type { BaseServiceOptions } from './base-service.js';
import { BaseService } from './base-service.js';

type ComponentPlanChatOptions = BaseServiceOptions & {
  agentUrl: string;
};

type AnswerInput = {
  externalKey: string;
  season: string;
  userMessage: string;
};

export class ComponentPlanChatService extends BaseService {
  private readonly aiConnector: AIProxyConnector;
  private readonly componentsRepository: ComponentsRepository;
  private readonly plansRepository: ComponentPlansRepository;

  constructor(options: ComponentPlanChatOptions) {
    super({ globalTraceId: options.globalTraceId });
    this.aiConnector = new AIProxyConnector(options.agentUrl, 'whatsapp');
    this.componentsRepository = new ComponentsRepository({
      globalTraceId: this.globalTraceId,
    });
    this.plansRepository = new ComponentPlansRepository({
      globalTraceId: this.globalTraceId,
    });
  }

  async answer(input: AnswerInput) {
    let component = await this.componentsRepository.findLeanByOriginKey(
      input.externalKey,
      input.season
    );

    component ??= await this.componentsRepository.findLatestLeanByOriginKey(
      input.externalKey
    );

    if (component === null) {
      throw new ComponentNotFound(input.externalKey);
    }

    const plan = await this.plansRepository.findLatestByComponent(
      String(component._id)
    );

    if (plan === null) {
      throw new ComponentPlanNotFound(String(component._id));
    }

    return await this.aiConnector.requestNaturalResponse({
      classroomCode: component.uf_cod_turma,
      componentName: component.disciplina,
      plan,
      teacherName: component.teoria?.name ?? '',
      userMessage: input.userMessage,
    });
  }
}
