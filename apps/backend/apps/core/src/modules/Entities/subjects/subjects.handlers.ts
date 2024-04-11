import { camelCase, startCase } from 'lodash-es';
import type { FastifyRequest } from 'fastify';
import type { SubjectService } from './subjects.service.js';

export class SubjectHandler {
  constructor(private readonly subjectService: SubjectService) {}

  async searchSubject(request: FastifyRequest<{ Querystring: { q: string } }>) {
    const { q: rawSearch } = request.query;
    const normalizedSearch = startCase(camelCase(rawSearch));
    const validatedSearch = normalizedSearch.replaceAll(
      /[\s#$()*+,.?[\\\]^{|}-]/g,
      '\\$&',
    );

    const search = new RegExp(validatedSearch, 'gi');
    const searchResults = await this.subjectService.findSubject(search);
    return searchResults;
  }

  async createSubject(request: FastifyRequest<{ Body: { name: string } }>) {
    const subjectName = request.body.name;

    const insertedSubject =
      await this.subjectService.createSubject(subjectName);

    return insertedSubject;
  }

  async listAllSubjects() {
    const subjects = await this.subjectService.listSubjects();
    return subjects;
  }
}
