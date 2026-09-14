import { type InferSchemaType, Schema, model, Types } from 'mongoose';

import { NO_TEACHER_SENTINELS, TEACHER_CACHE_MAX_SIZE } from '@/constants.js';

export function normalizeName(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export function findBestLevenshteinMatch(
  name: string,
  candidates: TeacherDocument[],
  threshold = 7
): TeacherDocument | null {
  const normalizedName = normalizeName(name);
  let bestMatch: TeacherDocument | null = null;
  let bestDistance = Infinity;

  for (const teacher of candidates) {
    const knownNames = [teacher.name, ...teacher.alias];
    for (const knownName of knownNames) {
      const distance = levenshteinDistance(
        normalizedName,
        normalizeName(knownName)
      );
      if (distance <= threshold && distance < bestDistance) {
        bestDistance = distance;
        bestMatch = teacher;
      }
    }
  }

  return bestMatch;
}

const teacherSchema = new Schema(
  {
    name: { type: String, required: true },
    alias: { type: [String], default: [] },
    siape: { type: String, required: false },
    externalKey: { type: String, required: false },
  },
  {
    timestamps: true,
  }
);

teacherSchema.pre('save', function () {
  if (this.isNew || this.isModified('name')) {
    this.name = this.name.toLowerCase();
  }
});

teacherSchema.index(
  {
    name: 'text',
    alias: 'text',
  },
  {
    weights: {
      name: 10,
      alias: 5,
    },
    name: 'TeacherTextSearch',
  }
);

teacherSchema.index(
  { siape: 1 },
  { unique: true, name: 'TeacherSiapeIndex', sparse: true }
);
teacherSchema.index(
  { externalKey: 1 },
  { unique: true, name: 'TeacherExternalKeyIndex', sparse: true }
);

/**
 * Sets a cache entry, evicting the oldest entry first if `cache` is already
 * at `maxSize` — without this, `teacherCache` below grows unbounded for the
 * life of the process (it caches every distinct teacher name variant ever seen).
 */
export function setTeacherCacheEntry<Value>(
  cache: Map<string, Value>,
  key: string,
  value: Value,
  maxSize = TEACHER_CACHE_MAX_SIZE
) {
  if (cache.size >= maxSize && !cache.has(key)) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) {
      cache.delete(oldestKey);
    }
  }
  cache.set(key, value);
}

const teacherCache = new Map<string, Types.ObjectId | null>();

export async function findTeacher(
  name: string | null
): Promise<Types.ObjectId | null> {
  if (!name) return null;

  const normalizedName = normalizeName(name);

  if (NO_TEACHER_SENTINELS.includes(normalizedName)) {
    return null;
  }

  if (teacherCache.has(normalizedName)) {
    return teacherCache.get(normalizedName)!;
  }

  const teacher = await TeacherModel.findOne({
    $or: [{ name: normalizedName }, { alias: normalizedName }],
  });

  if (teacher) {
    if (!teacher.alias.includes(normalizedName)) {
      await TeacherModel.findByIdAndUpdate(teacher._id, {
        $addToSet: { alias: { $each: [normalizedName, name.toLowerCase()] } },
      });
    }
    setTeacherCacheEntry(teacherCache, normalizedName, teacher._id);
    return teacher._id;
  }

  const allTeachers = await TeacherModel.find({});
  const levMatch = findBestLevenshteinMatch(name, allTeachers);
  if (levMatch) {
    await TeacherModel.findByIdAndUpdate(levMatch._id, {
      $addToSet: { alias: { $each: [normalizedName, name.toLowerCase()] } },
    });
    setTeacherCacheEntry(teacherCache, normalizedName, levMatch._id);
    return levMatch._id;
  }

  const newTeacher = await TeacherModel.create({
    name,
    alias: [normalizedName, name.toLowerCase()],
  });
  setTeacherCacheEntry(teacherCache, normalizedName, newTeacher._id);
  return newTeacher._id;
}

export function clearTeacherCache() {
  teacherCache.clear();
}

export type Teacher = InferSchemaType<typeof teacherSchema>;
export type TeacherDocument = ReturnType<(typeof TeacherModel)['hydrate']>;
export const TeacherModel = model('teachers', teacherSchema);
