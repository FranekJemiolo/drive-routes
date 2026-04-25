import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { Pool } from "pg";
import { createClient } from "@supabase/supabase-js";

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Supabase client for auth
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Fastify app
const app = Fastify({ logger: true });

// Plugins
app.register(cors, {
  origin: ["http://localhost:3000", "https://yourdomain.com"],
});

app.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute",
});

// Auth middleware
async function authMiddleware(req: any, reply: any) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return reply.code(401).send({ error: "Missing token" });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return reply.code(401).send({ error: "Invalid token" });
  }

  req.user = data.user;
}

// Routes
app.get("/", async (request, reply) => {
  return { status: "ok", service: "drive-routes-api" };
});

// GET roads with optional bbox filter
app.get("/roads", async (request, reply) => {
  const { bbox } = request.query as { bbox?: string };
  
  let query = `
    SELECT 
      id, name, description, rating_avg, rating_count, save_count,
      ST_AsGeoJSON(geometry) as geometry,
      tags, country, region, length_km, created_by, created_at
    FROM roads
  `;
  
  const params: any[] = [];
  
  if (bbox) {
    const [minLng, minLat, maxLng, maxLat] = bbox.split(",").map(Number);
    query += ` WHERE ST_Intersects(geometry, ST_MakeEnvelope($1, $2, $3, $4, 4326))`;
    params.push(minLng, minLat, maxLng, maxLat);
  }
  
  query += ` ORDER BY rating_avg DESC, save_count DESC LIMIT 100`;
  
  const result = await pool.query(query, params);
  
  const roads = result.rows.map(row => ({
    ...row,
    geometry: JSON.parse(row.geometry),
  }));
  
  return roads;
});

// GET road by ID
app.get("/roads/:id", async (request, reply) => {
  const { id } = request.params as { id: string };
  
  const result = await pool.query(
    `
    SELECT 
      id, name, description, rating_avg, rating_count, save_count,
      ST_AsGeoJSON(geometry) as geometry,
      tags, country, region, length_km, created_by, created_at
    FROM roads WHERE id = $1
    `,
    [id]
  );
  
  if (result.rows.length === 0) {
    return reply.code(404).send({ error: "Road not found" });
  }
  
  const road = result.rows[0];
  road.geometry = JSON.parse(road.geometry);
  
  return road;
});

// POST new road (requires auth)
app.post("/roads", { preHandler: authMiddleware }, async (request: any, reply) => {
  const { name, description, geometry, tags, country, region } = request.body;
  
  const user = request.user;
  
  // Calculate length from geometry
  const result = await pool.query(
    `
    INSERT INTO roads (
      name, description, geometry, tags, country, region, 
      length_km, created_by
    )
    VALUES (
      $1, $2, ST_GeomFromGeoJSON($3), $4, $5, $6,
      ST_Length(ST_GeomFromGeoJSON($3)::geography, true) / 1000, $7
    )
    RETURNING id, name, created_at
    `,
    [name, description, JSON.stringify(geometry), tags, country, region, user.id]
  );
  
  return result.rows[0];
});

// POST GPX import (requires auth)
app.post("/roads/import-gpx", { preHandler: authMiddleware }, async (request: any, reply) => {
  const { gpxText, name, tags } = request.body;
  const user = request.user;
  
  try {
    // Parse GPX and convert to GeoJSON
    const { DOMParser } = await import("xmldom");
    const toGeoJSON = await import("@tmcw/togeojson");
    
    const parser = new DOMParser();
    const gpx = parser.parseFromString(gpxText, "text/xml");
    const geo = toGeoJSON.gpx(gpx);
    
    if (!geo.features || geo.features.length === 0) {
      return reply.code(400).send({ error: "Invalid GPX file" });
    }
    
    const line = geo.features[0].geometry;
    if (line.type !== "LineString") {
      return reply.code(400).send({ error: "GPX must contain track data" });
    }
    
    // Create road from GPX
    const result = await pool.query(
      `
      INSERT INTO roads (
        name, geometry, tags, country, region,
        length_km, created_by
      )
      VALUES (
        $1, ST_GeomFromGeoJSON($2), $3, 'Imported', 'GPX',
        ST_Length(ST_GeomFromGeoJSON($2)::geography, true) / 1000, $4
      )
      RETURNING id, name, created_at
      `,
      [name, JSON.stringify(line), tags, user.id]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error("GPX import error:", error);
    return reply.code(500).send({ error: "Failed to process GPX file" });
  }
});

// GET reviews for a road with sorting
app.get("/roads/:id/reviews", async (request, reply) => {
  const { id } = request.params as { id: string };
  const { sort } = request.query as { sort?: string };
  
  let orderBy = 'r.created_at DESC';
  if (sort === 'score_asc') orderBy = 'r.score ASC';
  else if (sort === 'score_desc') orderBy = 'r.score DESC';
  else if (sort === 'recency_asc') orderBy = 'r.created_at ASC';
  else if (sort === 'recency_desc') orderBy = 'r.created_at DESC';
  
  const result = await pool.query(
    `
    SELECT 
      r.id, r.user_id, r.road_id, r.score, r.text, r.created_at, r.updated_at,
      u.id as user_id, u.username
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.road_id = $1
    ORDER BY ${orderBy}
    `,
    [id]
  );
  
  return result.rows.map(row => ({
    id: row.id,
    user_id: row.user_id,
    road_id: row.road_id,
    score: row.score,
    text: row.text,
    created_at: row.created_at,
    updated_at: row.updated_at,
    user: {
      id: row.user_id,
      username: row.username
    }
  }));
});

// POST review for a road (requires auth)
app.post("/roads/:id/reviews", { preHandler: authMiddleware }, async (request: any, reply) => {
  const { id } = request.params as { id: string };
  const { score, text } = request.body;
  const user = request.user;
  
  // Validate score range
  if (score < 1 || score > 10) {
    return reply.code(400).send({ error: "Score must be between 1 and 10" });
  }
  
  try {
    const result = await pool.query(
      `
      INSERT INTO reviews (user_id, road_id, score, text)
      VALUES ($1, $2, $3, $4)
      RETURNING id, created_at
      `,
      [user.id, id, score, text]
    );
    
    return result.rows[0];
  } catch (error: any) {
    if (error.code === '23505') { // Unique violation
      return reply.code(400).send({ error: "You have already reviewed this road" });
    }
    throw error;
  }
});

// PUT review (requires auth, owner only)
app.put("/reviews/:id", { preHandler: authMiddleware }, async (request: any, reply) => {
  const { id } = request.params as { id: string };
  const { score, text } = request.body;
  const user = request.user;
  
  // Validate score range if provided
  if (score !== undefined && (score < 1 || score > 10)) {
    return reply.code(400).send({ error: "Score must be between 1 and 10" });
  }
  
  // Check ownership
  const existing = await pool.query(
    "SELECT user_id FROM reviews WHERE id = $1",
    [id]
  );
  
  if (existing.rows.length === 0) {
    return reply.code(404).send({ error: "Review not found" });
  }
  
  if (existing.rows[0].user_id !== user.id) {
    return reply.code(403).send({ error: "You can only edit your own reviews" });
  }
  
  const result = await pool.query(
    `
    UPDATE reviews
    SET score = COALESCE($1, score),
        text = COALESCE($2, text),
        updated_at = NOW()
    WHERE id = $3
    RETURNING id, created_at, updated_at
    `,
    [score, text, id]
  );
  
  return result.rows[0];
});

// DELETE review (requires auth, owner only)
app.delete("/reviews/:id", { preHandler: authMiddleware }, async (request: any, reply) => {
  const { id } = request.params as { id: string };
  const user = request.user;
  
  // Check ownership
  const existing = await pool.query(
    "SELECT user_id FROM reviews WHERE id = $1",
    [id]
  );
  
  if (existing.rows.length === 0) {
    return reply.code(404).send({ error: "Review not found" });
  }
  
  if (existing.rows[0].user_id !== user.id) {
    return reply.code(403).send({ error: "You can only delete your own reviews" });
  }
  
  await pool.query("DELETE FROM reviews WHERE id = $1", [id]);
  
  return { success: true };
});

// Start server
const start = async () => {
  try {
    await app.listen({ port: 3001, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
