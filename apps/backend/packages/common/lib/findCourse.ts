import latinize from 'latinize';
import { mode } from 'mathjs';
import diff from 'difflib';
import { get as LodashGet } from 'lodash-es';
import { currentQuad } from './findQuad';
import type { Model } from 'mongoose';

type StudentModel = Model<unknown>;

type CoursesAggregate = {
  /** The course name */
  _id: string;
  ids: {
    id_curso: number;
  }[];
};
export async function courseId(
  rawCourse: string,
  season: ReturnType<typeof currentQuad>,
  studentModel: StudentModel,
) {
  const courses = await findIds(season, studentModel);
  const course = clearString(rawCourse);
  const coursenames = courses.map((course) => clearString(course.name));

  const courseMap = new Map(courses.map((c) => [clearString(c.name), c]));
  const closestMatch = diff.getCloseMatches(course, coursenames)[0] || null;

  if (!closestMatch) {
    return null;
  }

  return LodashGet(courseMap.get(closestMatch), 'curso_id', null);
}

export async function findIds(
  season = currentQuad(),
  StudentModel: StudentModel,
) {
  const courses = await StudentModel.aggregate<CoursesAggregate>([
    {
      $unwind: '$cursos',
    },
    {
      $match: {
        'cursos.id_curso': { $ne: null },
        season,
      },
    },
    {
      $project: {
        'cursos.id_curso': 1,
        'cursos.nome_curso': { $trim: { input: '$cursos.nome_curso' } },
      },
    },
    {
      $group: { _id: '$cursos.nome_curso', ids: { $push: '$cursos.id_curso' } },
    },
  ]);

  return courses.map((course) => {
    const courseId = course.ids.filter((id) => id !== null && id !== undefined);

    return {
      name: course._id,
      // @ts-expect-error fow now
      curso_id: courseId.length > 0 ? mode(courseId)[0] : undefined,
    };
  });
}

const clearString = (str: string) =>
  latinize(str || '')
    .toLowerCase()
    .replaceAll(/\s+/g, ' ');
