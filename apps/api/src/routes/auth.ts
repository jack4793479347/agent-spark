import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import type { AuthContext } from '../middleware/auth.js';

export const authRoutes = new Hono<{
  Variables: {
    auth: AuthContext;
  };
}>();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(1, 'Name is required'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /signup
authRoutes.post('/signup', zValidator('json', signupSchema), async (c) => {
  const { email, password, full_name } = c.req.valid('json');

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });

  if (error) {
    return c.json({ error: error.message }, 400);
  }

  return c.json({
    user: {
      id: data.user.id,
      email: data.user.email,
    },
    message: 'Account created successfully',
  }, 201);
});

// POST /login
authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return c.json({ error: error.message }, 401);
  }

  return c.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      display_name: data.user.user_metadata?.full_name,
    },
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    },
  });
});

// POST /logout
authRoutes.post('/logout', authMiddleware, async (c) => {
  const auth = c.get('auth');

  const { error } = await supabaseAdmin.auth.admin.signOut(auth.accessToken);
  if (error) {
    // Non-critical — token may already be expired
    console.warn('Logout warning:', error.message);
  }

  return c.json({ message: 'Logged out' });
});

// GET /session — Get current user profile + org
authRoutes.get('/session', authMiddleware, async (c) => {
  const auth = c.get('auth');

  // Fetch Supabase auth user for metadata
  const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(auth.userId);
  const fullName = authUser?.user_metadata?.full_name ?? authUser?.email?.split('@')[0] ?? 'User';

  // Fetch or auto-create profile
  let { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', auth.userId)
    .single();

  if (!profile) {
    const { data: newProfile } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: auth.userId,
        display_name: fullName,
        email: authUser?.email,
        avatar_url: authUser?.user_metadata?.avatar_url ?? null,
        is_creator: false,
        stripe_customer_id: null,
        stripe_connect_id: null,
      })
      .select()
      .single();
    profile = newProfile;
  }

  // Fetch user's organizations
  let { data: memberships } = await supabaseAdmin
    .from('org_members')
    .select('org_id, role, organizations(id, name, slug, plan)')
    .eq('user_id', auth.userId);

  // Auto-create personal org if none exists
  if (!memberships || memberships.length === 0) {
    const slug = fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50) + '-org';
    const { data: newOrg } = await supabaseAdmin
      .from('organizations')
      .insert({ name: `${fullName}'s Workspace`, slug, plan: 'free' })
      .select()
      .single();

    if (newOrg) {
      await supabaseAdmin
        .from('org_members')
        .insert({ org_id: newOrg.id, user_id: auth.userId, role: 'owner' });

      memberships = [{
        org_id: newOrg.id,
        role: 'owner',
        organizations: newOrg as unknown as typeof memberships extends (infer T)[] ? T extends { organizations: infer O } ? O : never : never,
      }] as typeof memberships;
    }
  }

  return c.json({
    user: profile,
    organizations: (memberships ?? []).map((m) => {
      const org = m.organizations as unknown as { id: string; name: string; slug: string; plan: string } | null;
      return {
        id: org?.id,
        name: org?.name,
        slug: org?.slug,
        plan: org?.plan,
        role: m.role,
      };
    }),
  });
});

// POST /become-creator — Initiate Stripe Connect onboarding
authRoutes.post('/become-creator', authMiddleware, async (c) => {
  const auth = c.get('auth') as AuthContext;

  try {
    const { onboardCreator } = await import('../services/billing-engine.js');
    const result = await onboardCreator(auth.userId);
    return c.json({ url: result.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Onboarding failed';
    return c.json({ error: message }, 500);
  }
});
