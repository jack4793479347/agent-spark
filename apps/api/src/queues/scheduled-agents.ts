import { Queue, Worker } from 'bullmq';
import { processA2APayouts } from '../services/billing-engine.js';

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

interface ScheduledJobData {
  type: 'a2a_payout' | 'scheduled_execution';
  payload?: Record<string, unknown>;
}

let _queue: Queue<ScheduledJobData> | null = null;

function getQueue(): Queue<ScheduledJobData> | null {
  if (!hasRedis) return null;
  if (!_queue) {
    _queue = new Queue<ScheduledJobData>('scheduled-agents', {
      connection: getConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 50 },
        removeOnFail: { count: 50 },
      },
    });
  }
  return _queue;
}

// ─── Schedule A2A Payout Job (daily) ────────────────────────────

export async function scheduleA2APayoutJob(): Promise<void> {
  const queue = getQueue();
  if (!queue) { console.log('[scheduled] No Redis — skipping scheduled jobs'); return; }
  await queue.add(
    'a2a-payout',
    { type: 'a2a_payout' },
    {
      repeat: { pattern: '0 2 * * *' },
      jobId: 'daily-a2a-payout',
    }
  );
}

// ─── Worker ─────────────────────────────────────────────────────

let worker: Worker<ScheduledJobData> | null = null;

export function startScheduledWorker(): void {
  if (!hasRedis) return;
  worker = new Worker<ScheduledJobData>(
    'scheduled-agents',
    async (job) => {
      const { type } = job.data;
      switch (type) {
        case 'a2a_payout': {
          console.log('[scheduled] Processing A2A batch payouts...');
          const result = await processA2APayouts();
          console.log(`[scheduled] A2A payouts done: ${result.processed} processed, ${result.skipped} skipped, ${result.failed} failed`);
          break;
        }
        case 'scheduled_execution': {
          console.log('[scheduled] Scheduled execution job:', job.data.payload);
          break;
        }
        default:
          console.warn(`[scheduled] Unknown job type: ${type}`);
      }
    },
    {
      connection: getConnection(),
      concurrency: 1,
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`[scheduled] Job ${job?.id} failed:`, err.message);
  });
}

export async function stopScheduledWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
  }
}
