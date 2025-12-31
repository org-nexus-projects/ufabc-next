import {  type StudentSyncModel, type StudentSyncDocument } from '../models/student-sync.js';

export async function createStudentSyncOperation(model: StudentSyncModel, ra: string, metadata?: any): Promise<StudentSyncDocument> {
  return model.create({
    ra,
    status: 'created',
    timeline: [
      {
        status: 'created',
        timestamp: new Date(),
        metadata,
      }
    ]
  })
}
