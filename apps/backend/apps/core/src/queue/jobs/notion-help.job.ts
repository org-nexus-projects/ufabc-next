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

    let fileUploadId: string | undefined;

    // Upload image to Notion
    if (data.imageBuffer && data.imageFilename && data.imageMimeType) {
      // Convert base64 back to Buffer
      const imageBuffer = Buffer.from(data.imageBuffer, 'base64');
      try {
        //Create file upload object in Notion
        const fileUpload = await notionClient.request({
          method: 'post',
          path: 'file_uploads',
          body: {
            mode: 'single_part',
            filename: data.imageFilename,
          },
        }) as { id: string; upload_url: string; status: string };

        ctx.app.log.debug('File upload object created', { 
          fileUploadId: fileUpload.id, 
          status: fileUpload.status,
          hasUploadUrl: !!fileUpload.upload_url,
          fullResponse: fileUpload 
        });

        // Upload file to the provided upload_url
        const formData = new FormData();
        const blob = new Blob([imageBuffer], { type: data.imageMimeType });
        formData.append('file', blob, data.imageFilename);

        const uploadResponse = await fetch(fileUpload.upload_url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.NOTION_INTEGRATION_SECRET}`,
            'Notion-Version': '2022-06-28',
          },
          body: formData,
        });

        const uploadResult = await uploadResponse.json();

        if (uploadResponse.ok) {
          fileUploadId = fileUpload.id;
          ctx.app.log.debug('File uploaded to Notion successfully', { 
            fileUploadId,
            uploadResult 
          });
        } else {
          const errorText = await uploadResponse.text();
          const uploadError = new Error(`Failed to upload file to Notion: ${uploadResponse.status} ${uploadResponse.statusText}`);
          ctx.app.log.error('Failed to upload file to Notion', { 
            status: uploadResponse.status,
            statusText: uploadResponse.statusText,
            error: errorText
          });
          throw uploadError;
        }
      } catch (uploadError) {
        ctx.app.log.error('Error uploading file to Notion', { 
          error: uploadError instanceof Error ? uploadError.message : String(uploadError),
          stack: uploadError instanceof Error ? uploadError.stack : undefined
        });
        throw uploadError;
      }
    }

    const response = await notionClient.pages.create({
      parent: {
        database_id: ctx.app.config.NOTION_DATABASE_ID,
      },
      properties: {
        card_title: {
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
        ...(fileUploadId && {
          Imagem: {
            type: 'files',
            files: [
              {
                type: 'file_upload',
                name: data.imageFilename || 'Imagem do problema',
                file_upload: {
                  id: fileUploadId,
                },
              },
            ],
          } as any,
        }),
      },
    });

    ctx.app.log.debug({
      msg: 'Message sent successfully',
      id: response.id,
      url: (response as any).url,
    });

    return { id: response.id, url: (response as any).url } as {
      id: string;
      url?: string;
    };
  } catch (error) {
    ctx.app.log.error({
      msg: 'Error creating a message in the database',
      error: error instanceof Error ? error.message : String(error),
      data,
    });
    throw error;
  }
}
