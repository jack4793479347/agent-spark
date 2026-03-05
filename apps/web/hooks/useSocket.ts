'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/lib/store/auth';

let socket: Socket | null = null;

function getSocket(orgId: string, userId: string): Socket {
  if (socket?.connected) return socket;

  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  socket = io(url, {
    auth: { orgId, userId },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('[socket] connected');
  });

  socket.on('disconnect', (reason) => {
    console.log('[socket] disconnected:', reason);
  });

  return socket;
}

/**
 * Initializes the Socket.io connection once the user is authenticated.
 * Call this from AppShell so it runs once on login.
 */
export function useSocket() {
  const user = useAuthStore((s) => s.user);
  const org = useAuthStore((s) => s.org);
  const initialized = useRef(false);

  useEffect(() => {
    if (!user || !org || initialized.current) return;
    initialized.current = true;
    getSocket(org.id, user.id);

    return () => {
      // Don't disconnect on unmount — keep connection alive across nav
    };
  }, [user, org]);
}

/**
 * Returns the current socket instance (may be null if not connected).
 */
export function getSocketInstance(): Socket | null {
  return socket;
}
