import { FastifyAdapter } from '@bull-board/fastify';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js';
import type { Queue } from 'bullmq';

export const boardUiPath = '/board/ui';
export function createBoard(queues: Queue[]) {
  const adapter = new FastifyAdapter();
  adapter.setBasePath(boardUiPath);

  createBullBoard({
    serverAdapter: adapter,
    queues: queues.map((queue) => new BullMQAdapter(queue)),
    options: {
      uiConfig: {
        boardTitle: 'next jobs',
      },
    },
  });

  return adapter;
}
