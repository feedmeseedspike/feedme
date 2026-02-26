-- Migration: Create cron_runs table for durable cron run logging
-- Run this on your Supabase/Postgres instance (psql or Supabase SQL editor)
-- Ensure pgcrypto for gen_random_uuid() exists (Supabase provides this extension)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS cron_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL,
  trigger text,
  sent_count integer DEFAULT 0,
  total_candidates integer DEFAULT 0,
  error_message text
);
-- Optional index for querying recent runs
CREATE INDEX IF NOT EXISTS idx_cron_runs_started_at ON cron_runs (started_at DESC);