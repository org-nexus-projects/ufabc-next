import { StudentSync } from './models/student-sync.js';
import { HistoryProcessingJobModel as HistoryProcessingJob } from './models/history-processing-job.js';

export const db = {
  StudentSync,
  HistoryProcessingJob,
};

export type DatabaseModels = typeof db;
