import { Queue, Worker } from 'bullmq';
import { executeAgent, type ExecutionContext } from '../services/agent-runtime.js';

// Redis connection config — uses REDIS_URL env var or defaults to localhost
function getRedisConnection() {
  const url = process.env.REDIS_URL;
  if (url) {
    return { url };
  }
  return {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    lazyConnect: true,
  };
}

const hasRedis = Boolean(process.env.REDIS_URL || process.env.REDIS_HOST);

const connection = getRedisConnection();

// ─── Queue (only created when Redis is configured) ──────────────

let _queue: Queue<ExecutionContext> | null = null;

function getQueue(): Queue<ExecutionContext> | null {
  if (!hasRedis) return null;
  if (!_queue) {
    _queue = new Queue<ExecutionContext>('agent-execution', {
      connection,
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    });
  }
  return _queue;
}

export const agentExecutionQueue = { get instance() { return getQueue(); } };

/**
 * Add an agent execution job to the queue.
 * Falls back to direct execution when Redis is not available.
 */
export async function enqueueAgentExecution(ctx: ExecutionContext): Promise<string> {
  const queue = getQueue();
  if (!queue) {
    // No Redis — execute directly (dev mode)
    console.log(`[agent-execution] No Redis — executing directly: ${ctx.executionId}`);
    executeAgent(ctx).catch((err) => console.error('[agent-execution] Direct execution failed:', err));
    return ctx.executionId;
  }
  const job = await queue.add('execute', ctx, {
    jobId: ctx.executionId,
  });
  return job.id ?? ctx.executionId;
}

// ─── Worker ─────────────────────────────────────────────────────

let worker: Worker | null = null;

/**
 * Start the BullMQ worker that processes agent execution jobs.
 * Only call this in the API server process (not in build).
 */
export function startAgentExecutionWorker(): Worker {
  if (worker) return worker;

  worker = new Worker<ExecutionContext>(
    'agent-execution',
    async (job) => {
      console.log(`[agent-execution] Processing job ${job.id}`);
      await executeAgent(job.data);
      console.log(`[agent-execution] Completed job ${job.id}`);
    },
    {
      connection,
      concurrency: 5,
      limiter: {
        max: 10,
        duration: 60_000,
      },
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`[agent-execution] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('[agent-execution] Worker error:', err.message);
  });

  return worker;
}

/**
 * Gracefully shut down the worker.
 */
export async function stopAgentExecutionWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
  }
}
