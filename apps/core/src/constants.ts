export const TRACING_DIRECTION = {
  INCOMING: 'incoming',
  OUTGOING: 'outgoing',
} as const;

export const TRACING_MESSAGES = {
  INCOMING_REQUEST: 'INCOMING REQUEST',
  INCOMING_REQUEST_FAILED: 'INCOMING REQUEST FAILED',
  INCOMING_RESPONSE: 'INCOMING RESPONSE',
  INCOMING_RESPONSE_WITH_4XX_STATUS: 'INCOMING RESPONSE WITH 4XX STATUS',
  INCOMING_RESPONSE_WITH_5XX_STATUS: 'INCOMING RESPONSE WITH 5XX STATUS',
  OUTGOING_REQUEST: 'OUTGOING REQUEST',
  OUTGOING_REQUEST_FAILED: 'OUTGOING REQUEST FAILED',
  OUTGOING_RESPONSE: 'OUTGOING RESPONSE',
  OUTGOING_RESPONSE_WITH_4XX_STATUS: 'OUTGOING RESPONSE WITH 4XX STATUS',
  OUTGOING_RESPONSE_WITH_5XX_STATUS: 'OUTGOING RESPONSE WITH 5XX STATUS',
} as const;

export const JOB_NAMES = {
  COMPONENTS_ARCHIVES_PROCESSING: 'components_archives_processing',
  COMPONENTS_ARCHIVES_PROCESSING_PDF: 'components_archives_processing_pdf',
  COMPONENTS_ARCHIVES_PROCESSING_SUMMARY:
    'components_archives_processing_summary',
  ARCHIVE_EXTRACTION: 'archive_extraction',
  CMCC_PLAN: 'cmcc_plan',
  CMCC_PLANS_SCHEDULE: 'cmcc_plans_schedule',
  COMPONENTS_PROCESSING: 'components_processing',
  ENROLLED_STUDENTS: 'enrolled_students',
  PROCESS_COMPONENTS_ENROLLMENTS: 'process_components_enrollments',
  PROCESS_ENROLLED_STUDENTS: 'process_enrolled_students',
  PROCESS_SETTLED_ENROLLMENTS: 'process_settled_enrollments',
  STUDENT_SYNC_PROCESSING: 'student_sync_processing',
  TEACHER_COMMENT_CREATED: 'teacher_comment_created',
  TEACHER_CREATED: 'teacher_created',
  TEACHER_SUMMARY: 'teacher_summary',
  UFABC_PARSER_WEBHOOK_PROCESSING: 'ufabc_parser_webhook_processing',
  USER_ENROLLMENTS_UPDATE: 'user_enrollments_update',
} as const;

export const REQUESTERS = ['ufabc-next', 'ufabc-cronos'] as const;
export const REDIRECT_TARGETS = ['web', 'web-local'] as const;

export const HTTP_REDIS_KEY_PREFIX = 'http';
export const MAX_LOG_SIZE = 600 * 1024;

export const BYTES_PER_MB = 1024 * 1024;
export const NANOSECONDS_PER_MS = 1_000_000;
export const SNAPSHOT_URL_TTL_SECONDS = 7 * 24 * 60 * 60;
export const TEACHER_CACHE_MAX_SIZE = 500;

/**
 * A fuzzy name match may differ by at most this many characters (typos only).
 * Higher values merged different people, e.g. "rafaela valero da silva" into
 * "marcela ribeiro da silva".
 */
export const TEACHER_FUZZY_MATCH_MAX_DISTANCE = 2;

/** Connectors that vary between spellings of the same name and are ignored when comparing. */
export const TEACHER_NAME_PARTICLES = ['de', 'da', 'do', 'dos', 'das', 'e'];

/**
 * Values ufabc-parser sends in place of a real teacher name when none is
 * assigned yet. These must never be matched or created as a teacher.
 */
export const NO_TEACHER_SENTINELS = ['0', 'a definir docente'];

export const PARSER_WEBHOOK_EVENTS = {
  CLASS_SETTLED: 'class.settled',
  COMPONENT_CREATED: 'component.created',
  COMPONENT_UPDATED: 'component.updated',
  STUDENT_FAILED: 'student.failed',
  STUDENT_SYNCED: 'student.synced',
  TEACHER_CREATED: 'teacher.created',
} as const;

export const PARSER_WEBHOOK_SUPPORTED_EVENTS = [
  PARSER_WEBHOOK_EVENTS.STUDENT_SYNCED,
  PARSER_WEBHOOK_EVENTS.STUDENT_FAILED,
  PARSER_WEBHOOK_EVENTS.COMPONENT_CREATED,
  PARSER_WEBHOOK_EVENTS.COMPONENT_UPDATED,
  PARSER_WEBHOOK_EVENTS.TEACHER_CREATED,
  PARSER_WEBHOOK_EVENTS.CLASS_SETTLED,
] as const;

export const PERMISSIONS = {
  ADMIN: 'admin',
  ANNOUNCEMENTS: 'announcements',
  ANNOUNCEMENTS_BCC: 'announcements-bcc',
  ARCHIVES: 'archives',
} as const;

export const ARCHIVE_READERS = [PERMISSIONS.ADMIN, PERMISSIONS.ARCHIVES];

export const UFABC_EMAIL_DOMAINS = ['aluno.ufabc.edu.br', 'ufabc.edu.br'];

// accent-insensitive character classes used to build disciplina-name regexes
export const ACCENT_MAP: Record<string, string> = {
  a: '[aáàâãAÁÀÂÃ]',
  c: '[cçCÇ]',
  e: '[eéêEÉÊ]',
  i: '[iíIÍ]',
  o: '[oóôõOÓÔÕ]',
  u: '[uúüUÚÜ]',
};

export const REGEX_SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/u;

// e.g. "MCTA001-24"
export const DISCIPLINE_CODE_PATTERN = /[A-Z]{2,}\d{3,}(?:-\d+)?/u;

export const BOARD_COOKIE_MAX_AGE_SECONDS = 3600;

export const ARCHIVE_MAX_FAILURE_EVENTS = 5;

export const SUMMARY_COMMENT_THRESHOLD = 5;
export const SUMMARY_MAX_COMMENTS = 50;
export const SUMMARY_MAX_COMMENT_CHARS = 500;
export const ARCHIVE_PRESIGNED_URL_TTL_SECONDS = 15 * 60;
