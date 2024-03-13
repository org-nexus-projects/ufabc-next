import type {
  GraduationSubject,
  GraduationSubjectModel,
} from '@/models/GraduationSubject.js';
import type {
  Graduation,
  GraduationDocument,
  GraduationModel,
} from '@/models/Graduation.js';
import type { FilterQuery } from 'mongoose';

interface UserGraduationRepository {
  findGraduation(
    options?: FilterQuery<Graduation>,
    limit?: number,
  ): Promise<GraduationDocument[]>;
  // GraduationSubject CRUD
  findGraduationSubject(
    options: FilterQuery<GraduationSubject>,
  ): Promise<GraduationSubject>;
  updateGraduationSubject(
    options: FilterQuery<GraduationSubject>,
  ): Promise<GraduationSubject>;
  createGraduationSubject(
    options: FilterQuery<GraduationSubject>,
  ): Promise<GraduationSubject>;
}

export class GraduationRepository implements UserGraduationRepository {
  constructor(
    private readonly graduationService: typeof GraduationModel,
    private readonly graduationSubjectService: typeof GraduationSubjectModel,
  ) {}

  async findGraduation(options: FilterQuery<Graduation>, limit: number = 200) {
    const graduations = await this.graduationService
      // eslint-disable-next-line unicorn/no-array-callback-reference
      .find(options)
      .lean<GraduationDocument[]>({ virtuals: true })
      .limit(limit);
    return graduations;
  }

  async findGraduationSubject(
    options: FilterQuery<GraduationSubject>,
    limit: number = 100,
  ) {
    // TODO: add pagination
    const graduationsSubject = await this.graduationSubjectService
      // eslint-disable-next-line unicorn/no-array-callback-reference
      .find(options)
      .limit(limit)
      .populate('subject');

    return graduationsSubject;
  }
}
