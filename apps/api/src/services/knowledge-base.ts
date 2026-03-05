import { supabaseAdmin } from '../lib/supabase.js';

// ─── Configuration ───────────────────────────────────────────

const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings';
const VOYAGE_MODEL = 'voyage-3-large'; // 1024 dimensions
const CHUNK_SIZE = 800; // tokens (~3200 chars)
const CHUNK_OVERLAP = 150; // tokens (~600 chars)
const CHARS_PER_TOKEN = 4; // rough estimate
const MAX_EMBED_BATCH = 64; // Voyage batch limit

function getVoyageKey(): string {
  const key = process.env.VOYAGE_API_KEY;
  if (!key) throw new Error('VOYAGE_API_KEY is required for knowledge base operations');
  return key;
}

// ─── Text Chunking ───────────────────────────────────────────

interface Chunk {
  content: string;
  index: number;
  tokenCount: number;
}

/**
 * Split text into overlapping chunks. Tries to break on paragraph/sentence
 * boundaries for better semantic coherence.
 */
export function chunkText(text: string, filename: string): Chunk[] {
  const maxChars = CHUNK_SIZE * CHARS_PER_TOKEN;
  const overlapChars = CHUNK_OVERLAP * CHARS_PER_TOKEN;

  // Normalize whitespace
  const clean = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // If text fits in one chunk, return as-is
  if (clean.length <= maxChars) {
    return [{
      content: clean.trim(),
      index: 0,
      tokenCount: Math.ceil(clean.length / CHARS_PER_TOKEN),
    }];
  }

  const chunks: Chunk[] = [];
  let start = 0;
  let chunkIdx = 0;

  while (start < clean.length) {
    let end = Math.min(start + maxChars, clean.length);

    // Try to break at a paragraph boundary
    if (end < clean.length) {
      const paragraphBreak = clean.lastIndexOf('\n\n', end);
      if (paragraphBreak > start + maxChars * 0.3) {
        end = paragraphBreak + 2;
      } else {
        // Try sentence boundary
        const sentenceBreak = clean.lastIndexOf('. ', end);
        if (sentenceBreak > start + maxChars * 0.3) {
          end = sentenceBreak + 2;
        }
      }
    }

    const chunkContent = clean.slice(start, end).trim();
    if (chunkContent.length > 0) {
      chunks.push({
        content: chunkContent,
        index: chunkIdx,
        tokenCount: Math.ceil(chunkContent.length / CHARS_PER_TOKEN),
      });
      chunkIdx++;
    }

    // Move start forward with overlap
    start = end - overlapChars;
    if (start <= chunks[chunks.length - 1]?.content.length ? (end - maxChars) : start) {
      start = end; // Prevent infinite loop
    }
  }

  return chunks;
}

// ─── Embedding ───────────────────────────────────────────────

/**
 * Embed an array of texts using Voyage AI.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const results: number[][] = [];

  // Process in batches
  for (let i = 0; i < texts.length; i += MAX_EMBED_BATCH) {
    const batch = texts.slice(i, i + MAX_EMBED_BATCH);

    const res = await fetch(VOYAGE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getVoyageKey()}`,
      },
      body: JSON.stringify({
        model: VOYAGE_MODEL,
        input: batch,
        input_type: 'document',
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Voyage AI embedding failed: ${err}`);
    }

    const data = await res.json() as {
      data: Array<{ embedding: number[] }>;
    };

    results.push(...data.data.map((d) => d.embedding));
  }

  return results;
}

/**
 * Embed a single query for retrieval (uses input_type: 'query').
 */
export async function embedQuery(text: string): Promise<number[]> {
  const res = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getVoyageKey()}`,
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      input: [text],
      input_type: 'query',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Voyage AI query embedding failed: ${err}`);
  }

  const data = await res.json() as {
    data: Array<{ embedding: number[] }>;
  };

  return data.data[0].embedding;
}

// ─── Document Processing ─────────────────────────────────────

/**
 * Process a document: chunk, embed, store in knowledge_chunks table.
 * If the file already exists for this agent, it replaces the old chunks.
 */
export async function processDocument(
  agentId: string,
  filename: string,
  content: string
): Promise<{ chunkCount: number; totalTokens: number }> {
  // 1. Delete existing chunks for this file (re-upload replaces)
  await supabaseAdmin
    .from('knowledge_chunks')
    .delete()
    .eq('agent_id', agentId)
    .eq('source_filename', filename);

  // 2. Chunk the text
  const chunks = chunkText(content, filename);

  if (chunks.length === 0) {
    return { chunkCount: 0, totalTokens: 0 };
  }

  // 3. Embed all chunks
  const embeddings = await embedTexts(chunks.map((c) => c.content));

  // 4. Store in DB
  const rows = chunks.map((chunk, i) => ({
    agent_id: agentId,
    source_filename: filename,
    chunk_index: chunk.index,
    content: chunk.content,
    token_count: chunk.tokenCount,
    embedding: `[${embeddings[i].join(',')}]`,
    metadata: { filename },
  }));

  // Insert in batches of 100 (Supabase limit)
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const { error } = await supabaseAdmin
      .from('knowledge_chunks')
      .insert(batch);

    if (error) {
      throw new Error(`Failed to store knowledge chunks: ${error.message}`);
    }
  }

  const totalTokens = chunks.reduce((sum, c) => sum + c.tokenCount, 0);
  return { chunkCount: chunks.length, totalTokens };
}

/**
 * Delete all knowledge chunks for a specific file.
 */
export async function deleteDocument(agentId: string, filename: string): Promise<void> {
  await supabaseAdmin
    .from('knowledge_chunks')
    .delete()
    .eq('agent_id', agentId)
    .eq('source_filename', filename);
}

/**
 * Delete ALL knowledge chunks for an agent.
 */
export async function deleteAllDocuments(agentId: string): Promise<void> {
  await supabaseAdmin
    .from('knowledge_chunks')
    .delete()
    .eq('agent_id', agentId);
}

/**
 * Get knowledge base stats for an agent.
 */
export async function getKnowledgeBaseStats(agentId: string): Promise<{
  totalChunks: number;
  totalTokens: number;
  files: Array<{ filename: string; chunkCount: number; tokenCount: number }>;
}> {
  const { data: chunks } = await supabaseAdmin
    .from('knowledge_chunks')
    .select('source_filename, token_count')
    .eq('agent_id', agentId);

  if (!chunks || chunks.length === 0) {
    return { totalChunks: 0, totalTokens: 0, files: [] };
  }

  const fileMap = new Map<string, { chunkCount: number; tokenCount: number }>();
  let totalTokens = 0;

  for (const chunk of chunks) {
    const existing = fileMap.get(chunk.source_filename) ?? { chunkCount: 0, tokenCount: 0 };
    existing.chunkCount++;
    existing.tokenCount += chunk.token_count;
    totalTokens += chunk.token_count;
    fileMap.set(chunk.source_filename, existing);
  }

  return {
    totalChunks: chunks.length,
    totalTokens,
    files: Array.from(fileMap.entries()).map(([filename, stats]) => ({
      filename,
      ...stats,
    })),
  };
}

// ─── RAG Retrieval ───────────────────────────────────────────

/**
 * Retrieve relevant knowledge chunks for a query.
 * This is the core RAG function called at runtime.
 */
export async function retrieveContext(
  agentId: string,
  query: string,
  limit = 8,
  threshold = 0.3
): Promise<Array<{ content: string; filename: string; similarity: number }>> {
  // Check if agent has any knowledge chunks first
  const { count } = await supabaseAdmin
    .from('knowledge_chunks')
    .select('id', { count: 'exact', head: true })
    .eq('agent_id', agentId);

  if (!count || count === 0) {
    return [];
  }

  // Embed the query
  const queryEmbedding = await embedQuery(query);

  // Use the Supabase RPC function for vector similarity search
  const { data, error } = await supabaseAdmin.rpc('search_knowledge_chunks', {
    p_agent_id: agentId,
    p_embedding: `[${queryEmbedding.join(',')}]`,
    p_limit: limit,
    p_threshold: threshold,
  });

  if (error) {
    console.error('RAG retrieval error:', error.message);
    return [];
  }

  return (data ?? []).map((row: { content: string; source_filename: string; similarity: number }) => ({
    content: row.content,
    filename: row.source_filename,
    similarity: row.similarity,
  }));
}

/**
 * Build a RAG-augmented system prompt.
 * Injects relevant knowledge chunks into the agent's base system prompt.
 */
export async function buildRAGSystemPrompt(
  baseSystemPrompt: string,
  agentId: string,
  userQuery: string
): Promise<string> {
  const chunks = await retrieveContext(agentId, userQuery);

  if (chunks.length === 0) {
    return baseSystemPrompt;
  }

  const contextBlock = chunks
    .map((c, i) => `[Source: ${c.filename} | Relevance: ${(c.similarity * 100).toFixed(0)}%]\n${c.content}`)
    .join('\n\n---\n\n');

  return `${baseSystemPrompt}

---

# Retrieved Knowledge Base Context

The following excerpts were retrieved from your knowledge base based on the user's query. Use this information to provide accurate, grounded responses. If the knowledge base doesn't contain relevant information, say so rather than making things up.

${contextBlock}`;
}
