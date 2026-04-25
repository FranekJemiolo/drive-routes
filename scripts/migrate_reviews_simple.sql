-- Migration: Simplify reviews from multi-dimensional ratings to single score
-- This migration transforms the existing reviews table structure

-- Step 1: Drop the existing trigger
DROP TRIGGER IF EXISTS trigger_update_road_stats ON reviews;
DROP FUNCTION IF EXISTS update_road_stats();

-- Step 2: Create a new reviews table with simplified structure
CREATE TABLE reviews_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    road_id UUID REFERENCES roads(id) NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
    text TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    UNIQUE(user_id, road_id)
);

-- Step 3: Migrate existing data (calculate average of multi-dimensional ratings)
INSERT INTO reviews_new (id, user_id, road_id, score, text, created_at)
SELECT 
    id,
    user_id,
    road_id,
    -- Calculate simple average from multi-dimensional ratings
    ROUND(
        (
            COALESCE((ratings->>'enjoyment')::numeric, 5) +
            COALESCE((ratings->>'scenery')::numeric, 5) +
            COALESCE((ratings->>'surface')::numeric, 5) +
            (10 - COALESCE((ratings->>'traffic')::numeric, 5))
        ) / 4
    )::integer as score,
    text,
    created_at
FROM reviews;

-- Step 4: Drop old table and rename new one
DROP TABLE reviews;
ALTER TABLE reviews_new RENAME TO reviews;

-- Step 5: Create indexes
CREATE INDEX idx_reviews_road_id ON reviews(road_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_score ON reviews(score);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);

-- Step 6: Create simplified trigger for road stats
CREATE OR REPLACE FUNCTION update_road_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE roads 
    SET 
        rating_avg = COALESCE(
            (SELECT AVG(score) FROM reviews WHERE road_id = NEW.road_id),
            0.0
        ),
        rating_count = (
            SELECT COUNT(*) FROM reviews WHERE road_id = NEW.road_id
        )
    WHERE id = NEW.road_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_road_stats
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_road_stats();

-- Step 7: Recalculate all road stats
UPDATE roads 
SET 
    rating_avg = COALESCE(
        (SELECT AVG(score) FROM reviews WHERE road_id = roads.id),
        0.0
    ),
    rating_count = (
        SELECT COUNT(*) FROM reviews WHERE road_id = roads.id
    );
