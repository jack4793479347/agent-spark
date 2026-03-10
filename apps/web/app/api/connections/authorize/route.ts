import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/supabase/api-auth';
import { getComposio, CONNECTOR_TO_TOOLKIT, composioUserId } from '@/lib/composio/client';

// POST /api/connections/authorize — start OAuth flow via Composio
export async function POST(request: NextRequest) {
  const auth = await getApiUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!auth.orgId) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  const { connector_type } = await request.json();
  if (!connector_type) {
    return NextResponse.json({ error: 'connector_type required' }, { status: 400 });
  }

  const toolkit = CONNECTOR_TO_TOOLKIT[connector_type];
  if (!toolkit) {
    return NextResponse.json({ error: `Unknown connector type: ${connector_type}` }, { status: 400 });
  }

  try {
    const composio = getComposio();
    const userId = composioUserId(auth.orgId);

    // Create a session for this user and authorize the toolkit
    const session = await composio.create(userId, {
      toolkits: [toolkit],
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const connectionRequest = await session.authorize(toolkit, {
      callbackUrl: `${appUrl}/api/connections/callback`,
    });

    return NextResponse.json({
      redirectUrl: connectionRequest.redirectUrl,
      connectionId: connectionRequest.id,
    });
  } catch (e) {
    console.error('Composio authorize error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to start authorization' },
      { status: 500 }
    );
  }
}
