import { JOB_NAMES } from '../constants.js';
import { archiveExtractionJob } from './archive-extraction.js';
import {
  componentsArchivesProcessingJob,
  pdfDownloadJob,
  archivesSummaryJob,
} from './components-archive-processing-flow.js';
import { cmccPlanJob, cmccPlansScheduleJob } from './cmcc-plans.js';
import { createComponentJob } from './components-processing.js';
import {
  enrolledStudentsJob,
  processEnrollmentJob,
} from './enrolled-students.js';
import { enrollmentsProcessingJob } from './enrollments-processing.js';
import { settledEnrollmentsProcessingJob } from './settled-enrollments-processing.js';
import { studentSyncProcessingJob } from './student-sync-processing.js';
import { teacherCreatedJob } from './teacher-created.js';
import {
  teacherCommentCreatedJob,
  teacherSummaryJob,
} from './teacher-summaries.js';
import { ufabcParserWebhookProcessingJob } from './ufabc-parser-webhook-processing.js';

export const jobRegistry = {
  [JOB_NAMES.ARCHIVE_EXTRACTION]: archiveExtractionJob,
  [JOB_NAMES.CMCC_PLAN]: cmccPlanJob,
  [JOB_NAMES.CMCC_PLANS_SCHEDULE]: cmccPlansScheduleJob,
  [JOB_NAMES.TEACHER_SUMMARY]: teacherSummaryJob,
  [JOB_NAMES.TEACHER_COMMENT_CREATED]: teacherCommentCreatedJob,
  [JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING]: componentsArchivesProcessingJob,
  [JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING_PDF]: pdfDownloadJob,
  [JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING_SUMMARY]: archivesSummaryJob,
  [JOB_NAMES.ENROLLED_STUDENTS]: enrolledStudentsJob,
  [JOB_NAMES.PROCESS_ENROLLED_STUDENTS]: processEnrollmentJob,
  [JOB_NAMES.COMPONENTS_PROCESSING]: createComponentJob,
  [JOB_NAMES.PROCESS_COMPONENTS_ENROLLMENTS]: enrollmentsProcessingJob,
  [JOB_NAMES.UFABC_PARSER_WEBHOOK_PROCESSING]: ufabcParserWebhookProcessingJob,
  [JOB_NAMES.STUDENT_SYNC_PROCESSING]: studentSyncProcessingJob,
  [JOB_NAMES.TEACHER_CREATED]: teacherCreatedJob,
  [JOB_NAMES.PROCESS_SETTLED_ENROLLMENTS]: settledEnrollmentsProcessingJob,
} as const;

export type JobRegistry = typeof jobRegistry;
