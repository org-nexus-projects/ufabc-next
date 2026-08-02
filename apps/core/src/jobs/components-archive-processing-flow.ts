import { defineJob } from '@next/queues/client';
import z from 'zod';

import { JOB_NAMES } from '@/constants.js';
import { ComponentArchiveModel } from '@/models/ComponentArchive.js';
import { ArchiveEngine } from '@/services/archive-engine.js';

const componentSchema = z.object({
  viewurl: z.string().url(),
  fullname: z.string(),
  shortname: z.string().optional(),
  idnumber: z.string().optional(),
  id: z.number(),
  startdate: z.number().optional(),
});

export const componentsArchivesProcessingJob = defineJob(
  JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING
)
  .input(
    z.object({
      component: componentSchema.array(),
      globalTraceId: z.string().optional(),
      session: z.object({
        sessionId: z.string(),
        sessKey: z.string(),
      }),
      enrolledCodigos: z.array(z.string()).optional(),
    })
  )
  .iterator('component')
  .concurrency(3)
  .handler(async ({ job, manager }) => {
    const { component, session, enrolledCodigos } = job.data;
    const globalTraceId = job.data.globalTraceId;

    const engine = new ArchiveEngine({ globalTraceId, session });

    const teacherNames = await engine.extractTeacherNames(component.id);

    const matchedComponent = await engine.findComponentByMoodleCourse(
      component,
      teacherNames,
      enrolledCodigos
    );

    if (!matchedComponent) {
      throw new Error(
        `No matching component found for Moodle course: "${component.fullname}" (id: ${component.id}). ` +
          `Could not find a matching component in the system.`
      );
    }

    const componentDbId = matchedComponent._id.toString();

    const files = await engine.extractFiles(component.viewurl, component.id);

    if (files.length === 0) {
      return {
        success: true,
        message: 'No PDFs found in component',
        data: [],
      };
    }

    await manager.dispatchFlow({
      name: `summary-${component.fullname}`,
      queueName: JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING_SUMMARY,
      data: { name: component.fullname, total: files.length, globalTraceId },
      children: files.map((file) => ({
        name: JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING_PDF,
        queueName: JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING_PDF,
        data: {
          component: component.fullname,
          rawUrl: file.url,
          componentDbId,
          globalTraceId,
          session,
        },
      })),
    });

    return {
      success: true,
      flowStarted: true,
      componentDbId,
      moodleCourseId: component.id,
    };
  });

export const pdfDownloadJob = defineJob(
  JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING_PDF
)
  .input(
    z.object({
      component: z.string(),
      rawUrl: z.string().url(),
      componentDbId: z.string(),
      globalTraceId: z.string().optional(),
      session: z
        .object({
          sessionId: z.string(),
          sessKey: z.string(),
        })
        .optional(),
    })
  )
  .concurrency(10)
  .handler(async ({ job, app }) => {
    const { rawUrl, componentDbId, globalTraceId, session } = job.data;

    const engine = new ArchiveEngine({
      globalTraceId,
      session,
      s3Connector: app.aws.s3,
    });

    const archive = await ComponentArchiveModel.findOneAndUpdate(
      { component: componentDbId, original_url: rawUrl },
      {
        $setOnInsert: {
          component: componentDbId,
          original_url: rawUrl,
          timeline: [{ status: 'created', metadata: { globalTraceId } }],
        },
        $set: { status: 'created' },
      },
      { upsert: true, new: true }
    );

    try {
      const { pdfName, s3Key } = await engine.downloadAndUpload(
        rawUrl,
        componentDbId,
        app.config.AWS_BUCKET
      );

      await ComponentArchiveModel.findByIdAndUpdate(archive._id, {
        $set: {
          s3_key: s3Key,
          file_name: pdfName,
          status: 'stored',
        },
        $push: {
          timeline: { status: 'stored' },
        },
      });

      return {
        success: true,
        message: 'PDF uploaded',
        data: {
          fileName: pdfName,
          s3Key,
        },
        archiveId: archive._id,
      };
    } catch (error) {
      await ComponentArchiveModel.findByIdAndUpdate(archive._id, {
        $push: {
          timeline: { status: 'failed', metadata: { error: String(error) } },
        },
        $set: { status: 'failed' },
      });
      throw error;
    }
  });

export const archivesSummaryJob = defineJob(
  JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING_SUMMARY
)
  .input(
    z.object({
      name: z.string(),
      total: z.number(),
      globalTraceId: z.string().optional(),
    })
  )
  .handler(async ({ job }) => {
    const { name, total, globalTraceId } = job.data;
    return {
      success: true,
      message: 'Archives summary',
      data: { name, total, globalTraceId },
    };
  });
