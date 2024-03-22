import type { SubjectRepository } from './subjects.repository.js';

export class SubjectService {
  constructor(private readonly subjectRepository: SubjectRepository) {}

  async findSubject(search: RegExp) {
    const [searchResults] = await this.subjectRepository.searchSubject([
      {
        $match: { name: search },
      },
      {
        $facet: {
          total: [{ $count: 'total' }],
          data: [{ $limit: 10 }],
        },
      },
      {
        $addFields: {
          total: { $ifNull: [{ $arrayElemAt: ['$total.total', 0] }, 0] },
        },
      },
      {
        $project: {
          total: 1,
          data: 1,
        },
      },
    ]);
    return searchResults;
  }
}
