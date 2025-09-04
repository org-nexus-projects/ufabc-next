import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import { z } from 'zod';
import { sesClient } from '@/lib/aws.service.js';
import { SendEmailCommand, type SendEmailCommandInput } from '@aws-sdk/client-ses';

// Endpoint básico para envio em massa que aceita um assunto, corpo HTML (ex: renderizado pelo Vue Email),
// e uma lista de destinatários. Agrupa os destinatários em grupos BCC para eficiência.

const MAX_RECIPIENTS_PER_MESSAGE = 50; // Limite emails do SES por chamada (Revisar esse limite)

// Também é possível enviar em paralelo em batches (concorrência) seguindo o limite do SES (Checar a quantidade se fizer isso)
// Assim, as chamadas seriam feitas em paralelo, e o tempo seria menor.

// Função para agrupar os destinatários em lotes a partir do valor do tamanho
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.post(
    '/send-email',
    {
      schema: {
        body: z.object({
          subject: z.string().min(1),
          html: z.string().min(1),
          recipients: z.array(z.string().email()).min(1),
          from: z.string().email().optional(),
          batchSize: z.number().int().min(1).max(MAX_RECIPIENTS_PER_MESSAGE).optional(),
        }),
      },
    },
    async (request, reply) => {
      const {
        subject,
        html,
        recipients,
        from,
        batchSize = MAX_RECIPIENTS_PER_MESSAGE,
      } = request.body;

      // Remove duplicados da lista de destinatários para evitar envios duplos utilizando o set
      const uniqueRecipients = Array.from(new Set(recipients));

      const fromIdentity = from ?? 'contato@ufabcnext.com'; // Email deve estar verificado no SES

      // Agrupa os destinatários em lotes respeitando o limite do SES
      const batches = chunk(
        uniqueRecipients,
        Math.min(batchSize, MAX_RECIPIENTS_PER_MESSAGE),
      );

      const results: Array<
        | { ok: true; messageId?: string; batch: number }
        | { ok: false; error: string; batch: number }
      > = [];

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const bcc = batches[batchIndex];

        const input: SendEmailCommandInput = {
          Source: `UFABC next <${fromIdentity}>`,
          Destination: {
            // Usando BCC para manter os emails privados entre destinatários
            BccAddresses: bcc,
          },
          Message: {
            Subject: { Data: subject, Charset: 'UTF-8' },
            Body: {
              Html: { Data: html, Charset: 'UTF-8' },
            },
          },
        };

        try {
          const cmd = new SendEmailCommand(input);
          const res = await sesClient.send(cmd);
          results[batchIndex] = { ok: true, messageId: res.MessageId, batch: batchIndex };
          app.log.info(
            { batch: batchIndex, recipients: bcc.length, messageId: res.MessageId },
            'Lote de email enviado',
          );
        } catch (err: any) {
          results[batchIndex] = { ok: false, error: err?.message ?? 'unknown', batch: batchIndex };
          app.log.error({ err, batch: batchIndex }, 'Falha no envio do lote de email');
        }
      }

      const ok = results.filter((r) => r?.ok).length;
      const failed = results.length - ok;

      return reply.send({
        totalRecipients: uniqueRecipients.length,
        batches: batches.length,
        batchSize: Math.min(batchSize, MAX_RECIPIENTS_PER_MESSAGE),
        sentBatches: ok,
        failedBatches: failed,
        // Falhas são resumidas por lote; você pode tentar novamente apenas os índices de lote que falharam
        failures: results
          .map((r, i) => ({ ...r, recipients: batches[i]?.length }))
          .filter((r) => !(r as any).ok),
      });
    },
  );
};

export default plugin;
