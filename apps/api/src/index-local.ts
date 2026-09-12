import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from root directory
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import { getDatabase, getDatabaseMode, query, initDatabase } from "./db";
import { hashPassword, comparePassword, generateToken, verifyToken } from "./lib/auth";

// Initialize database with demo mode from env
const demoMode = process.env.DEMO_MODE === 'true';
initDatabase(demoMode);

// Fastify app
const app = Fastify({ logger: true });

// Plugins
app.register(cors, {
  origin: true, // Allow all origins for local development
  credentials: true,
});

app.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute",
});

// Auth middleware to verify JWT tokens
async function authMiddleware(req: any, reply: any) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'No token provided' });
    return;
  }
  
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  if (!decoded) {
    reply.code(401).send({ error: 'Invalid or expired token' });
    return;
  }
  
  // Verify user exists in database
  const users = await query('SELECT id, email, username FROM users WHERE id = ?', [decoded.userId]);
  if (users.length === 0) {
    reply.code(401).send({ error: 'User not found' });
    return;
  }
  
  req.user = users[0];
}

// Routes
app.get("/", async (request, reply) => {
  return { status: "ok", service: "drive-routes-api", mode: getDatabaseMode() };
});

// POST /auth/register - Register new user
app.post("/auth/register", async (request: any, reply) => {
  const { email, username, password } = request.body;
  
  // Validate input
  if (!email || !username || !password) {
    return reply.code(400).send({ error: "Email, username, and password are required" });
  }
  
  if (password.length < 8) {
    return reply.code(400).send({ error: "Password must be at least 8 characters" });
  }
  
  // Check if user already exists
  const existingUsers = await query(
    'SELECT id FROM users WHERE email = ? OR username = ?',
    [email, username]
  );
  
  if (existingUsers.length > 0) {
    return reply.code(409).send({ error: "User with this email or username already exists" });
  }
  
  // Hash password
  const passwordHash = await hashPassword(password);
  
  // Insert user
  const result = await query(
    'INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)',
    [email, username, passwordHash]
  );
  
  // Generate token
  const userId = result.lastID || result.insertId;
  const token = generateToken(String(userId), email);
  
  return { 
    message: "User registered successfully",
    token,
    user: { id: userId, email, username }
  };
});

// POST /auth/login - Login user
app.post("/auth/login", async (request: any, reply) => {
  const { email, password } = request.body;
  
  // Validate input
  if (!email || !password) {
    return reply.code(400).send({ error: "Email and password are required" });
  }
  
  // Find user
  const users = await query(
    'SELECT id, email, username, password_hash FROM users WHERE email = ?',
    [email]
  );
  
  if (users.length === 0) {
    return reply.code(401).send({ error: "Invalid email or password" });
  }
  
  const user = users[0];
  
  // Verify password
  const isValid = await comparePassword(password, user.password_hash);
  
  if (!isValid) {
    return reply.code(401).send({ error: "Invalid email or password" });
  }
  
  // Generate token
  const token = generateToken(String(user.id), user.email);
  
  return {
    message: "Login successful",
    token,
    user: { id: user.id, email: user.email, username: user.username }
  };
});

// GET roads with optional bbox filter
app.get("/roads", async (request, reply) => {
  const { bbox } = request.query as { bbox?: string };
  const mode = getDatabaseMode();
  
  let sql = `
    SELECT 
      id, name, description, rating_avg, rating_count,
      geometry, tags, countries, length_km, created_by, created_at
    FROM roads
  `;
  
  const params: any[] = [];
  
  if (mode === 'postgres' && bbox) {
    // Use PostGIS spatial query in production mode
    const [minLng, minLat, maxLng, maxLat] = bbox.split(",").map(Number);
    sql += ` WHERE ST_Intersects(geometry, ST_MakeEnvelope($1, $2, $3, $4, 4326))`;
    params.push(minLng, minLat, maxLng, maxLat);
  }
  
  sql += ` ORDER BY rating_avg DESC LIMIT 100`;
  
  const roads = await query(sql, params);
  
  return roads.map((road: any) => ({
    ...road,
    geometry: typeof road.geometry === 'string' ? JSON.parse(road.geometry) : road.geometry,
    tags: typeof road.tags === 'string' ? JSON.parse(road.tags) : road.tags,
    countries: typeof road.countries === 'string' ? JSON.parse(road.countries) : road.countries,
  }));
});

// GET road by ID
app.get("/roads/:id", async (request, reply) => {
  const { id } = request.params as { id: string };
  
  const roads = await query(
    `
    SELECT 
      id, name, description, rating_avg, rating_count,
      geometry, tags, countries, length_km, created_by, created_at
    FROM roads WHERE id = ?
    `,
    [id]
  );
  
  if (roads.length === 0) {
    return reply.code(404).send({ error: "Road not found" });
  }
  
  const road = roads[0];
  road.geometry = typeof road.geometry === 'string' ? JSON.parse(road.geometry) : road.geometry;
  road.tags = typeof road.tags === 'string' ? JSON.parse(road.tags) : road.tags;
  road.countries = typeof road.countries === 'string' ? JSON.parse(road.countries) : road.countries;
  
  return road;
});

// POST new road (requires auth)
app.post("/roads", { preHandler: authMiddleware }, async (request: any, reply) => {
  const { name, description, geometry, tags } = request.body;
  const user = request.user;
  
  // Validate route length - Google Maps supports up to 8 waypoints, Apple Maps up to 3
  // We'll allow routes up to 1000km to ensure they can be navigated
  const MAX_ROUTE_LENGTH_KM = 1000;
  
  // Calculate approximate length from geometry coordinates
  let estimatedLength = 0;
  if (geometry && geometry.coordinates && geometry.coordinates.length > 1) {
    for (let i = 1; i < geometry.coordinates.length; i++) {
      const [lng1, lat1] = geometry.coordinates[i - 1];
      const [lng2, lat2] = geometry.coordinates[i];
      // Haversine formula for distance calculation
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      estimatedLength += R * c;
    }
  }
  
  if (estimatedLength > MAX_ROUTE_LENGTH_KM) {
    return reply.code(400).send({ 
      error: "Route too long for navigation",
      message: `Route length (${estimatedLength.toFixed(1)} km) exceeds maximum of ${MAX_ROUTE_LENGTH_KM} km. Please split this route into multiple stages.`,
      estimatedLength,
      maxLength: MAX_ROUTE_LENGTH_KM
    });
  }
  
  // Simplified insert without PostGIS for demo mode
  const result = await query(
    `
    INSERT INTO roads (
      name, description, geometry, tags, length_km, created_by
    )
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [name, description, JSON.stringify(geometry), JSON.stringify(tags), estimatedLength, user.id]
  );
  
  return { id: (result as any).lastID, name, length_km: estimatedLength, created_at: new Date().toISOString() };
});

// POST GPX import (requires auth) - simplified for demo mode
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
    
    // Validate route length
    const MAX_ROUTE_LENGTH_KM = 1000;
    let estimatedLength = 0;
    if (line.coordinates && line.coordinates.length > 1) {
      for (let i = 1; i < line.coordinates.length; i++) {
        const [lng1, lat1] = line.coordinates[i - 1];
        const [lng2, lat2] = line.coordinates[i];
        // Haversine formula for distance calculation
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        estimatedLength += R * c;
      }
    }
    
    if (estimatedLength > MAX_ROUTE_LENGTH_KM) {
      return reply.code(400).send({ 
        error: "Route too long for navigation",
        message: `Route length (${estimatedLength.toFixed(1)} km) exceeds maximum of ${MAX_ROUTE_LENGTH_KM} km. Please split this route into multiple stages.`,
        estimatedLength,
        maxLength: MAX_ROUTE_LENGTH_KM
      });
    }
    
    // Simplified insert without PostGIS length calculation
    const result = await query(
      `
      INSERT INTO roads (
        name, geometry, tags, length_km, created_by
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [name, JSON.stringify(line), JSON.stringify(tags), estimatedLength, user.id]
    );
    
    return { id: (result as any).lastID, name, length_km: estimatedLength, created_at: new Date().toISOString() };
  } catch (error) {
    console.error("GPX import error:", error);
    return reply.code(500).send({ error: "Failed to process GPX file" });
  }
});

async function updateRoadStatsLocal(roadId: string) {
  const stats = await query(
    `SELECT AVG(score) as avg_score, COUNT(*) as count FROM reviews WHERE road_id = ?`,
    [roadId]
  );
  const avg = stats.length > 0 && stats[0].avg_score !== null ? Number(stats[0].avg_score) : 0;
  const count = stats.length > 0 ? Number(stats[0].count) : 0;
  await query(
    `UPDATE roads SET rating_avg = ?, rating_count = ? WHERE id = ?`,
    [avg, count, roadId]
  );
}

// GET reviews for a road with sorting
app.get("/roads/:id/reviews", async (request, reply) => {
  const { id } = request.params as { id: string };
  const { sort } = request.query as { sort?: string };
  
  let orderBy = 'r.created_at DESC';
  if (sort === 'score_asc') orderBy = 'r.score ASC';
  else if (sort === 'score_desc') orderBy = 'r.score DESC';
  else if (sort === 'recency_asc') orderBy = 'r.created_at ASC';
  else if (sort === 'recency_desc') orderBy = 'r.created_at DESC';
  
  const result = await query(
    `
    SELECT 
      r.id, r.user_id, r.road_id, r.score, r.text, r.created_at, r.updated_at,
      u.username
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.road_id = ?
    ORDER BY ${orderBy}
    `,
    [id]
  );
  
  return result.map((row: any) => ({
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

// POST review (requires auth)
app.post("/roads/:id/reviews", { preHandler: authMiddleware }, async (request: any, reply) => {
  const { id } = request.params as { id: string };
  const { score, text } = request.body;
  const user = request.user;
  
  if (score === undefined || score < 1 || score > 10) {
    return reply.code(400).send({ error: "Score must be between 1 and 10" });
  }

  const existing = await query('SELECT id FROM reviews WHERE user_id = ? AND road_id = ?', [user.id, id]);
  if (existing.length > 0) {
    return reply.code(400).send({ error: "You have already reviewed this road" });
  }

  const reviewId = Date.now().toString();
  const now = new Date().toISOString();
  await query(
    `INSERT INTO reviews (id, user_id, road_id, score, text, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [reviewId, user.id, id, score, text || '', now, now]
  );

  await updateRoadStatsLocal(id);
  return { id: reviewId, user_id: user.id, road_id: id, score, text, created_at: now, user: { id: user.id, username: user.username } };
});

// PUT review (requires auth, owner only)
app.put("/reviews/:id", { preHandler: authMiddleware }, async (request: any, reply) => {
  const { id } = request.params as { id: string };
  const { score, text } = request.body;
  const user = request.user;

  if (score !== undefined && (score < 1 || score > 10)) {
    return reply.code(400).send({ error: "Score must be between 1 and 10" });
  }

  const existing = await query('SELECT * FROM reviews WHERE id = ?', [id]);
  if (existing.length === 0) {
    return reply.code(404).send({ error: "Review not found" });
  }

  if (String(existing[0].user_id) !== String(user.id)) {
    return reply.code(403).send({ error: "You can only edit your own reviews" });
  }

  const newScore = score !== undefined ? score : existing[0].score;
  const newText = text !== undefined ? text : existing[0].text;
  const now = new Date().toISOString();

  await query(
    `UPDATE reviews SET score = ?, text = ?, updated_at = ? WHERE id = ?`,
    [newScore, newText, now, id]
  );

  await updateRoadStatsLocal(existing[0].road_id);
  return { id, user_id: user.id, road_id: existing[0].road_id, score: newScore, text: newText, updated_at: now, user: { id: user.id, username: user.username } };
});

// DELETE review (requires auth, owner only)
app.delete("/reviews/:id", { preHandler: authMiddleware }, async (request: any, reply) => {
  const { id } = request.params as { id: string };
  const user = request.user;

  const existing = await query('SELECT * FROM reviews WHERE id = ?', [id]);
  if (existing.length === 0) {
    return reply.code(404).send({ error: "Review not found" });
  }

  if (String(existing[0].user_id) !== String(user.id)) {
    return reply.code(403).send({ error: "You can only delete your own reviews" });
  }

  const roadId = existing[0].road_id;
  await query('DELETE FROM reviews WHERE id = ?', [id]);
  await updateRoadStatsLocal(roadId);

  return { success: true };
});

// POST /roads/:id/save - Save route
app.post("/roads/:id/save", { preHandler: authMiddleware }, async (request: any, reply) => {
  const { id } = request.params as { id: string };
  const user = request.user;

  const existingCollection = await query('SELECT id, road_ids FROM user_routes WHERE created_by = ? AND name = ?', [user.id, '__saved__']);
  let roadIds: string[] = [];
  if (existingCollection.length > 0) {
    roadIds = typeof existingCollection[0].road_ids === 'string' ? JSON.parse(existingCollection[0].road_ids) : (existingCollection[0].road_ids || []);
    if (!roadIds.includes(id)) {
      roadIds.push(id);
      await query('UPDATE user_routes SET road_ids = ? WHERE id = ?', [JSON.stringify(roadIds), existingCollection[0].id]);
      await query('UPDATE roads SET save_count = COALESCE(save_count, 0) + 1 WHERE id = ?', [id]);
    }
  } else {
    roadIds = [id];
    await query('INSERT INTO user_routes (name, road_ids, created_by, visibility) VALUES (?, ?, ?, ?)', ['__saved__', JSON.stringify(roadIds), user.id, 'private']);
    await query('UPDATE roads SET save_count = COALESCE(save_count, 0) + 1 WHERE id = ?', [id]);
  }

  return { success: true, saved: true };
});

// DELETE /roads/:id/save - Unsave route
app.delete("/roads/:id/save", { preHandler: authMiddleware }, async (request: any, reply) => {
  const { id } = request.params as { id: string };
  const user = request.user;

  const existingCollection = await query('SELECT id, road_ids FROM user_routes WHERE created_by = ? AND name = ?', [user.id, '__saved__']);
  if (existingCollection.length > 0) {
    let roadIds: string[] = typeof existingCollection[0].road_ids === 'string' ? JSON.parse(existingCollection[0].road_ids) : (existingCollection[0].road_ids || []);
    if (roadIds.includes(id)) {
      roadIds = roadIds.filter((r: string) => r !== id);
      await query('UPDATE user_routes SET road_ids = ? WHERE id = ?', [JSON.stringify(roadIds), existingCollection[0].id]);
      await query('UPDATE roads SET save_count = CASE WHEN save_count > 0 THEN save_count - 1 ELSE 0 END WHERE id = ?', [id]);
    }
  }

  return { success: true, saved: false };
});

// GET /user/saved-routes
app.get("/user/saved-routes", { preHandler: authMiddleware }, async (request: any, reply) => {
  const user = request.user;
  const existingCollection = await query('SELECT road_ids FROM user_routes WHERE created_by = ? AND name = ?', [user.id, '__saved__']);
  if (existingCollection.length === 0) return [];
  const roadIds: string[] = typeof existingCollection[0].road_ids === 'string' ? JSON.parse(existingCollection[0].road_ids) : (existingCollection[0].road_ids || []);
  return roadIds;
});

// GET /user/created-routes
app.get("/user/created-routes", { preHandler: authMiddleware }, async (request: any, reply) => {
  const user = request.user;
  const roads = await query('SELECT * FROM roads WHERE created_by = ? ORDER BY created_at DESC', [user.id]);
  return roads.map((road: any) => ({
    ...road,
    geometry: typeof road.geometry === 'string' ? JSON.parse(road.geometry) : road.geometry,
    tags: typeof road.tags === 'string' ? JSON.parse(road.tags) : road.tags,
    countries: typeof road.countries === 'string' ? JSON.parse(road.countries) : road.countries,
  }));
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
