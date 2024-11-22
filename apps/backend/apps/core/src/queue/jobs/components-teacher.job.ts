import { getComponentsFile } from '@/modules-v2/ufabc-parser.js';
import type { QueueContext } from '../types.js';

export async function processComponentsTeachers(
  ctx: QueueContext<{ season: string; hash?: string; link: string }>,
) {
  const { season, hash, link, ignoreErrors } = ctx.job.data;
  const componentsWithTeachers = await getComponentsFile(link);
  const errors: string[] = [];
}
