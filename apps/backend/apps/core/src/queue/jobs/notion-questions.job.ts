import { notionClient } from '@/lib/notion.service.js';
import type { QueueContext } from '../types.js';
import { HelpForm } from '@/schemas/help.js';

export async function postInfoIntoNotionDB(ctx: QueueContext<HelpForm>) {
  const data = ctx.job.data;
  try {
    const response = await notionClient.pages.create({
      parent: {
        database_id: ctx.app.config.NOTION_DATABASE_ID,
      },
      properties: {
        Status: {
          type: 'status',
          status: { name: 'Not started' },
        },
        Name: {
          type: 'title',
          title: [
            {
              type: 'text',
              text: {
                content: data.problemTitle,
              },
            },
          ],
        },
      },
      children: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: data.problemDescription,
                },
              },
            ],
          },
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: data.ra,
                },
              },
            ],
          },
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: data.email,
                },
              },
            ],
          },
        },
      ],
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
