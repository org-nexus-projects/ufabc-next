import { StudentSync } from './models/student-sync.js';
import {
  HistoryProcessingJobModel as HistoryProcessingJob,
  HistoryProcessingJobDocument,
} from './models/history-processing-job.js';

export const db = {
  StudentSync,
  HistoryProcessingJob,
};

export type DatabaseModels = typeof db;
export type { HistoryProcessingJobDocument };
