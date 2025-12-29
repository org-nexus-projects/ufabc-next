import {
  componentsArchivesProcessingJob,
  pdfDownloadJob,
  archivesSummaryJob,
} from './components-archive-processing-flow.js';
import { JOB_NAMES } from '../constants.js';
import { enrolledStudentsJob, processEnrollmentJob } from './enrolled-students.js';
import { createComponentJob } from './components.js';

export const jobRegistry = {
  [JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING]: componentsArchivesProcessingJob,
  [JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING_PDF]: pdfDownloadJob,
  [JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING_SUMMARY]: archivesSummaryJob,
  [JOB_NAMES.ENROLLED_STUDENTS]: enrolledStudentsJob,
  [JOB_NAMES.PROCESS_ENROLLED_STUDENTS]: processEnrollmentJob,
  [JOB_NAMES.CREATE_COMPONENT]: createComponentJob,
} as const;

export type JobRegistry = typeof jobRegistry;
