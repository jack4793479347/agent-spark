import type { Connector } from '../connectors/interface.js';
import { gmailConnector } from '../connectors/gmail.js';
import { slackConnector } from '../connectors/slack.js';
import { shopifyConnector } from '../connectors/shopify.js';
import { hubspotConnector } from '../connectors/hubspot.js';
import { notionConnector } from '../connectors/notion.js';
import { googleCalendarConnector } from '../connectors/google-calendar.js';
import { googleSheetsConnector } from '../connectors/google-sheets.js';
import { airtableConnector } from '../connectors/airtable.js';
import { stripeConnector } from '../connectors/stripe-connector.js';
import { webhookConnector } from '../connectors/webhook.js';

const connectorRegistry = new Map<string, Connector>();

function registerConnector(connector: Connector): void {
  connectorRegistry.set(connector.id, connector);
}

// Register all connectors
registerConnector(gmailConnector);
registerConnector(slackConnector);
registerConnector(shopifyConnector);
registerConnector(hubspotConnector);
registerConnector(notionConnector);
registerConnector(googleCalendarConnector);
registerConnector(googleSheetsConnector);
registerConnector(airtableConnector);
registerConnector(stripeConnector);
registerConnector(webhookConnector);

/**
 * Load a connector by its type ID (e.g. 'gmail', 'slack').
 */
export function loadConnector(connectorTypeId: string): Connector {
  const connector = connectorRegistry.get(connectorTypeId);
  if (!connector) {
    throw new Error(`Unknown connector type: ${connectorTypeId}`);
  }
  return connector;
}

/**
 * Check if a connector type is registered.
 */
export function hasConnector(connectorTypeId: string): boolean {
  return connectorRegistry.has(connectorTypeId);
}

/**
 * Get all registered connector IDs.
 */
export function getRegisteredConnectors(): string[] {
  return Array.from(connectorRegistry.keys());
}
