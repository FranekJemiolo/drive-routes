-- Sample data for DriveRoutes

-- Insert sample roads
INSERT INTO roads (name, description, geometry, tags, country, region, length_km, rating_avg, rating_count, save_count) VALUES
('Alpine Pass Loop', 'A challenging mountain pass with hairpin turns and stunning alpine scenery', ST_GeomFromGeoJSON('{"type":"LineString","coordinates":[[11.0,47.0],[11.1,47.1],[11.2,47.2],[11.3,47.1],[11.4,47.0],[11.3,46.9],[11.2,46.8],[11.1,46.9],[11.0,47.0]]}'), ARRAY['mountain', 'twisty', 'scenic'], 'AT', 'Tyrol', ST_Length(ST_GeomFromGeoJSON('{"type":"LineString","coordinates":[[11.0,47.0],[11.1,47.1],[11.2,47.2],[11.3,47.1],[11.4,47.0],[11.3,46.9],[11.2,46.8],[11.1,46.9],[11.0,47.0]]}')::geography, true) / 1000, 7.5, 3, 12),

('Coastal Highway 1', 'Scenic coastal drive with ocean views and gentle curves', ST_GeomFromGeoJSON('{"type":"LineString","coordinates":[[-122.5,37.8],[-122.4,37.7],[-122.3,37.6],[-122.2,37.5],[-122.1,37.4]]}'), ARRAY['coastal', 'scenic', 'highway'], 'US', 'California', ST_Length(ST_GeomFromGeoJSON('{"type":"LineString","coordinates":[[-122.5,37.8],[-122.4,37.7],[-122.3,37.6],[-122.2,37.5],[-122.1,37.4]]}')::geography, true) / 1000, 8.2, 5, 23),

('Black Forest Twist', 'Dense forest roads with technical corners and elevation changes', ST_GeomFromGeoJSON('{"type":"LineString","coordinates":[[8.0,48.0],[8.1,48.1],[8.2,48.0],[8.3,48.1],[8.4,48.0],[8.5,47.9]]}'), ARRAY['forest', 'twisty', 'technical'], 'DE', 'Baden-Württemberg', ST_Length(ST_GeomFromGeoJSON('{"type":"LineString","coordinates":[[8.0,48.0],[8.1,48.1],[8.2,48.0],[8.3,48.1],[8.4,48.0],[8.5,47.9]]}')::geography, true) / 1000, 6.8, 2, 8)
ON CONFLICT DO NOTHING;

-- Insert sample users first
INSERT INTO users (id, username, email, reputation_score, onboarding_state, onboarding_step, preferences, stats) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'road_enthusiast', 'enthusiast@example.com', 7.5, 'completed', 3, '{"prefers_twisty": true, "prefers_scenic": true, "avoids_highways": false, "tags": ["mountain", "coastal"]}', '{"roads_rated": 15, "distance_driven_logged": 2500}'),
('550e8400-e29b-41d4-a716-446655440002', 'motorcycle_rider', 'rider@example.com', 8.2, 'completed', 3, '{"prefers_twisty": true, "prefers_scenic": false, "avoids_highways": true, "tags": ["twisty", "technical"]}', '{"roads_rated": 23, "distance_driven_logged": 4200}')
ON CONFLICT (id) DO NOTHING;

-- Insert sample reviews
INSERT INTO reviews (user_id, road_id, ratings, text) 
SELECT 
  u.id as user_id,
  r.id as road_id,
  '{"enjoyment": 8, "scenery": 9, "surface": 7, "traffic": 3}'::jsonb as ratings,
  'Amazing road with beautiful views and great corners!' as text
FROM roads r 
CROSS JOIN users u 
WHERE u.username = 'road_enthusiast'
LIMIT 3
ON CONFLICT DO NOTHING;
