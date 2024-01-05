import {
  asyncParallelMap,
  generateIdentifier,
  logger,
  resolveProfessor,
} from '@next/common';
import { createQueue } from '../utils/queue.js';
import type { EnrollmentModel, TeacherModel } from '@/models/index.js';
import type { Job } from 'bullmq';

//TODO: Check if this is the correct type (pratica and teoria are not in the spreadsheet)
//this is the type of the spreedsheet file that is being parsed
// but the spreeadsheet file does not have the teoria and pratica fields
type parsedData = {
  year: number;
  quad: number;
  disciplina: string;
  ra: string | number;
  teoria: string;
  pratica: string;
};

type UpdateTeachers = {
  payload: { json: parsedData[] };
  teacherModel: typeof TeacherModel;
  enrollmentModel: typeof EnrollmentModel;
};

export async function updateTeachers({
  payload,
  teacherModel,
  enrollmentModel,
}: UpdateTeachers) {
  const data = payload.json;

  const teachers = await teacherModel.find({});

  const updateTeacherInEnrollments = async (enrollment: parsedData) => {
    const keys = ['ra', 'year', 'quad', 'disciplina'] as const;

    const key = {
      ra: enrollment.ra,
      year: enrollment.year,
      quad: enrollment.quad,
      disciplina: enrollment.disciplina,
    };

    // TODO: remove any later
    const identifier = generateIdentifier(key, keys as any);

    try {
      const insertOpts = { new: true, upsert: true };
      await enrollmentModel.findOneAndUpdate(
        { identifier },
        {
          //TODO: Find out if the teoria and pratica fields objectId are being populated
          teoria: resolveProfessor(enrollment.teoria, teachers),
          pratica: resolveProfessor(enrollment.pratica, teachers),
        },
        insertOpts,
      );
    } catch (error) {
      logger.error(error);
      throw error;
    }
  };

  return asyncParallelMap(data, updateTeacherInEnrollments, 10);
}

export const updateTeachersQueue = createQueue('Teacher:UpdateEnrollments');

export const addTeachersToQueue = async (payload: { json: unknown }) => {
  await updateTeachersQueue.add('Teacher:UpdateEnrollments', payload);
};

export const updateTeachersWorker = async (job: Job<UpdateTeachers>) => {
  await updateTeachers(job.data);
};
