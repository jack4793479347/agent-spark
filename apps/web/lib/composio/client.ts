import { Composio } from '@composio/core';
import { AnthropicProvider } from '@composio/anthropic';

let _instance: Composio<AnthropicProvider> | null = null;

/**
 * Singleton Composio client configured with the Anthropic provider.
 * Reads COMPOSIO_API_KEY from env.
 */
export function getComposio() {
  if (!_instance) {
    _instance = new Composio({
      apiKey: process.env.COMPOSIO_API_KEY,
      provider: new AnthropicProvider(),
    });
  }
  return _instance;
}

/**
 * Map our internal connector type IDs to Composio toolkit slugs.
 * Our DB stores lowercase names like "gmail", "slack", etc.
 * Composio uses uppercase slugs like "GMAIL", "SLACK", etc.
 */
export const CONNECTOR_TO_TOOLKIT: Record<string, string> = {
  gmail: 'GMAIL',
  slack: 'SLACK',
  shopify: 'SHOPIFY',
  hubspot: 'HUBSPOT',
  stripe: 'STRIPE',
  notion: 'NOTION',
  'google-calendar': 'GOOGLECALENDAR',
  'google-sheets': 'GOOGLESHEETS',
  airtable: 'AIRTABLE',
};

/** Connectors we manage ourselves (not via Composio) */
export const LOCAL_ONLY_CONNECTORS = new Set(['webhook']);

export const TOOLKIT_TO_CONNECTOR: Record<string, string> = Object.fromEntries(
  Object.entries(CONNECTOR_TO_TOOLKIT).map(([k, v]) => [v, k])
);

/**
 * Build a Composio user ID from our org ID.
 * Composio uses user IDs to scope connections.
 */
export function composioUserId(orgId: string) {
  return `org_${orgId}`;
}
