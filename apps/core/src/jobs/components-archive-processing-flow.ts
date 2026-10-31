import { defineJob } from '@next/queues/client';
import { UnrecoverableError } from 'bullmq';
import z from 'zod';

import { JOB_NAMES } from '@/constants.js';
import { ArchiveEngine } from '@/services/archive-engine.js';
import { ComponentArchivesService } from '@/services/component-archives-service.js';

const componentSchema = z.object({
  fullname: z.string(),
  id: z.number(),
  idnumber: z.string().optional(),
  shortname: z.string().optional(),
  startdate: z.number().optional(),
  viewurl: z.string().url(),
});

export const componentsArchivesProcessingJob = defineJob(
  JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING
)
  .input(
    z.object({
      component: componentSchema.array(),
      enrolledCodigos: z.array(z.string()).optional(),
      globalTraceId: z.string().optional(),
      session: z.object({
        sessKey: z.string(),
        sessionId: z.string(),
      }),
    })
  )
  .iterator('component')
  .concurrency(3)
  .handler(async ({ job, manager }) => {
    const { component, session, enrolledCodigos } = job.data;
    const { globalTraceId } = job.data;

    const engine = new ArchiveEngine({ globalTraceId, session });

    const teacherNames = await engine.extractTeacherNames(component.id);

    const matchedComponent = await engine.findComponentByMoodleCourse(
      component,
      teacherNames,
      enrolledCodigos
    );

    if (!matchedComponent) {
      throw new UnrecoverableError(
        `No matching component found for Moodle course: "${component.fullname}" (id: ${component.id}). ` +
          `Could not find a matching component in the system.`
      );
    }

    const componentId = matchedComponent._id.toString();

    const files = await engine.extractFiles(component.viewurl, component.id);

    if (files.length === 0) {
      return {
        data: [],
        message: 'No PDFs found in component',
        success: true,
      };
    }

    await manager.dispatchFlow({
      children: files.map((file) => ({
        data: {
          component: component.fullname,
          componentId,
          globalTraceId,
          rawUrl: file.url,
          session,
        },
        name: JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING_PDF,
        queueName: JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING_PDF,
      })),
      data: { globalTraceId, name: component.fullname, total: files.length },
      name: `summary-${component.fullname}`,
      queueName: JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING_SUMMARY,
    });

    return {
      componentId,
      flowStarted: true,
      moodleCourseId: component.id,
      success: true,
    };
  });

export const pdfDownloadJob = defineJob(
  JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING_PDF
)
  .input(
    z.object({
      component: z.string(),
      componentId: z.string(),
      globalTraceId: z.string().optional(),
      rawUrl: z.string().url(),
      session: z
        .object({
          sessKey: z.string(),
          sessionId: z.string(),
        })
        .optional(),
    })
  )
  .concurrency(3)
  .handler(async ({ job, app }) => {
    const { rawUrl, componentId, globalTraceId, session } = job.data;

    const archivesService = new ComponentArchivesService({
      globalTraceId,
      s3Connector: app.aws.s3,
      session,
    });

    return await archivesService.processArchive({
      bucket: app.config.AWS_BUCKET,
      componentId,
      rawUrl,
    });
  });

export const archivesSummaryJob = defineJob(
  JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING_SUMMARY
)
  .input(
    z.object({
      globalTraceId: z.string().optional(),
      name: z.string(),
      total: z.number(),
    })
  )
  .handler(({ job }) => {
    const { name, total, globalTraceId } = job.data;
    return {
      data: { globalTraceId, name, total },
      message: 'Archives summary',
      success: true,
    };
  });
