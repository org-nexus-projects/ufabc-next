import { JobManager } from '@next/queues/manager';
import { startTestStack } from '@next/testing';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

import { buildApp } from '@/app';

describe('History Webhook Integration', () => {
  let app: any;
  let jobManager: JobManager;
  let testApiKey: string;

  beforeAll(async () => {
    const testStack = await startTestStack();
    testApiKey = 'test-webhook-api-key';

    app = await buildApp({
      logger: false,
      mongodb: testStack.mongodb.uri,
      redis: testStack.redis.host,
      aws: testStack.aws,
      config: {
        WEBHOOK_API_KEY: testApiKey,
      },
    });

    jobManager = new JobManager({
      connection: testStack.redis,
      concurrency: { max: 5 },
    });

    await jobManager.start();
  });

  afterAll(async () => {
    await jobManager.close();
    await app.close();
  });

  beforeEach(async () => {
    await app.db.models.HistoryProcessingJob.deleteMany({});
    await app.db.models.Student.deleteMany({});
    await app.db.models.History.deleteMany({});
    await app.db.models.Enrollment.deleteMany({});
  });

  describe('POST /webhook/history', () => {
    const validHistoryPayload = {
      type: 'history.success' as const,
      payload: {
        ra: '123456',
        timestamp: '2024-01-15T10:30:00Z',
        student: {
          ra: '123456',
          name: 'Test Student',
          course: 'Computer Science',
          campus: 'São Bernardo do Campo',
          shift: 'Diurno',
          startedAt: '2020.1',
        },
        components: [
          {
            UFCode: 'BCM0001',
            name: 'Calculus I',
            grade: 'A',
            status: 'Aprovado',
            year: '2023',
            period: '2',
            credits: 4,
            category: 'mandatory',
            class: 'Turma A',
            teachers: ['Prof. João Silva'],
          },
        ],
        graduations: {
          course: 'Computer Science',
          campus: 'São Bernardo do Campo',
          shift: 'Diurno',
          grade: 'Bacharelado',
          freeCredits: 20,
          mandatoryCredits: 160,
          limitedCredits: 24,
          extensionCredits: 8,
          completedFreeCredits: 8,
          completedMandatoryCredits: 40,
          completedLimitedCredits: 4,
          completedExtensionCredits: 2,
          completedTotalCredits: 54,
          totalCredits: 184,
        },
        coefficients: {
          cr: 8.5,
          ca: 8.2,
          cp: 8.7,
          ik: 0.85,
          crece: 8.3,
          caece: 8.1,
          cpece: 8.6,
          ikece: 0.82,
          caik: 0.88,
        },
      },
    };

    it('should reject webhook with invalid API key', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/webhook/history',
        headers: {
          'x-api-key': 'invalid-key',
          'content-type': 'application/json',
        },
        payload: validHistoryPayload,
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({ error: 'Invalid API key' });
    });

    it('should accept valid webhook and queue job', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/webhook/history',
        headers: {
          'x-api-key': testApiKey,
          'content-type': 'application/json',
        },
        payload: validHistoryPayload,
      });

      expect(response.statusCode).toBe(200);
      const responseBody = response.json();
      expect(responseBody.status).toBe('accepted');
      expect(responseBody.jobId).toBeDefined();
      expect(responseBody.message).toBe(
        'Webhook received and queued for processing'
      );

      const processingJob = await app.db.models.HistoryProcessingJob.findById(
        responseBody.jobId
      );
      expect(processingJob).toBeTruthy();
      expect(processingJob.ra).toBe('123456');
      expect(processingJob.status).toBe('queued');
      expect(processingJob.idempotencyKey).toBe('123456-2024-01-15T10:30:00Z');
    });

    it('should reject duplicate webhook requests', async () => {
      const firstResponse = await app.inject({
        method: 'POST',
        url: '/webhook/history',
        headers: {
          'x-api-key': testApiKey,
          'content-type': 'application/json',
        },
        payload: validHistoryPayload,
      });

      expect(firstResponse.statusCode).toBe(200);

      const secondResponse = await app.inject({
        method: 'POST',
        url: '/webhook/history',
        headers: {
          'x-api-key': testApiKey,
          'content-type': 'application/json',
        },
        payload: validHistoryPayload,
      });

      expect(secondResponse.statusCode).toBe(409);
      const duplicateResponse = secondResponse.json();
      expect(duplicateResponse.error).toBe('Duplicate webhook request');
      expect(duplicateResponse.existingJobId).toBe(firstResponse.json().jobId);
    });

    it('should handle error webhook payload', async () => {
      const errorPayload = {
        type: 'history.error' as const,
        payload: {
          ra: '123456',
          timestamp: '2024-01-15T10:30:00Z',
          error: {
            title: 'Student Not Found Error',
            code: 'UFP0015',
            httpStatus: 404,
            description: 'Student with RA 123456 not found',
            additionalData: { studentRa: '123456' },
          },
          partialData: {
            student: {
              ra: '123456',
              name: 'Test Student',
              course: 'Computer Science',
              campus: 'São Bernardo do Campo',
              shift: 'Diurno',
              startedAt: '2020.1',
            },
            components: [],
            graduations: {
              course: 'Computer Science',
              campus: 'São Bernardo do Campo',
              shift: 'Diurno',
              freeCredits: 20,
              mandatoryCredits: 160,
              limitedCredits: 24,
              extensionCredits: 8,
              completedFreeCredits: 0,
              completedMandatoryCredits: 0,
              completedLimitedCredits: 0,
              completedExtensionCredits: 0,
              completedTotalCredits: 0,
              totalCredits: 184,
            },
            coefficients: {
              cr: 0,
              ca: 0,
              cp: 0,
              ik: 0,
              crece: 0,
              caece: 0,
              cpece: 0,
              ikece: 0,
              caik: 0,
            },
          },
        },
      };

      const response = await app.inject({
        method: 'POST',
        url: '/webhook/history',
        headers: {
          'x-api-key': testApiKey,
          'content-type': 'application/json',
        },
        payload: errorPayload,
      });

      expect(response.statusCode).toBe(200);
      const responseBody = response.json();
      expect(responseBody.status).toBe('accepted');

      const processingJob = await app.db.models.HistoryProcessingJob.findById(
        responseBody.jobId
      );
      expect(processingJob.status).toBe('failed');
      expect(processingJob.error).toEqual({
        code: 'UFP0015',
        message: 'Student with RA 123456 not found',
        details: { studentRa: '123456' },
      });
    });
  });

  describe('GET /webhook/history/:jobId/status', () => {
    it('should return job status for valid job ID', async () => {
      const job = await app.db.models.HistoryProcessingJob.create({
        ra: '123456',
        status: 'completed',
        webhookTimestamp: '2024-01-15T10:30:00Z',
        idempotencyKey: '123456-2024-01-15T10:30:00Z',
        jobType: 'history',
        timeline: [
          {
            status: 'pending',
            timestamp: new Date(),
            note: 'Job created',
          },
          {
            status: 'completed',
            timestamp: new Date(),
            note: 'Job completed successfully',
          },
        ],
      });

      const response = await app.inject({
        method: 'GET',
        url: `/webhook/history/${job._id}/status`,
        headers: {
          'x-api-key': testApiKey,
        },
      });

      expect(response.statusCode).toBe(200);
      const responseBody = response.json();
      expect(responseBody.jobId).toBe(job._id.toString());
      expect(responseBody.ra).toBe('123456');
      expect(responseBody.status).toBe('completed');
      expect(responseBody.timeline).toHaveLength(2);
    });

    it('should return 404 for non-existent job ID', async () => {
      const fakeJobId = '507f1f77bcf86cd799439011';

      const response = await app.inject({
        method: 'GET',
        url: `/webhook/history/${fakeJobId}/status`,
        headers: {
          'x-api-key': testApiKey,
        },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({ error: 'Job not found' });
    });

    it('should reject status check with invalid API key', async () => {
      const job = await app.db.models.HistoryProcessingJob.create({
        ra: '123456',
        status: 'pending',
        webhookTimestamp: '2024-01-15T10:30:00Z',
        idempotencyKey: '123456-2024-01-15T10:30:00Z',
        jobType: 'history',
      });

      const response = await app.inject({
        method: 'GET',
        url: `/webhook/history/${job._id}/status`,
        headers: {
          'x-api-key': 'invalid-key',
        },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({ error: 'Invalid API key' });
    });
  });

  describe('Job Processing', () => {
    it('should process history webhook and create student/history records', async () => {
      const historyPayload = {
        type: 'history.success' as const,
        payload: {
          ra: '789012',
          timestamp: '2024-01-15T10:30:00Z',
          student: {
            ra: '789012',
            name: 'Processing Test Student',
            course: 'Engineering',
            campus: 'Santo André',
            shift: 'Noturno',
            startedAt: '2021.1',
          },
          components: [
            {
              UFCode: 'BCT0001',
              name: 'Physics I',
              grade: 'B',
              status: 'Aprovado',
              year: '2023',
              period: '2',
              credits: 4,
              category: 'mandatory',
              class: 'Turma B',
              teachers: ['Prof. Maria Santos'],
            },
          ],
          graduations: {
            course: 'Engineering',
            campus: 'Santo André',
            shift: 'Noturno',
            freeCredits: 20,
            mandatoryCredits: 180,
            limitedCredits: 28,
            extensionCredits: 12,
            completedFreeCredits: 4,
            completedMandatoryCredits: 24,
            completedLimitedCredits: 4,
            completedExtensionCredits: 2,
            completedTotalCredits: 34,
            totalCredits: 212,
          },
          coefficients: {
            cr: 7.8,
            ca: 7.5,
            cp: 8.0,
            ik: 0.78,
            crece: 7.6,
            caece: 7.4,
            cpece: 7.9,
            ikece: 0.75,
            caik: 0.82,
          },
        },
      };

      const webhookResponse = await app.inject({
        method: 'POST',
        url: '/webhook/history',
        headers: {
          'x-api-key': testApiKey,
          'content-type': 'application/json',
        },
        payload: historyPayload,
      });

      expect(webhookResponse.statusCode).toBe(200);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const student = await app.db.models.Student.findOne({ ra: '789012' });
      expect(student).toBeTruthy();
      expect(student.name).toBe('Processing Test Student');
      expect(student.course).toBe('Engineering');

      const histories = await app.db.models.History.find({ ra: '789012' });
      expect(histories).toHaveLength(1);
      expect(histories[0].name).toBe('Physics I');
      expect(histories[0].code).toBe('BCT0001');
      expect(histories[0].grade).toBe('B');
      expect(histories[0].situation).toBe('completed');

      const processingJob = await app.db.models.HistoryProcessingJob.findById(
        webhookResponse.json().jobId
      );
      expect(processingJob.status).toBe('completed');
    });

    it('should handle processing errors and retry logic', async () => {
      const invalidPayload = {
        type: 'history.success' as const,
        payload: {
          ra: '789012',
          timestamp: '2024-01-15T10:30:00Z',
          student: {
            ra: '789012',
            name: 'Error Test Student',
            course: '',
            campus: '',
            shift: '',
            startedAt: '',
          },
          components: [
            {
              UFCode: '',
              name: 'Invalid Subject',
              grade: null,
              status: '',
              year: '',
              period: '2',
              credits: -1,
              category: 'mandatory',
              class: null,
            },
          ],
          graduations: {
            course: '',
            shift: '',
            freeCredits: 0,
            mandatoryCredits: 0,
            limitedCredits: 0,
            extensionCredits: 0,
            completedFreeCredits: 0,
            completedMandatoryCredits: 0,
            completedLimitedCredits: 0,
            completedExtensionCredits: 0,
            completedTotalCredits: 0,
            totalCredits: 0,
          },
          coefficients: {
            cr: 0,
            ca: 0,
            cp: 0,
            ik: 0,
            crece: 0,
            caece: 0,
            cpece: 0,
            ikece: 0,
            caik: 0,
          },
        },
      };

      const webhookResponse = await app.inject({
        method: 'POST',
        url: '/webhook/history',
        headers: {
          'x-api-key': testApiKey,
          'content-type': 'application/json',
        },
        payload: invalidPayload,
      });

      expect(webhookResponse.statusCode).toBe(200);

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const processingJob = await app.db.models.HistoryProcessingJob.findById(
        webhookResponse.json().jobId
      );
      expect(processingJob.status).toBe('failed');
      expect(processingJob.error).toBeDefined();
    });
  });
});
