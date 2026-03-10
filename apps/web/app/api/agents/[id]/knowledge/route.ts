import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/supabase/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';

// ─── Text Chunking ──────────────────────────────────────────────

function chunkText(text: string, maxTokens = 500): string[] {
  // Rough estimate: 1 token ≈ 4 characters
  const maxChars = maxTokens * 4;
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    if (current.length + trimmed.length + 2 > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = '';
    }

    if (trimmed.length > maxChars) {
      // Split long paragraphs by sentences
      if (current) { chunks.push(current.trim()); current = ''; }
      const sentences = trimmed.match(/[^.!?]+[.!?]+/g) || [trimmed];
      let sentBuf = '';
      for (const s of sentences) {
        if (sentBuf.length + s.length > maxChars && sentBuf) {
          chunks.push(sentBuf.trim());
          sentBuf = '';
        }
        sentBuf += s;
      }
      if (sentBuf.trim()) current = sentBuf;
    } else {
      current += (current ? '\n\n' : '') + trimmed;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ─── Voyage AI Embeddings ───────────────────────────────────────

async function getEmbeddings(texts: string[]): Promise<number[][] | null> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'voyage-3-large',
        input: texts,
        input_type: 'document',
      }),
    });

    if (!res.ok) {
      console.error('Voyage API error:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    return data.data.map((d: { embedding: number[] }) => d.embedding);
  } catch (e) {
    console.error('Voyage embedding error:', e);
    return null;
  }
}

// ─── POST /api/agents/:id/knowledge — upload document ───────────

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getApiUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { filename, content } = await request.json();
  if (!filename || !content) {
    return NextResponse.json({ error: 'filename and content required' }, { status: 400 });
  }

  const sb = createAdminClient();

  // Verify agent ownership
  const { data: agent } = await sb
    .from('agents')
    .select('creator_id')
    .eq('id', params.id)
    .single();

  if (!agent || agent.creator_id !== auth.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Delete existing chunks for this filename (re-upload)
  await sb
    .from('knowledge_chunks')
    .delete()
    .eq('agent_id', params.id)
    .eq('source_filename', filename);

  // Chunk the content
  const chunks = chunkText(content);

  // Get embeddings (batch, max 128 per request)
  const batchSize = 128;
  const allEmbeddings: (number[] | null)[] = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const embeddings = await getEmbeddings(batch);
    if (embeddings) {
      allEmbeddings.push(...embeddings);
    } else {
      allEmbeddings.push(...batch.map(() => null));
    }
  }

  // Insert chunks
  const rows = chunks.map((chunk, i) => ({
    agent_id: params.id,
    source_filename: filename,
    chunk_index: i,
    content: chunk,
    token_count: estimateTokens(chunk),
    embedding: allEmbeddings[i] ? JSON.stringify(allEmbeddings[i]) : null,
  }));

  const { error } = await sb.from('knowledge_chunks').insert(rows);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const totalTokens = rows.reduce((sum, r) => sum + r.token_count, 0);

  return NextResponse.json({
    success: true,
    filename,
    chunks: chunks.length,
    tokens: totalTokens,
  });
}

// ─── GET /api/agents/:id/knowledge — get KB stats ───────────────

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getApiUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createAdminClient();

  const { data: chunks, error } = await sb
    .from('knowledge_chunks')
    .select('source_filename, token_count')
    .eq('agent_id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Aggregate by file
  const fileMap = new Map<string, { chunkCount: number; tokenCount: number }>();
  for (const c of chunks || []) {
    const existing = fileMap.get(c.source_filename) || { chunkCount: 0, tokenCount: 0 };
    existing.chunkCount++;
    existing.tokenCount += c.token_count;
    fileMap.set(c.source_filename, existing);
  }

  const files = Array.from(fileMap.entries()).map(([filename, stats]) => ({
    filename,
    ...stats,
  }));

  return NextResponse.json({
    totalChunks: chunks?.length || 0,
    totalTokens: (chunks || []).reduce((sum, c) => sum + c.token_count, 0),
    files,
  });
}

// ─── DELETE /api/agents/:id/knowledge — clear all KB ────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getApiUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createAdminClient();

  const { error } = await sb
    .from('knowledge_chunks')
    .delete()
    .eq('agent_id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
