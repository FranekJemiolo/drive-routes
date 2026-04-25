-- SQLite Schema for DriveRoutes
-- This is a simplified version for local development/testing

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    reputation_score REAL DEFAULT 0.0,
    onboarding_state TEXT DEFAULT 'new' CHECK (onboarding_state IN ('new', 'welcome_seen', 'interests_selected', 'first_action_done', 'completed')),
    onboarding_step INTEGER DEFAULT 0,
    onboarding_completed_at TEXT,
    preferences TEXT DEFAULT '{"prefers_twisty": false, "prefers_scenic": false, "avoids_highways": false, "tags": []}',
    stats TEXT DEFAULT '{"roads_rated": 0, "distance_driven_logged": 0}',
    created_at TEXT DEFAULT (datetime('now'))
);

-- Roads table
CREATE TABLE IF NOT EXISTS roads (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    description TEXT,
    geometry TEXT NOT NULL, -- JSON string for LineString coordinates
    tags TEXT DEFAULT '[]', -- JSON array
    countries TEXT DEFAULT '[]', -- JSON array
    region TEXT,
    length_km REAL,
    rating_avg REAL DEFAULT 0.0,
    rating_count INTEGER DEFAULT 0,
    save_count INTEGER DEFAULT 0,
    created_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Reviews table with simplified single score
CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    road_id TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
    text TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, road_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (road_id) REFERENCES roads(id)
);

-- User routes (collections of roads)
CREATE TABLE IF NOT EXISTS user_routes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    road_ids TEXT DEFAULT '[]', -- JSON array
    created_by TEXT NOT NULL,
    visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'unlisted')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Events table for analytics
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT,
    event TEXT NOT NULL,
    metadata TEXT DEFAULT '{}', -- JSON object
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    type TEXT CHECK (type IN ('car', 'motorcycle')),
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    power_hp INTEGER,
    drivetrain TEXT CHECK (drivetrain IN ('FWD', 'RWD', 'AWD')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_roads_rating ON roads(rating_avg DESC, save_count DESC);
CREATE INDEX IF NOT EXISTS idx_roads_created_by ON roads(created_by);
CREATE INDEX IF NOT EXISTS idx_reviews_road_id ON reviews(road_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_score ON reviews(score);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_routes_created_by ON user_routes(created_by);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
