# Queue Package Setup Guide

This guide demonstrates how to set up and use the `@next/queues` package in your Fastify application.

## Basic Setup

```typescript
import { defineJob } from "@next/queues/client";
import { JobManager } from "@next/queues/manager";
import { z } from "zod";
import type { FastifyInstance } from "fastify";

// Define job data and result types
type EmailData = {
  to: string;
  subject: string;
  body: string;
};

type EmailResult = {
  messageId: string;
  sent: boolean;
};

// Define job with builder pattern
const emailJob = defineJob<"send_email", EmailData, EmailResult>("send_email")
  .input(
    z.object({
      to: z.string().email(),
      subject: z.string(),
      body: z.string(),
    })
  )
  .output(
    z.object({
      messageId: z.string(),
      sent: z.boolean(),
    })
  )
  .retry(3, 1000, { type: "exponential", delay: 1000 })
  .concurrency(10)
  .removeOnComplete(30 * 24 * 60 * 60, 1000) // 30 days, 1000 jobs
  .handler(async ({ job, app }) => {
    const { to, subject, body } = job.data;
    const traceId = job.data.globalTraceId;

    app.log.info({ traceId, to }, "Sending email");

    // Send email logic here
    // ...

    return {
      messageId: "123",
      sent: true,
    };
  });

// Scheduled job (runs daily at 2 AM UTC)
const cleanupJob = defineJob<"cleanup", { app: FastifyInstance }, void>(
  "cleanup"
)
  .every("0 2 * * *", "UTC")
  .handler(async ({ app }) => {
    app.log.info("Running cleanup");
    // Cleanup logic here
  });

// Initialize JobManager
export async function setupQueues(app: FastifyInstance) {
  const redisURL = new URL(process.env.REDIS_URL || "redis://localhost:6379");
  const jobManager = new JobManager(app, redisURL, "/admin/jobs");

  // Register all jobs
  jobManager.register(emailJob).register(cleanupJob);

  // Start the job manager (creates queues and workers)
  await jobManager.start();

  // Setup the Bull Board UI for monitoring
  await jobManager.board();

  return jobManager;
}

// In your app setup:
// const jobManager = await setupQueues(app);
```

## Dispatching Jobs

```typescript
// Dispatch a job immediately
app.post("/send-email", async (request, reply) => {
  const traceId = request.headers["x-trace-id"] as string;

  await jobManager.dispatch("send_email", {
    to: "user@example.com",
    subject: "Hello",
    body: "World",
    globalTraceId: traceId, // Include traceId in data
  });

  return { success: true };
});

// Schedule a job for later (with delay)
await jobManager.schedule(
  "send_email",
  {
    to: "user@example.com",
    subject: "Scheduled Email",
    body: "This will be sent in 1 minute",
    globalTraceId: "abc-123",
  },
  {
    delay: 60000, // 1 minute delay
  }
);
```

## Advanced Configuration

### Job Options

```typescript
const advancedJob = defineJob<"advanced", MyData, MyResult>("advanced")
  .options({
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: {
      age: 7 * 24 * 60 * 60, // 7 days
      count: 5000,
    },
    removeOnFail: {
      age: 30 * 24 * 60 * 60, // 30 days
      count: 1000,
    },
  })
  .handler(async ({ job, app }) => {
    // Handler logic
  });
```

### Worker Options

```typescript
const rateLimitedJob = defineJob<"rate_limited", MyData, MyResult>(
  "rate_limited"
)
  .worker({
    concurrency: 5,
    limiter: {
      max: 100,
      duration: 60000, // 100 jobs per minute
    },
  })
  .handler(async ({ job, app }) => {
    // Handler logic
  });
```

### Scheduled Jobs

```typescript
// Run every 5 minutes
const frequentJob = defineJob<"frequent", MyData, MyResult>("frequent")
  .every("5 minutes")
  .handler(async ({ job, app }) => {
    // Handler logic
  });

// Run every day at midnight (local time)
const dailyJob = defineJob<"daily", MyData, MyResult>("daily")
  .every("0 0 * * *", "America/Sao_Paulo")
  .handler(async ({ job, app }) => {
    // Handler logic
  });
```

## Accessing Job Context

The handler receives a context object with:

- `job`: The BullMQ Job object containing:
  - `job.data`: Your typed job data (includes `globalTraceId` if provided)
  - `job.id`: Unique job ID
  - `job.name`: Job name
  - `job.attemptsMade`: Number of retry attempts
  - Other BullMQ job properties
- `app`: Your Fastify instance (with some internal properties removed)

```typescript
const jobWithContext = defineJob<"context_example", MyData, MyResult>(
  "context_example"
).handler(async ({ job, app }) => {
  const traceId = job.data.globalTraceId;
  const jobId = job.id;
  const attempts = job.attemptsMade;

  app.log.info({ traceId, jobId, attempts }, "Processing job");

  // Your logic here
});
```

## Type Safety

The package provides full TypeScript type safety:

```typescript
// Type-safe job definition
const typedJob = defineJob<"my_job", { userId: number }, { success: boolean }>(
  "my_job"
)
  .input(z.object({ userId: z.number() }))
  .output(z.object({ success: z.boolean() }))
  .handler(async ({ job }) => {
    // job.data.userId is typed as number
    // Return type must match { success: boolean }
    return { success: true };
  });

// Type-safe dispatch
await jobManager.dispatch("my_job", {
  userId: 123, // TypeScript will error if you pass wrong type
});
```

## Error Handling

Jobs automatically retry on failure based on your configuration:

```typescript
const retryJob = defineJob<"retry_example", MyData, MyResult>("retry_example")
  .retry(3, 1000, { type: "exponential", delay: 1000 })
  .handler(async ({ job, app }) => {
    // If this throws an error, it will retry up to 3 times
    // with exponential backoff
    if (Math.random() > 0.5) {
      throw new Error("Random failure");
    }
    return { success: true };
  });
```

## Monitoring with Bull Board

After calling `jobManager.board()`, you can access the Bull Board UI at the path you specified (default: `/board/ui`).

The board provides:

- Real-time queue monitoring
- Job status tracking
- Retry management
- Performance metrics

## Complete Example

```typescript
import { defineJob } from "@next/queues/client";
import { JobManager } from "@next/queues/manager";
import { z } from "zod";
import type { FastifyInstance } from "fastify";

// 1. Define your jobs
const emailJob = defineJob<"send_email", EmailData, EmailResult>("send_email")
  .input(
    z.object({
      to: z.string().email(),
      subject: z.string(),
      body: z.string(),
    })
  )
  .output(
    z.object({
      messageId: z.string(),
      sent: z.boolean(),
    })
  )
  .retry(3, 1000, { type: "exponential", delay: 1000 })
  .concurrency(10)
  .removeOnComplete(30 * 24 * 60 * 60, 1000)
  .handler(async ({ job, app }) => {
    app.log.info({ data: job.data }, "Sending email");
    return { messageId: "123", sent: true };
  });

const cleanupJob = defineJob<"cleanup", Record<string, never>, void>("cleanup")
  .every("0 2 * * *", "UTC")
  .handler(async ({ app }) => {
    app.log.info("Running cleanup");
  });

// 2. Setup function
export async function setupQueues(app: FastifyInstance) {
  const redisURL = new URL(process.env.REDIS_URL || "redis://localhost:6379");
  const jobManager = new JobManager(app, redisURL, "/admin/jobs");

  jobManager.register(emailJob).register(cleanupJob);

  await jobManager.start();
  await jobManager.board();

  return jobManager;
}

// 3. Use in your routes
app.post("/send-email", async (request, reply) => {
  const traceId = request.headers["x-trace-id"] as string;

  await jobManager.dispatch("send_email", {
    to: "user@example.com",
    subject: "Hello",
    body: "World",
    globalTraceId: traceId,
  });

  return { success: true };
});
```
