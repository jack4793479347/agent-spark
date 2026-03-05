import type { Connector, MCPToolDefinition, ToolResult } from './interface.js';
import { getCredential, storeCredential } from '../services/credential-vault.js';

const SHOPIFY_SCOPES = 'read_orders,write_orders,read_inventory,write_inventory,read_products';

function shopDomain(): string {
  // In production, the shop domain comes from the OAuth flow
  // For now we support a default or per-connection shop domain
  return process.env.SHOPIFY_SHOP_DOMAIN ?? 'placeholder.myshopify.com';
}

async function shopifyApi(
  path: string,
  vaultId: string,
  init?: RequestInit & { shopDomain?: string }
): Promise<Record<string, unknown>> {
  const cred = await getCredential(vaultId);
  const domain = init?.shopDomain ?? cred.raw?.shop_domain as string ?? shopDomain();
  const res = await fetch(`https://${domain}/admin/api/2024-01/${path}`, {
    ...init,
    headers: {
      'X-Shopify-Access-Token': cred.access_token,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  return res.json() as Promise<Record<string, unknown>>;
}

export const shopifyConnector: Connector = {
  id: 'shopify',
  name: 'Shopify',
  description: 'Manage orders, inventory, and refunds on Shopify',
  authType: 'oauth2',
  category: 'ecommerce',
  icon: 'shopping-bag',

  getOAuthURL(orgId: string, redirectUri: string): string {
    const shop = shopDomain();
    const params = new URLSearchParams({
      client_id: process.env.SHOPIFY_CLIENT_ID ?? '',
      scope: SHOPIFY_SCOPES,
      redirect_uri: redirectUri,
      state: orgId,
    });
    return `https://${shop}/admin/oauth/authorize?${params}`;
  },

  async handleOAuthCallback(code: string, orgId: string): Promise<{ credentialVaultId: string }> {
    const shop = shopDomain();
    const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_CLIENT_ID ?? '',
        client_secret: process.env.SHOPIFY_CLIENT_SECRET ?? '',
        code,
      }),
    });

    const tokens = await res.json() as Record<string, unknown>;
    if (tokens.error) throw new Error(`Shopify OAuth failed: ${tokens.error}`);

    const vaultId = await storeCredential(orgId, 'shopify', {
      access_token: tokens.access_token as string,
      scope: tokens.scope as string,
      raw: { shop_domain: shop },
    });

    return { credentialVaultId: vaultId };
  },

  // Shopify access tokens don't expire (offline mode)
  async refreshToken(): Promise<void> {
    // No-op: Shopify offline access tokens don't expire
  },

  async testConnection(credentialVaultId: string): Promise<boolean> {
    try {
      const data = await shopifyApi('shop.json', credentialVaultId);
      return 'shop' in data;
    } catch {
      return false;
    }
  },

  getTools(): MCPToolDefinition[] {
    return [
      {
        name: 'get_orders',
        description: 'Fetch recent Shopify orders',
        input_schema: {
          type: 'object',
          properties: {
            status: { type: 'string', description: 'Order status filter: open, closed, cancelled, any (default any)' },
            limit: { type: 'number', description: 'Max orders to return (default 10)' },
          },
        },
      },
      {
        name: 'process_refund',
        description: 'Process a refund for a Shopify order',
        input_schema: {
          type: 'object',
          properties: {
            order_id: { type: 'string', description: 'Shopify order ID' },
            amount: { type: 'number', description: 'Refund amount in shop currency (omit for full refund)' },
            reason: { type: 'string', description: 'Reason for refund' },
          },
          required: ['order_id'],
        },
      },
      {
        name: 'update_inventory',
        description: 'Update inventory quantity for a product variant',
        input_schema: {
          type: 'object',
          properties: {
            inventory_item_id: { type: 'string', description: 'Inventory item ID' },
            location_id: { type: 'string', description: 'Location ID' },
            available_adjustment: { type: 'number', description: 'Quantity adjustment (positive or negative)' },
          },
          required: ['inventory_item_id', 'location_id', 'available_adjustment'],
        },
      },
    ];
  },

  async executeTool(toolName: string, params: Record<string, unknown>, credentialVaultId: string): Promise<ToolResult> {
    try {
      switch (toolName) {
        case 'get_orders': {
          const status = (params.status as string) || 'any';
          const limit = (params.limit as number) || 10;
          const data = await shopifyApi(
            `orders.json?status=${status}&limit=${limit}`,
            credentialVaultId
          );
          return { success: true, data: data.orders };
        }

        case 'process_refund': {
          const orderId = params.order_id as string;
          // First get the order to find line items for refund calculation
          const orderData = await shopifyApi(`orders/${orderId}.json`, credentialVaultId);
          const order = orderData.order as Record<string, unknown> | undefined;
          if (!order) return { success: false, error: 'Order not found' };

          const refundBody: Record<string, unknown> = {
            refund: {
              note: params.reason ?? 'Refund processed by Agent Spark',
              shipping: { full_refund: true },
            },
          };

          if (params.amount) {
            (refundBody.refund as Record<string, unknown>).transactions = [{
              kind: 'refund',
              amount: params.amount,
            }];
          }

          const data = await shopifyApi(
            `orders/${orderId}/refunds.json`,
            credentialVaultId,
            { method: 'POST', body: JSON.stringify(refundBody) }
          );
          return { success: true, data: data.refund };
        }

        case 'update_inventory': {
          const data = await shopifyApi(
            'inventory_levels/adjust.json',
            credentialVaultId,
            {
              method: 'POST',
              body: JSON.stringify({
                location_id: params.location_id,
                inventory_item_id: params.inventory_item_id,
                available_adjustment: params.available_adjustment,
              }),
            }
          );
          return { success: true, data: data.inventory_level };
        }

        default:
          return { success: false, error: `Unknown tool: ${toolName}` };
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },
};
