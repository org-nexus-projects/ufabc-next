import { ComponentModel } from '@/models/Component.js';
import type { TeacherDocument } from '@/models/Teacher.js';
import type { Types } from 'mongoose';

export async function findTeachers(subject: Types.ObjectId, season: string) {
  const teachers = await ComponentModel.find({ subject, season })
    .populate(['pratica', 'teoria'])
    .lean<{ teoria: TeacherDocument; pratica: TeacherDocument }[]>();

  return teachers;
}
