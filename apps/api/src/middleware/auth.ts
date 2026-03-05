import { createMiddleware } from 'hono/factory';
import { supabaseAdmin } from '../lib/supabase.js';

export interface AuthContext {
  userId: string;
  email: string;
  accessToken: string;
}

export interface OrgContext {
  orgId: string;
  orgRole: string;
}

// Verify Supabase JWT and attach user context
export const authMiddleware = createMiddleware<{
  Variables: {
    auth: AuthContext;
  };
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid authorization header' }, 401);
  }

  const token = authHeader.slice(7);

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }

  c.set('auth', {
    userId: user.id,
    email: user.email!,
    accessToken: token,
  });

  await next();
});

// Optional auth — doesn't reject unauthenticated requests
export const optionalAuthMiddleware = createMiddleware<{
  Variables: {
    auth: AuthContext | null;
  };
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    c.set('auth', null);
    await next();
    return;
  }

  const token = authHeader.slice(7);
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);

  if (user) {
    c.set('auth', {
      userId: user.id,
      email: user.email!,
      accessToken: token,
    });
  } else {
    c.set('auth', null);
  }

  await next();
});
