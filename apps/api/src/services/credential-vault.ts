import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
import { supabaseAdmin } from '../lib/supabase.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const hexKey = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!hexKey) {
    throw new Error('CREDENTIAL_ENCRYPTION_KEY env var is required');
  }
  const buf = Buffer.from(hexKey, 'hex');
  if (buf.length !== 32) {
    throw new Error('CREDENTIAL_ENCRYPTION_KEY must be a 32-byte hex string (64 chars)');
  }
  return buf;
}

function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Format: base64(iv + authTag + ciphertext)
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString('base64');
}

function decrypt(encoded: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(encoded, 'base64');

  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}

// ─── Public API ───────────────────────────────────────────────

export interface StoredCredential {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_at?: string;
  scope?: string;
  raw?: Record<string, unknown>;
}

/**
 * Encrypt and store credentials. Returns a vault ID.
 */
export async function storeCredential(
  orgId: string,
  connectorTypeId: string,
  credential: StoredCredential
): Promise<string> {
  const vaultId = randomBytes(16).toString('hex');
  const encryptedData = encrypt(JSON.stringify(credential));

  const { error } = await supabaseAdmin
    .from('connections')
    .upsert(
      {
        org_id: orgId,
        connector_type_id: connectorTypeId,
        credential_vault_id: vaultId,
        status: 'active',
        metadata: { encrypted_credentials: encryptedData },
        connected_at: new Date().toISOString(),
      },
      { onConflict: 'org_id,connector_type_id' }
    );

  if (error) {
    throw new Error(`Failed to store credential: ${error.message}`);
  }

  return vaultId;
}

/**
 * Retrieve and decrypt credentials by vault ID.
 */
export async function getCredential(vaultId: string): Promise<StoredCredential> {
  const { data, error } = await supabaseAdmin
    .from('connections')
    .select('metadata')
    .eq('credential_vault_id', vaultId)
    .single();

  if (error || !data) {
    throw new Error(`Credential not found for vault ID: ${vaultId}`);
  }

  const meta = data.metadata as Record<string, unknown> | null;
  const encryptedData = meta?.encrypted_credentials as string | undefined;
  if (!encryptedData) {
    throw new Error('No encrypted credentials found');
  }

  return JSON.parse(decrypt(encryptedData)) as StoredCredential;
}

/**
 * Update stored credentials (e.g. after token refresh).
 */
export async function updateCredential(
  vaultId: string,
  credential: StoredCredential
): Promise<void> {
  const encryptedData = encrypt(JSON.stringify(credential));

  const { error } = await supabaseAdmin
    .from('connections')
    .update({
      metadata: { encrypted_credentials: encryptedData },
    })
    .eq('credential_vault_id', vaultId);

  if (error) {
    throw new Error(`Failed to update credential: ${error.message}`);
  }
}

/**
 * Delete credentials and mark connection as revoked.
 */
export async function revokeCredential(connectionId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('connections')
    .update({
      status: 'revoked',
      metadata: {},
    })
    .eq('id', connectionId);

  if (error) {
    throw new Error(`Failed to revoke credential: ${error.message}`);
  }
}
