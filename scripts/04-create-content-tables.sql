-- Migration: create categories and content tables for pages, news, services, products, highlights
-- Run in Supabase SQL editor

create extension if not exists pgcrypto;

create table if not exists categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  type text not null,
  description text,
  icon text,
  display_order integer default 0,
  created_at timestamptz default now()
);

-- Generic content tables used by the app. Each table references categories.
create table if not exists pages (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text not null unique,
  description text,
  content text,
  category_id uuid references categories(id) on delete set null,
  image_url text,
  is_published boolean default false,
  display_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists news (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text not null unique,
  description text,
  content text,
  category_id uuid references categories(id) on delete set null,
  image_url text,
  is_published boolean default false,
  display_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists services (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  description text,
  content text,
  category_id uuid references categories(id) on delete set null,
  image_url text,
  price numeric,
  is_published boolean default false,
  display_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  description text,
  content text,
  category_id uuid references categories(id) on delete set null,
  image_url text,
  price numeric,
  is_published boolean default false,
  display_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists highlights (
  id uuid default gen_random_uuid() primary key,
  title text,
  slug text not null unique,
  description text,
  content text,
  category_id uuid references categories(id) on delete set null,
  image_url text,
  featured boolean default false,
  is_published boolean default false,
  display_order integer default 0,
  created_at timestamptz default now()
);
