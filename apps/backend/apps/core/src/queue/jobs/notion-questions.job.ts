import { notionClient } from '@/lib/notion.service.js';
import type { QueueContext } from '../types.js';
import type { HelpForm } from '@/schemas/help.js';

export async function postInfoIntoNotionDB(
  ctx: QueueContext<HelpForm>,
) {
  const data = ctx.job.data;
  try {
    const requestDay = new Date(ctx.job.timestamp);
    const yyyy = requestDay.getUTCFullYear();
    const mm = String(requestDay.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(requestDay.getUTCDate()).padStart(2, '0');
    const dateOnlyIso = `${yyyy}-${mm}-${dd}`;

    const response = await notionClient.pages.create({
      parent: {
        database_id: ctx.app.config.NOTION_DATABASE_ID,
      },
      properties: {
        Titulo: {
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
        Descricao: {
          type: 'rich_text',
          rich_text: [
            {
              type: 'text',
              text: {
                content: data.problemDescription,
              },
            },
          ],
        },
        RA: {
          type: 'rich_text',
          rich_text: [
              {
                
                  type: 'text',
                  text: {
                    content: data.ra,
              },
            },
            
          ],
        },
        Email: {
          type: 'email',
          email: data.email,
        },
        Prioridade: {
          type: 'select',
          select: {
            name: 'Baixa',
          },
        },
        Data: {
          type: 'date',
          date: {
            start: dateOnlyIso,
          },
        },
      },
    });

    ctx.app.log.debug({
      msg: 'Notion page created successfully',
      id: response.id,
      url: (response as any).url,
    });

    return { id: response.id, url: (response as any).url } as {
      id: string;
      url?: string;
    };
  } catch (error) {
    ctx.app.log.error({
      msg: 'Error creating a page in the notion database',
      error: error instanceof Error ? error.message : String(error),
      data,
    });
    throw error;
  }
}
