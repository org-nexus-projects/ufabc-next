import type { PipelineStage } from 'mongoose';
import type { Subject, SubjectModel } from '@/models/Subject.js';

type SearchAggregate = {
  total: number;
  data: Subject[];
};

interface EntitiesSubjectRepository {
  searchSubject(pipeline: PipelineStage[]): Promise<SearchAggregate[]>;
}

export class SubjectRepository implements EntitiesSubjectRepository {
  constructor(private readonly subjectService: typeof SubjectModel) {}

  async searchSubject(pipeline: PipelineStage[]) {
    const searchResults =
      await this.subjectService.aggregate<SearchAggregate>(pipeline);
    return searchResults;
  }
}
