-- ============================================================
-- Agent Spark — Knowledge Chunks + pgvector for RAG
-- ============================================================

-- Enable pgvector extension (Supabase has this built-in)
CREATE EXTENSION IF NOT EXISTS vector;

-- Knowledge chunks with embeddings
CREATE TABLE knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

  -- Source tracking
  source_filename TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,

  -- Content
  content TEXT NOT NULL,
  token_count INTEGER NOT NULL DEFAULT 0,

  -- Embedding (Voyage AI voyage-3-large = 1024 dimensions)
  embedding vector(1024),

  -- Optional metadata (page number, section heading, etc.)
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate chunks
  UNIQUE(agent_id, source_filename, chunk_index)
);

-- Vector similarity search index (cosine distance)
CREATE INDEX idx_chunks_embedding ON knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Fast lookup by agent
CREATE INDEX idx_chunks_agent ON knowledge_chunks(agent_id);

-- Fast lookup by agent + filename (for deletion on re-upload)
CREATE INDEX idx_chunks_agent_file ON knowledge_chunks(agent_id, source_filename);

-- RLS
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- Agent creators can manage their agent's chunks
CREATE POLICY "Creators can manage knowledge chunks"
  ON knowledge_chunks FOR ALL
  USING (agent_id IN (SELECT id FROM agents WHERE creator_id = auth.uid()));

-- Published agent chunks readable during execution (via service role)
CREATE POLICY "Service role full access"
  ON knowledge_chunks FOR ALL
  USING (true)
  WITH CHECK (true);

-- Helper function: search knowledge chunks by vector similarity
CREATE OR REPLACE FUNCTION search_knowledge_chunks(
  p_agent_id UUID,
  p_embedding vector(1024),
  p_limit INTEGER DEFAULT 8,
  p_threshold FLOAT DEFAULT 0.3
)
RETURNS TABLE(
  id UUID,
  content TEXT,
  source_filename TEXT,
  chunk_index INTEGER,
  token_count INTEGER,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.content,
    kc.source_filename,
    kc.chunk_index,
    kc.token_count,
    1 - (kc.embedding <=> p_embedding)::FLOAT AS similarity
  FROM knowledge_chunks kc
  WHERE kc.agent_id = p_agent_id
    AND kc.embedding IS NOT NULL
    AND 1 - (kc.embedding <=> p_embedding)::FLOAT > p_threshold
  ORDER BY kc.embedding <=> p_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
