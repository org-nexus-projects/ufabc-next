import {
  asyncParallelMap,
  generateIdentifier,
  logger,
  resolveProfessor,
} from '@next/common';
import { EnrollmentModel, TeacherModel } from '@/models/index.js';
//TODO: Check if this is the correct type (pratica and teoria are not in the spreadsheet)
//this is the type of the spreedsheet file that is being parsed
// but the spreeadsheet file does not have the teoria and pratica fields
type parsedData = {
  year: number;
  quad: number;
  disciplina: string;
  ra: number;
  teoria: string;
  pratica: string;
};

type UpdateTeachers = parsedData[];

export async function updateTeachers(data: UpdateTeachers) {
  const teachers = await TeacherModel.find({});

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
      await EnrollmentModel.findOneAndUpdate(
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
