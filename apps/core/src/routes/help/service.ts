import type {
  FastifyBaseLogger,
  FastifyInstance,
  FastifyRequest,
} from 'fastify';

import type { HelpForm } from '@/schemas/help.js';

import { LegacyBodyError } from '@/errors/custom-errors.js';

export async function submitHelpForm(
  request: FastifyRequest,
  job: Pick<FastifyInstance['job'], 'dispatch'>,
  log: FastifyBaseLogger
) {
  try {
    // Get all parts from the request
    const parts = request.parts();
    const formData = {} as HelpForm;

    for await (const part of parts) {
      // Handle fields
      if (part.type === 'field') {
        const fieldName = part.fieldname as keyof HelpForm;
        formData[fieldName] = part.value as string;
      } else if (part.type === 'file' && part.fieldname === 'image') {
        // Handle image file
        const buffer = await part.toBuffer();
        formData.imageBuffer = buffer.toString('base64');
        formData.imageFilename = part.filename || 'image.png';
        formData.imageMimeType = part.mimetype;
      }
    }

    await job.dispatch('InsertNotionPage', formData);
    return { body: { success: true }, statusCode: 201 };
  } catch (error) {
    log.error({
      msg: 'Failed to create Notion page from help form',
      error: error instanceof Error ? error.message : String(error),
    });
    throw new LegacyBodyError('Failed to process help form', 502, {
      success: false,
      error: 'Failed to process help form. Please try again later.',
    });
  }
}
