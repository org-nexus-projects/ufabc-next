import { JOB_NAMES, PARSER_WEBHOOK_SUPPORTED_EVENTS } from '@/constants.js';
import { TeacherModel, normalizeName, findBestLevenshteinMatch, type TeacherDocument } from '@/models/Teacher.js';
import { TeacherCreatedEventSchema } from '@/schemas/v2/webhook/ufabc-parser.js';
import { defineJob } from '@next/queues/client';
import z from 'zod';

async function updateTeacherAndLink(
  teacher: TeacherDocument,
  data: { name: string; siape?: string; teacherKey?: string }
) {
  if (teacher.siape && data.siape && teacher.siape !== data.siape) {
    throw new Error(
      `SIAPE conflict for teacher ${teacher._id}: existing=${teacher.siape}, incoming=${data.siape}`
    );
  }

  const updates: Record<string, string> = {
    name: data.name,
  };
  if (data.teacherKey) updates.externalKey = data.teacherKey;
  if (data.siape) updates.siape = data.siape;

  await teacher.updateOne({
    $set: updates,
    $addToSet: { alias: { $each: [normalizeName(data.name), data.name.toLowerCase()] } },
  });
  return teacher;
}

export const teacherCreatedJob = defineJob(JOB_NAMES.TEACHER_CREATED)
  .input(
    z.object({
      deliveryId: z.string().uuid().describe('Unique webhook delivery ID'),
      event: z.enum(PARSER_WEBHOOK_SUPPORTED_EVENTS),
      timestamp: z.string().describe('Event timestamp'),
      data: TeacherCreatedEventSchema.shape.data,
    })
  )
  .handler(async ({ job, app }) => {
    const { data } = job.data;
    const { teacherKey, name, siape } = data;

    let teacher = await TeacherModel.findOne({ externalKey: teacherKey });
    if (teacher) {
      app.log.info({ teacherKey }, 'Updating teacher by externalKey');
      await teacher.updateOne({
        $set: { name, siape },
        $addToSet: { alias: { $each: [normalizeName(name), name.toLowerCase()] } },
      });
      return { teacher };
    }

    teacher = await TeacherModel.findOne({ siape });
    if (teacher) {
      app.log.info({ siape }, 'Updating teacher by siape');
      await updateTeacherAndLink(teacher, { name, siape, teacherKey });
      return { teacher };
    }

    teacher = await TeacherModel.findOne({ name: normalizeName(name) });
    if (teacher) {
      app.log.info({ name }, 'Updating teacher by normalized name');
      await updateTeacherAndLink(teacher, { name, siape, teacherKey });
      return { teacher };
    }

    const allTeachers = await TeacherModel.find({});
    const levMatch = findBestLevenshteinMatch(name, allTeachers);
    if (levMatch) {
      app.log.info({ name, matchId: levMatch._id }, 'Updating teacher by Levenshtein match');
      await updateTeacherAndLink(levMatch, { name, siape, teacherKey });
      return { teacher: levMatch };
    }

    app.log.info({ teacherKey, name }, 'Creating new teacher');
    const newTeacher = await TeacherModel.create({
      externalKey: teacherKey,
      siape,
      name,
    });
    return { teacher: newTeacher };
  });
