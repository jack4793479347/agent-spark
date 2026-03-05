import { Queue, Worker } from 'bullmq';
import { delegateToAgent, type A2ACallContext } from '../connectors/a2a-orchestrator.js';

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

interface A2AJobData {
  targetAgentId: string;
  task: string;
  context?: Record<string, unknown>;
  callContext: A2ACallContext;
}

let _queue: Queue<A2AJobData> | null = null;

function getQueue(): Queue<A2AJobData> | null {
  if (!hasRedis) return null;
  if (!_queue) {
    _queue = new Queue<A2AJobData>('a2a-calls', {
      connection: getConnection(),
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 200 },
        removeOnFail: { count: 100 },
      },
    });
  }
  return _queue;
}

// ─── Enqueue ────────────────────────────────────────────────────

export async function enqueueA2ACall(data: A2AJobData): Promise<string> {
  const queue = getQueue();
  if (!queue) {
    console.log('[a2a-calls] No Redis — skipping queue');
    return '';
  }
  const job = await queue.add('delegate', data);
  return job.id ?? '';
}

// ─── Worker ─────────────────────────────────────────────────────

let worker: Worker<A2AJobData> | null = null;

export function startA2ACallWorker(): void {
  if (!hasRedis) return;
  worker = new Worker<A2AJobData>(
    'a2a-calls',
    async (job) => {
      const { targetAgentId, task, context, callContext } = job.data;
      await delegateToAgent(
        { agent_id: targetAgentId, task, context },
        callContext
      );
    },
    {
      connection: getConnection(),
      concurrency: 3,
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`A2A call job ${job?.id} failed:`, err.message);
  });
}

export async function stopA2ACallWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
  }
}
