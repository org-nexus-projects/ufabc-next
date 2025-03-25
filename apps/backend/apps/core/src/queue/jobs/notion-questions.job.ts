import { notionClient } from '@/lib/notion.service.js';
import type { QueueContext } from '../types.js';

//TODO:figure out what should be inserted into the notion database
type NotionPage = {
  email: string;
  ra: string;
  problemDescription: string;
};

export async function postInfoIntoNotionDB(ctx: QueueContext<NotionPage>) {
  const data = ctx.job.data;
  try {
    const response = await notionClient.pages.create({
      parent: {
        database_id: ctx.app.config.NOTION_DATABASE_ID,
      },
      //TODO: figure out database structure
      properties: {},
    });

    ctx.app.log.debug({
      msg: 'notion page created successfully',
      id: response.id,
    });
  } catch (error) {
    ctx.app.log.error({
      msg: 'Error creating a page in the notion database',
      error: error instanceof Error ? error.message : String(error),
      data,
    });
    throw error;
  }
}
