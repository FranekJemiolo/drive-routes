import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from root directory
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import { getDatabase, getDatabaseMode, query, initDatabase } from "./db";

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

// Mock auth middleware for local development
async function authMiddleware(req: any, reply: any) {
  // For local development, we'll use a mock user
  req.user = {
    id: 1,
    username: "local_dev_user",
    email: "dev@localhost"
  };
}

// Routes
app.get("/", async (request, reply) => {
  return { status: "ok", service: "drive-routes-api", mode: getDatabaseMode() };
});

// GET roads with optional bbox filter
app.get("/roads", async (request, reply) => {
  const { bbox } = request.query as { bbox?: string };
  const mode = getDatabaseMode();
  
  let sql = `
    SELECT 
      id, name, description, rating_avg, rating_count,
      geometry, tags, length_km, created_by, created_at
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
      geometry, tags, length_km, created_by, created_at
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

// GET reviews for a road
app.get("/reviews", async (request, reply) => {
  const { road_id } = request.query as { road_id?: string };
  
  let sql = `
    SELECT r.*, u.name as username
    FROM reviews r
    JOIN users u ON r.user_id = u.id
  `;
  
  const params: any[] = [];
  
  if (road_id) {
    sql += ` WHERE r.road_id = ?`;
    params.push(road_id);
  }
  
  sql += ` ORDER BY r.created_at DESC`;
  
  const result = await query(sql, params);
  return result;
});

// POST review (requires auth) - simplified for demo mode
app.post("/reviews", { preHandler: authMiddleware }, async (request: any, reply) => {
  const { road_id, rating, comment } = request.body;
  const user = request.user;
  
  const result = await query(
    `
    INSERT INTO reviews (user_id, road_id, rating, comment)
    VALUES (?, ?, ?, ?)
    `,
    [user.id, road_id, rating, comment]
  );
  
  // Simplified rating update for demo mode
  const avgResult = await query(
    `
    SELECT AVG(rating) as avg_rating, COUNT(*) as count
    FROM reviews WHERE road_id = ?
    `,
    [road_id]
  );
  
  const avg = avgResult[0];
  await query(
    `
    UPDATE roads 
    SET rating_avg = ?, rating_count = ?
    WHERE id = ?
    `,
    [avg.avg_rating, avg.count, road_id]
  );
  
  return { id: (result as any).lastID, created_at: new Date().toISOString() };
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
