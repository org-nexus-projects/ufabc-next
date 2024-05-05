import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import mongoose from 'mongoose';
import { SubjectModel } from '@/models/Subject.js';
import { Config } from '@/config/config.js';
import { SubjectRepository } from '../subjects.repository.js';

describe('Subjects repository unit tests', () => {
  it('should create a subject', async () => {
    mongoose.connect(Config.MONGODB_CONNECTION_URL);

    const subjectRepository = new SubjectRepository(SubjectModel);

    const createdSubject = await subjectRepository.createSubject({
      name: 'Algebra Linear',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const subjectInDb = await subjectRepository.listSubject({
      name: 'Algebra Linear',
    });

    //This should work if I use testcontainers to isolate the database
    assert.strictEqual(createdSubject.name, subjectInDb[0].name);

    mongoose.disconnect();
  });
});
