-- Migration: Unified Content Structure
-- This migration creates a simplified, unifying table structure where:
-- - Categories contain their own content items
-- - Each content item tracks its last update time
-- - All content types are handled through a single, flexible table

-- Drop old tables if migrating (optional - comment out to preserve old data)
-- DROP TABLE IF EXISTS highlights CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS services CASCADE;
-- DROP TABLE IF EXISTS news CASCADE;
-- DROP TABLE IF EXISTS pages CASCADE;

-- Create unified categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create unified contents table
-- This single table replaces pages, news, services, products, highlights
CREATE TABLE IF NOT EXISTS contents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  content TEXT,
  image_url TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create unique constraint on (category_id, slug) to prevent duplicates within same category
ALTER TABLE contents ADD CONSTRAINT unique_content_per_category UNIQUE(category_id, slug);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contents_category_id ON contents(category_id);
CREATE INDEX IF NOT EXISTS idx_contents_slug ON contents(slug);
CREATE INDEX IF NOT EXISTS idx_contents_published ON contents(is_published);

-- Enable Row Level Security (optional - configure based on your needs)
-- ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
