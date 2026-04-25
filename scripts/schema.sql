-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    reputation_score DECIMAL(3,2) DEFAULT 0.0,
    onboarding_state TEXT DEFAULT 'new' CHECK (onboarding_state IN ('new', 'welcome_seen', 'interests_selected', 'first_action_done', 'completed')),
    onboarding_step INTEGER DEFAULT 0,
    onboarding_completed_at TIMESTAMP,
    preferences JSONB DEFAULT '{"prefers_twisty": false, "prefers_scenic": false, "avoids_highways": false, "tags": []}',
    stats JSONB DEFAULT '{"roads_rated": 0, "distance_driven_logged": 0}',
    created_at TIMESTAMP DEFAULT now()
);

-- Roads table with PostGIS geometry
CREATE TABLE IF NOT EXISTS roads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    geometry GEOMETRY(LineString, 4326) NOT NULL,
    tags TEXT[] DEFAULT '{}',
    countries TEXT[] DEFAULT '{}',
    region VARCHAR(100),
    length_km DECIMAL(8,3),
    rating_avg DECIMAL(3,2) DEFAULT 0.0,
    rating_count INTEGER DEFAULT 0,
    save_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT now()
);

-- Spatial index for roads
CREATE INDEX IF NOT EXISTS idx_roads_geometry ON roads USING GIST (geometry);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    road_id UUID REFERENCES roads(id) NOT NULL,
    ratings JSONB NOT NULL,
    text TEXT,
    created_at TIMESTAMP DEFAULT now(),
    UNIQUE(user_id, road_id) -- One review per user per road
);

-- User routes (collections of roads)
CREATE TABLE IF NOT EXISTS user_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    road_ids UUID[] DEFAULT '{}',
    created_by UUID REFERENCES users(id) NOT NULL,
    visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'unlisted')),
    created_at TIMESTAMP DEFAULT now()
);

-- Events table for analytics
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    event TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT now()
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('car', 'motorcycle')),
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    power_hp INTEGER,
    drivetrain VARCHAR(10) CHECK (drivetrain IN ('FWD', 'RWD', 'AWD')),
    created_at TIMESTAMP DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_roads_rating ON roads(rating_avg DESC, save_count DESC);
CREATE INDEX IF NOT EXISTS idx_roads_created_by ON roads(created_by);
CREATE INDEX IF NOT EXISTS idx_reviews_road_id ON reviews(road_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_user_routes_created_by ON user_routes(created_by);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);

-- Full text search on road names and descriptions
CREATE INDEX IF NOT EXISTS idx_roads_search ON roads USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Trigger to update road stats when reviews are added
CREATE OR REPLACE FUNCTION update_road_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE roads 
    SET 
        rating_avg = (
            SELECT AVG(
                (ratings->>'enjoyment')::numeric + 
                (ratings->>'scenery')::numeric + 
                (ratings->>'surface')::numeric + 
                (10 - (ratings->>'traffic')::numeric)
            ) / 4
            FROM reviews WHERE road_id = NEW.road_id
        ),
        rating_count = (
            SELECT COUNT(*) FROM reviews WHERE road_id = NEW.road_id
        )
    WHERE id = NEW.road_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_road_stats
    AFTER INSERT OR UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_road_stats();
