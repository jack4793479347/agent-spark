export interface MCPToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface Connector {
  id: string;
  name: string;
  description: string;
  authType: 'oauth2' | 'api_key' | 'webhook';
  category: string;
  icon: string;

  // Authentication
  getOAuthURL(orgId: string, redirectUri: string): string;
  handleOAuthCallback(code: string, orgId: string): Promise<{ credentialVaultId: string }>;
  refreshToken(credentialVaultId: string): Promise<void>;
  testConnection(credentialVaultId: string): Promise<boolean>;

  // MCP Tool Definitions
  getTools(): MCPToolDefinition[];

  // Execution (called by agent runtime)
  executeTool(
    toolName: string,
    params: Record<string, unknown>,
    credentialVaultId: string,
    executionContext?: { executionId: string; orgId: string; agentId: string }
  ): Promise<ToolResult>;
}

export interface ConnectorType {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  auth_type: 'oauth2' | 'api_key' | 'webhook';
  oauth_config?: Record<string, unknown>;
  category: string;
  is_active: boolean;
  created_at: string;
}

export interface Connection {
  id: string;
  org_id: string;
  connector_type_id: string;
  status: 'active' | 'expired' | 'revoked' | 'error';
  credential_vault_id: string;
  scopes?: string[];
  metadata?: Record<string, unknown>;
  connected_at: string;
  expires_at?: string;
  last_used_at?: string;
}
