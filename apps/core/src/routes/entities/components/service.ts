import type { Types } from 'mongoose';

import type { TeacherDocument } from '@/models/Teacher.js';

import { ComponentModel } from '@/models/Component.js';

export async function findTeachers(subject: Types.ObjectId, season: string) {
  const teachers = await ComponentModel.find({ subject, season })
    .populate(['pratica', 'teoria'])
    .lean<{ teoria: TeacherDocument; pratica: TeacherDocument }[]>();

  return teachers;
}
