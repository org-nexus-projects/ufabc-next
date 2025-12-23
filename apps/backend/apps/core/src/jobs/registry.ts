import type { FastifyInstance } from 'fastify';
import { componentsArchivesProcessingJob } from './components-archive-processing.js';

export async function registerJobs(app: FastifyInstance): Promise<void> {
  app.manager.register(componentsArchivesProcessingJob);
  await app.manager.start();
  await app.manager.board();
}
