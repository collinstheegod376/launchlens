-- LaunchLens Supabase Database Schema

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tokens table
CREATE TABLE IF NOT EXISTS tokens (
  mint TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  decimals INT NOT NULL DEFAULT 9,
  token_program TEXT NOT NULL DEFAULT 'spl-token',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mint TEXT NOT NULL REFERENCES tokens(mint) ON DELETE CASCADE,
  risk_score INT NOT NULL,
  risk_level TEXT NOT NULL,
  ai_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Snapshots table (for historical metric trends & analytics)
CREATE TABLE IF NOT EXISTS snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  mint TEXT NOT NULL REFERENCES tokens(mint) ON DELETE CASCADE,
  total_supply NUMERIC NOT NULL,
  circulating_supply NUMERIC NOT NULL,
  burned_supply_pct NUMERIC NOT NULL,
  top10_concentration_pct NUMERIC NOT NULL,
  top20_concentration_pct NUMERIC NOT NULL,
  total_liquidity_usd NUMERIC NOT NULL,
  total_volume_24h NUMERIC NOT NULL,
  highest_pool_address TEXT,
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Findings table (individual risk rules triggered)
CREATE TABLE IF NOT EXISTS findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  mint TEXT NOT NULL REFERENCES tokens(mint) ON DELETE CASCADE,
  rule_id TEXT NOT NULL,
  title TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT,
  evidence TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_tokens_symbol ON tokens(symbol);
CREATE INDEX IF NOT EXISTS idx_reports_mint ON reports(mint);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_mint ON snapshots(mint);
CREATE INDEX IF NOT EXISTS idx_snapshots_created_at ON snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_findings_report_id ON findings(report_id);
CREATE INDEX IF NOT EXISTS idx_findings_rule_id ON findings(rule_id);
