import { defineJob } from '@next/queues/client';
import z from 'zod';

import { JOB_NAMES } from '@/constants.js';
import { ComponentArchiveModel } from '@/models/ComponentArchive.js';
import { ArchiveEngine } from '@/services/archive-engine.js';

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
      throw new Error(
        `No matching component found for Moodle course: "${component.fullname}" (id: ${component.id}). ` +
          `Could not find a matching component in the system.`
      );
    }

    const componentDbId = matchedComponent._id.toString();

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
          componentDbId,
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
      componentDbId,
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
      componentDbId: z.string(),
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
    const { rawUrl, componentDbId, globalTraceId, session } = job.data;

    const engine = new ArchiveEngine({
      globalTraceId,
      s3Connector: app.aws.s3,
      session,
    });

    const archive = await ComponentArchiveModel.findOneAndUpdate(
      { component: componentDbId, original_url: rawUrl },
      {
        $set: { status: 'created' },
        $setOnInsert: {
          component: componentDbId,
          original_url: rawUrl,
          timeline: [{ metadata: { globalTraceId }, status: 'created' }],
        },
      },
      { new: true, upsert: true }
    );

    try {
      const result = await engine.downloadAndUpload(
        rawUrl,
        componentDbId,
        app.config.AWS_BUCKET
      );

      if (!result) {
        await ComponentArchiveModel.findByIdAndUpdate(archive._id, {
          $push: {
            timeline: {
              metadata: { reason: 'missing_session' },
              status: 'failed',
            },
          },
          $set: { status: 'failed' },
        });

        return {
          archiveId: archive._id,
          message: 'No Moodle session available, skipped download',
          success: false,
        };
      }

      const { checksum, pdfName, s3Key } = result;

      if (archive.checksum === checksum) {
        return {
          archiveId: archive._id,
          data: {
            fileName: archive.file_name,
            s3Key: archive.s3_key,
          },
          message: 'PDF unchanged since last run, skipping stored event',
          success: true,
        };
      }

      await ComponentArchiveModel.findByIdAndUpdate(archive._id, {
        $push: {
          timeline: { status: 'stored' },
        },
        $set: {
          checksum,
          file_name: pdfName,
          s3_key: s3Key,
          status: 'stored',
        },
      });

      return {
        archiveId: archive._id,
        data: {
          fileName: pdfName,
          s3Key,
        },
        message: 'PDF uploaded',
        success: true,
      };
    } catch (error) {
      await ComponentArchiveModel.findByIdAndUpdate(archive._id, {
        $push: {
          timeline: { metadata: { error: String(error) }, status: 'failed' },
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
