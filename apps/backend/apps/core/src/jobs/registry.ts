import { JOB_NAMES } from '../constants.js';
import {
  componentsArchivesProcessingJob,
  pdfDownloadJob,
  archivesSummaryJob,
} from './components-archive-processing-flow.js';
import { createComponentJob } from './components-processing.js';
import {
  enrolledStudentsJob,
  processEnrollmentJob,
} from './enrolled-students.js';
import { enrollmentsProcessingJob } from './enrollments-processing.js';
import { studentSyncProcessingJob } from './student-sync-processing.js';
import { ufabcParserWebhookProcessingJob } from './ufabc-parser-webhook-processing.js';

export const jobRegistry = {
  [JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING]: componentsArchivesProcessingJob,
  [JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING_PDF]: pdfDownloadJob,
  [JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING_SUMMARY]: archivesSummaryJob,
  [JOB_NAMES.ENROLLED_STUDENTS]: enrolledStudentsJob,
  [JOB_NAMES.PROCESS_ENROLLED_STUDENTS]: processEnrollmentJob,
  [JOB_NAMES.COMPONENTS_PROCESSING]: createComponentJob,
  [JOB_NAMES.PROCESS_COMPONENTS_ENROLLMENTS]: enrollmentsProcessingJob,
  [JOB_NAMES.UFABC_PARSER_WEBHOOK_PROCESSING]: ufabcParserWebhookProcessingJob,
  [JOB_NAMES.STUDENT_SYNC_PROCESSING]: studentSyncProcessingJob,
} as const;

export type JobRegistry = typeof jobRegistry;
