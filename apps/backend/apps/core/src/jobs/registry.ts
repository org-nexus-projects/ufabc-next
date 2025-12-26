import {
  componentsArchivesProcessingJob,
  pdfDownloadJob,
  archivesSummaryJob,
} from './components-archive-processing-flow.js';
import { JOB_NAMES } from '../constants.js';
import {
  enrolledStudentsJob,
  processEnrollmentJob,
} from './enrolled-students.js';

export const jobRegistry = {
  [JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING]: componentsArchivesProcessingJob,
  [JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING_PDF]: pdfDownloadJob,
  [JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING_SUMMARY]: archivesSummaryJob,
  [JOB_NAMES.ENROLLED_STUDENTS]: enrolledStudentsJob,
  [JOB_NAMES.PROCESS_ENROLLED_STUDENTS]: processEnrollmentJob,
} as const;

export type JobRegistry = typeof jobRegistry;
