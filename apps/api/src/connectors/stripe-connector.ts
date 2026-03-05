import type { Connector, MCPToolDefinition, ToolResult } from './interface.js';
import { getCredential, storeCredential } from '../services/credential-vault.js';

const STRIPE_API = 'https://api.stripe.com/v1';

export const stripeConnector: Connector = {
  id: 'stripe',
  name: 'Stripe',
  description: 'Manage payments, customers, and invoices',
  authType: 'api_key',
  category: 'finance',
  icon: 'credit-card',

  getOAuthURL(): string {
    // Stripe uses API keys, not OAuth — this won't be called
    throw new Error('Stripe uses API key auth, not OAuth');
  },

  async handleOAuthCallback(_code: string, _orgId: string) {
    throw new Error('Stripe uses API key auth, not OAuth');
  },

  async refreshToken() {
    // API keys don't expire
  },

  async testConnection(credentialVaultId: string) {
    try {
      const cred = await getCredential(credentialVaultId);
      const res = await fetch(`${STRIPE_API}/balance`, {
        headers: { Authorization: `Bearer ${cred.access_token}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  getTools(): MCPToolDefinition[] {
    return [
      {
        name: 'list_customers',
        description: 'List Stripe customers',
        input_schema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Max customers (default 10)' },
            email: { type: 'string', description: 'Filter by email' },
          },
        },
      },
      {
        name: 'create_invoice',
        description: 'Create a draft invoice for a customer',
        input_schema: {
          type: 'object',
          properties: {
            customer_id: { type: 'string', description: 'Stripe customer ID' },
            amount_cents: { type: 'number', description: 'Amount in cents' },
            description: { type: 'string', description: 'Line item description' },
          },
          required: ['customer_id', 'amount_cents'],
        },
      },
      {
        name: 'list_payments',
        description: 'List recent payment intents',
        input_schema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Max results (default 10)' },
          },
        },
      },
    ];
  },

  async executeTool(toolName, params, credentialVaultId): Promise<ToolResult> {
    try {
      const cred = await getCredential(credentialVaultId);
      const headers = { Authorization: `Bearer ${cred.access_token}`, 'Content-Type': 'application/x-www-form-urlencoded' };

      switch (toolName) {
        case 'list_customers': {
          const limit = (params.limit as number) || 10;
          const query = new URLSearchParams({ limit: String(limit) });
          if (params.email) query.set('email', params.email as string);
          const res = await fetch(`${STRIPE_API}/customers?${query}`, { headers });
          if (!res.ok) return { success: false, error: `List failed: ${res.status}` };
          return { success: true, data: await res.json() };
        }
        case 'create_invoice': {
          // Create invoice
          const invRes = await fetch(`${STRIPE_API}/invoices`, {
            method: 'POST',
            headers,
            body: new URLSearchParams({ customer: params.customer_id as string }),
          });
          if (!invRes.ok) return { success: false, error: `Invoice failed: ${invRes.status}` };
          const invoice = await invRes.json() as { id: string };

          // Add line item
          await fetch(`${STRIPE_API}/invoiceitems`, {
            method: 'POST',
            headers,
            body: new URLSearchParams({
              customer: params.customer_id as string,
              invoice: invoice.id,
              amount: String(params.amount_cents),
              currency: 'usd',
              description: (params.description as string) || 'AgentSpark charge',
            }),
          });

          return { success: true, data: invoice };
        }
        case 'list_payments': {
          const limit = (params.limit as number) || 10;
          const res = await fetch(`${STRIPE_API}/payment_intents?limit=${limit}`, { headers });
          if (!res.ok) return { success: false, error: `List failed: ${res.status}` };
          return { success: true, data: await res.json() };
        }
        default:
          return { success: false, error: `Unknown tool: ${toolName}` };
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },
};
