import { Types } from 'mongoose';

import type { MoodleComponent } from '@/connectors/moodle.js';
import { ComponentMapper } from '@/mappers/component-mapper.js';
import { ComponentModel } from '@/models/Component.js';
import { ComponentMetadataModel } from '@/models/ComponentMetadata.js';
import { componentArchiveSchema } from '@/schemas/v2/components.js';
import { logger as defaultLogger } from '@/utils/logger.js';

export class ComponentsService {
  private readonly mapper = new ComponentMapper();
  private readonly logger: ReturnType<typeof defaultLogger.child>;

  constructor({ requestId }: { requestId: string }) {
    this.logger = defaultLogger.child({ requestId });
  }

  async getComponentArchives(components: MoodleComponent | undefined) {
    const componentArchives = componentArchiveSchema.safeParse(
      components?.data.courses
    );

    if (!componentArchives.success) {
      return {
        error: componentArchives.error.message,
        data: null,
      };
    }

    return {
      error: null,
      data: componentArchives.data,
    };
  }

  async findComponentByIdOrOriginKey(id: string, withMetadata: boolean) {
    this.logger.debug({ id, withMetadata }, 'Looking up component');

    const searchConditions: Array<Record<string, unknown>> = [
      { origin_key: id },
    ];
    if (Types.ObjectId.isValid(id)) {
      searchConditions.push({ _id: id });
    }

    const component = await ComponentModel.findOne({
      $or: searchConditions,
    }).lean();

    if (!component) {
      return null;
    }

    let metadata = null;
    if (withMetadata && component.origin_key) {
      metadata = await ComponentMetadataModel.findOne({
        'metadata.component_data.componentKey': component.origin_key,
      }).lean();
    }

    return this.mapper.toResponse(component, metadata);
  }
}
