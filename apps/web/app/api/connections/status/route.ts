import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/supabase/api-auth';
import { getComposio, CONNECTOR_TO_TOOLKIT, TOOLKIT_TO_CONNECTOR, LOCAL_ONLY_CONNECTORS, composioUserId } from '@/lib/composio/client';

// GET /api/connections/status — get connection status for all toolkits
export async function GET(request: NextRequest) {
  const auth = await getApiUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!auth.orgId) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  try {
    const composio = getComposio();
    const userId = composioUserId(auth.orgId);

    const allToolkits = Object.values(CONNECTOR_TO_TOOLKIT);

    const session = await composio.create(userId, {
      toolkits: allToolkits,
      manageConnections: false,
    });

    const toolkitsInfo = await session.toolkits({ toolkits: allToolkits });

    // Map Composio toolkits back to our connector IDs
    const connections: Array<{
      connector_type: string;
      name: string;
      logo?: string;
      connected: boolean;
      isNoAuth: boolean;
    }> = (toolkitsInfo.items || []).map((tk: any) => ({
      connector_type: TOOLKIT_TO_CONNECTOR[tk.slug] || tk.slug.toLowerCase(),
      name: tk.name,
      logo: tk.logo,
      connected: tk.connection?.isActive === true,
      isNoAuth: tk.isNoAuth,
    }));

    // Add local-only connectors (not managed by Composio)
    for (const id of LOCAL_ONLY_CONNECTORS) {
      connections.push({
        connector_type: id,
        name: id.charAt(0).toUpperCase() + id.slice(1),
        connected: false,
        isNoAuth: true,
      });
    }

    return NextResponse.json({ connections });
  } catch (e) {
    console.error('Composio status error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to get connection status' },
      { status: 500 }
    );
  }
}
