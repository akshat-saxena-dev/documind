-- Migration: Allow duplicate document uploads
-- Removes the global unique constraint on documents.content_hash
-- and ensures a standard index exists on content_hash for query performance.

ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_content_hash_key;
CREATE INDEX IF NOT EXISTS idx_documents_content_hash ON documents(content_hash);
