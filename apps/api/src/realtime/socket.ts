import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { setEmitFunction } from '../services/agent-runtime.js';

export const SocketEvents = {
  // Agent execution events → User dashboard
  AGENT_ACTIVITY: 'agent:activity',
  AGENT_COMPLETED: 'agent:completed',
  AGENT_ERROR: 'agent:error',
  APPROVAL_REQUIRED: 'agent:approval',

  // A2A events → Workflow visualizer (Step 9)
  A2A_CALL_STARTED: 'a2a:call_started',
  A2A_CALL_COMPLETED: 'a2a:call_completed',

  // Creator events → Creator dashboard (Step 8)
  NEW_RENTAL: 'creator:new_rental',
  EARNING_RECEIVED: 'creator:earning',
  NEW_REVIEW: 'creator:new_review',

  // Marketplace events → Browse page (Step 7)
  AGENT_TRENDING: 'marketplace:trending',
} as const;

let io: SocketServer | null = null;

export function setupSocketIO(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    const { orgId, userId } = socket.handshake.auth as {
      orgId?: string;
      userId?: string;
    };

    if (orgId) socket.join(`org:${orgId}`);
    if (userId) {
      socket.join(`user:${userId}`);
      socket.join(`creator:${userId}`);
    }

    socket.on('disconnect', () => {
      // Cleanup handled automatically by Socket.io
    });
  });

  // Wire the emit function to the agent runtime
  setEmitFunction((orgId: string, event: string, data: unknown) => {
    io?.to(`org:${orgId}`).emit(event, data);
  });

  return io;
}

/**
 * Emit an event to a specific org room.
 */
export function emitToOrg(orgId: string, event: string, data: unknown): void {
  io?.to(`org:${orgId}`).emit(event, data);
}

/**
 * Emit an event to a specific user.
 */
export function emitToUser(userId: string, event: string, data: unknown): void {
  io?.to(`user:${userId}`).emit(event, data);
}

/**
 * Emit an event to a creator's dashboard.
 */
export function emitToCreator(creatorId: string, event: string, data: unknown): void {
  io?.to(`creator:${creatorId}`).emit(event, data);
}

export function getIO(): SocketServer | null {
  return io;
}
