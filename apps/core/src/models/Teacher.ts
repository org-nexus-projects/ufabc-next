import { type InferSchemaType, Schema, model, Types } from 'mongoose';

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
    const teacherNorm = normalizeName(teacher.name);
    const distance = levenshteinDistance(normalizedName, teacherNorm);
    if (distance <= threshold && distance < bestDistance) {
      bestDistance = distance;
      bestMatch = teacher;
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

const teacherCache = new Map<string, Types.ObjectId | null>();

export async function findTeacher(
  name: string | null
): Promise<Types.ObjectId | null> {
  if (!name) return null;

  const normalizedName = normalizeName(name);

  if (teacherCache.has(normalizedName)) {
    return teacherCache.get(normalizedName)!;
  }

  const teacher = await TeacherModel.findOne({ name: normalizedName });

  if (!teacher) {
    const allTeachers = await TeacherModel.find({});
    const levMatch = findBestLevenshteinMatch(name, allTeachers);
    if (levMatch) {
      await TeacherModel.findByIdAndUpdate(levMatch._id, {
        $addToSet: { alias: { $each: [normalizedName, name.toLowerCase()] } },
      });
      teacherCache.set(normalizedName, levMatch._id);
      return levMatch._id;
    }
  }

  if (!teacher && normalizedName !== '0') {
    teacherCache.set(normalizedName, null);
    return null;
  }

  if (teacher && !teacher.alias.includes(normalizedName)) {
    await TeacherModel.findByIdAndUpdate(teacher._id, {
      $addToSet: { alias: { $each: [normalizedName, name.toLowerCase()] } },
    });
  }

  const teacherId = teacher?._id ?? null;
  teacherCache.set(normalizedName, teacherId);
  return teacherId;
}

export function clearTeacherCache() {
  teacherCache.clear();
}

export type Teacher = InferSchemaType<typeof teacherSchema>;
export type TeacherDocument = ReturnType<(typeof TeacherModel)['hydrate']>;
export const TeacherModel = model('teachers', teacherSchema);
