import { GraduationSubjectModel } from "@/models/GraduationSubject.js";
import type { Graduation } from "@/models/Graduation.js";
import type { GraduationRepository } from "./graduation.repository.js";
import type { FilterQuery } from "mongoose";

export class GraduationService {
  constructor(private readonly graduationRepository: GraduationRepository) {}

  async findGraduations(filters: FilterQuery<Graduation>, limit?: number) {
    const graduations = await this.graduationRepository.findGraduation(
      filters,
      limit,
    );
    return graduations;
  }

  async findGraduationsSubject() {
    const graduationsSubject =
      await this.graduationRepository.findGraduationSubject({});
    return graduationsSubject;
  }

  async listGraduationSubjects(limit: number, graduationId: number) {
    // fetch graduation based on a student graduation
    const subjects = await GraduationSubjectModel.find({
      graduation: graduationId,
    })
      .limit(limit)
      .populate("subject", "name creditos -_id")
      .lean({ virtuals: true });

    return subjects;
  }
}
