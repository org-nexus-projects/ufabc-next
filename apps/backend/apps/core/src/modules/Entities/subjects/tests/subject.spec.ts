import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import mongoose from 'mongoose';
import { GenericContainer, Wait } from 'testcontainers';
import { SubjectModel } from '@/models/Subject.js';
import { SubjectRepository } from '../subjects.repository.js';

describe('Subjects repository unit tests', () => {
  let connection: typeof mongoose;

  before(async () => {
    const mongoContainer = await new GenericContainer('mongo:4.0.1')
      .withExposedPorts(27017)
      .withWaitStrategy(Wait.forLogMessage(/.*waiting for connections.*/i))
      .start();

    connection = await mongoose.connect(
      `mongodb://127.0.0.1:${mongoContainer.getMappedPort(27017)}/`,
    );
  });

  after(async () => {
    //No need to stop the container, it will be stopped automatically
    await connection.disconnect();
  });

  it('Should create a subject', async () => {
    const subjectRepository = new SubjectRepository(SubjectModel);

    const createdSubject = await subjectRepository.createSubject({
      name: 'Algebra Linear',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const subjectInDb = await subjectRepository.listSubject({
      name: 'Algebra Linear',
    });

    assert.strictEqual(createdSubject.name, subjectInDb[0].name);
  });
});
