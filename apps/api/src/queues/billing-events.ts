import { Queue, Worker } from 'bullmq';
import { incrementTaskUsage, incrementA2AUsage, resetPeriodUsage } from '../services/billing-engine.js';

// ─── Redis Connection ───────────────────────────────────────────

const hasRedis = Boolean(process.env.REDIS_URL || process.env.REDIS_HOST);

function getConnection() {
  const redisUrl = process.env.REDIS_URL;
  return redisUrl
    ? (() => {
        const url = new URL(redisUrl);
        return {
          host: url.hostname,
          port: Number(url.port) || 6379,
          password: url.password || undefined,
          tls: url.protocol === 'rediss:' ? {} : undefined,
        };
      })()
    : {
        host: process.env.REDIS_HOST ?? '127.0.0.1',
        port: Number(process.env.REDIS_PORT ?? 6379),
        password: process.env.REDIS_PASSWORD ?? undefined,
        lazyConnect: true,
      };
}

// ─── Queue ──────────────────────────────────────────────────────

interface BillingJobData {
  type: 'increment_task' | 'increment_a2a' | 'reset_period';
  orgId: string;
}

let _queue: Queue<BillingJobData> | null = null;

function getQueue(): Queue<BillingJobData> | null {
  if (!hasRedis) return null;
  if (!_queue) {
    _queue = new Queue<BillingJobData>('billing-events', {
      connection: getConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 200 },
      },
    });
  }
  return _queue;
}

// ─── Enqueue Helpers ────────────────────────────────────────────

export async function enqueueTaskIncrement(orgId: string): Promise<void> {
  const queue = getQueue();
  if (!queue) { await incrementTaskUsage(orgId); return; }
  await queue.add('increment_task', { type: 'increment_task', orgId });
}

export async function enqueueA2AIncrement(orgId: string): Promise<void> {
  const queue = getQueue();
  if (!queue) { await incrementA2AUsage(orgId); return; }
  await queue.add('increment_a2a', { type: 'increment_a2a', orgId });
}

export async function enqueuePeriodReset(orgId: string): Promise<void> {
  const queue = getQueue();
  if (!queue) { await resetPeriodUsage(orgId); return; }
  await queue.add('reset_period', { type: 'reset_period', orgId });
}

// ─── Worker ─────────────────────────────────────────────────────

let worker: Worker<BillingJobData> | null = null;

export function startBillingEventsWorker(): void {
  if (!hasRedis) return;
  worker = new Worker<BillingJobData>(
    'billing-events',
    async (job) => {
      const { type, orgId } = job.data;
      switch (type) {
        case 'increment_task':
          await incrementTaskUsage(orgId);
          break;
        case 'increment_a2a':
          await incrementA2AUsage(orgId);
          break;
        case 'reset_period':
          await resetPeriodUsage(orgId);
          break;
      }
    },
    {
      connection: getConnection(),
      concurrency: 10,
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`Billing event job ${job?.id} failed:`, err.message);
  });
}

export async function stopBillingEventsWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
  }
}
