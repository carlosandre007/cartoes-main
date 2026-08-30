-- Migration file for Supabase PostgreSQL Database Setup
-- Generated for Aureum Private Banking - Central Financial Flow Architecture

-- Execute the entire schema script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql

\i supabase-schema.sql
CREATE TABLE IF NOT EXISTS financial_ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  analysis TEXT NOT NULL,
  summary JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE financial_ai_analyses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own financial analyses" ON financial_ai_analyses;
CREATE POLICY "Users manage own financial analyses" ON financial_ai_analyses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS financial_ai_analyses_user_created_idx
  ON financial_ai_analyses(user_id, created_at DESC);
