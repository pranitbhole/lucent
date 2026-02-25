-- ============================================
-- Notion CMS - Database Schema
-- PostgreSQL
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL DEFAULT 'My Workspace',
  icon VARCHAR(10) DEFAULT '🗂️',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pages table
CREATE TABLE IF NOT EXISTS pages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES pages(id) ON DELETE CASCADE,
  title VARCHAR(500) DEFAULT 'Untitled',
  content TEXT DEFAULT '',
  emoji VARCHAR(10),
  cover_image VARCHAR(500),
  is_deleted BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'todo',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);