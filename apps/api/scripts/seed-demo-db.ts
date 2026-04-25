import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

async function seedDemoDb() {
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  // Drop tables if they exist
  db.run(`DROP TABLE IF EXISTS reviews`);
  db.run(`DROP TABLE IF EXISTS roads`);
  db.run(`DROP TABLE IF EXISTS users`);

  // Create tables
  db.run(`CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE roads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    geometry TEXT NOT NULL,
    length_km REAL,
    rating_avg REAL DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    tags TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    road_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (road_id) REFERENCES roads(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(road_id, user_id)
  )`);

  // Insert sample users
  db.run(`INSERT OR IGNORE INTO users (email, name) VALUES ('demo@example.com', 'Demo User')`);
  db.run(`INSERT OR IGNORE INTO users (email, name) VALUES ('driver@example.com', 'Road Enthusiast')`);
  db.run(`INSERT OR IGNORE INTO users (email, name) VALUES ('motorcycle@example.com', 'Biker')`);

  // Insert sample roads with famous driving routes
  const sampleRoads = [
    {
      name: "Pacific Coast Highway",
      description: "Iconic coastal route with stunning ocean views",
      geometry: JSON.stringify({
        type: "LineString",
        coordinates: [[-122.4194, 37.7749], [-122.4783, 37.8199], [-122.5110, 37.7749]]
      }),
      length_km: 120.7,
      rating_avg: 9.2,
      rating_count: 156,
      tags: JSON.stringify(["scenic", "coastal", "curves"]),
      created_by: 1
    },
    {
      name: "Tail of the Dragon",
      description: "318 curves in 11 miles - a legendary motorcycle road",
      geometry: JSON.stringify({
        type: "LineString",
        coordinates: [[-83.9217, 35.7600], [-83.9150, 35.7650], [-83.9080, 35.7700]]
      }),
      length_km: 17.7,
      rating_avg: 9.8,
      rating_count: 342,
      tags: JSON.stringify(["motorcycle", "curves", "challenging"]),
      created_by: 2
    },
    {
      name: "Blue Ridge Parkway",
      description: "America's favorite drive through the Appalachian Mountains",
      geometry: JSON.stringify({
        type: "LineString",
        coordinates: [[-81.6789, 35.2271], [-81.5900, 35.2800], [-81.5000, 35.3300]]
      }),
      length_km: 755.0,
      rating_avg: 9.5,
      rating_count: 289,
      tags: JSON.stringify(["scenic", "mountains", "long-distance"]),
      created_by: 1
    },
    {
      name: "Stelvio Pass",
      description: "One of the most spectacular mountain roads in the world",
      geometry: JSON.stringify({
        type: "LineString",
        coordinates: [[10.4244, 46.5215], [10.4350, 46.5300], [10.4450, 46.5400]]
      }),
      length_km: 24.0,
      rating_avg: 9.9,
      rating_count: 445,
      tags: JSON.stringify(["mountain", "hairpin", "europe"]),
      created_by: 3
    },
    {
      name: "Route 66",
      description: "The most famous road in America",
      geometry: JSON.stringify({
        type: "LineString",
        coordinates: [[-87.6298, 41.8781], [-96.7970, 32.7767], [-118.2437, 34.0522]]
      }),
      length_km: 3940.0,
      rating_avg: 8.5,
      rating_count: 567,
      tags: JSON.stringify(["historic", "long-distance", "iconic"]),
      created_by: 1
    },
    {
      name: "Nürburgring Nordschleife",
      description: "The legendary German race track open to the public",
      geometry: JSON.stringify({
        type: "LineString",
        coordinates: [[6.9393, 50.3300], [6.9500, 50.3400], [6.9600, 50.3500]]
      }),
      length_km: 20.8,
      rating_avg: 9.7,
      rating_count: 623,
      tags: JSON.stringify(["race-track", "germany", "legendary"]),
      created_by: 2
    },
    {
      name: "Great Ocean Road",
      description: "Australian coastal drive with limestone formations",
      geometry: JSON.stringify({
        type: "LineString",
        coordinates: [[144.2867, -38.2332], [144.3500, -38.2000], [144.4000, -38.1800]]
      }),
      length_km: 243.0,
      rating_avg: 9.3,
      rating_count: 234,
      tags: JSON.stringify(["coastal", "australia", "scenic"]),
      created_by: 3
    },
    {
      name: "Amalfi Coast Drive",
      description: "Stunning Italian coastal road with cliffside views",
      geometry: JSON.stringify({
        type: "LineString",
        coordinates: [[14.6029, 40.6330], [14.6200, 40.6400], [14.6400, 40.6500]]
      }),
      length_km: 50.0,
      rating_avg: 9.4,
      rating_count: 312,
      tags: JSON.stringify(["coastal", "italy", "scenic"]),
      created_by: 1
    }
  ];

  sampleRoads.forEach(road => {
    const escapedName = road.name.replace(/'/g, "''");
    const escapedDesc = road.description.replace(/'/g, "''");
    const escapedGeom = road.geometry.replace(/'/g, "''");
    const escapedTags = road.tags.replace(/'/g, "''");
    const sql = `INSERT INTO roads (name, description, geometry, length_km, rating_avg, rating_count, tags, created_by) VALUES ('${escapedName}', '${escapedDesc}', '${escapedGeom}', ${road.length_km}, ${road.rating_avg}, ${road.rating_count}, '${escapedTags}', ${road.created_by})`;
    db.run(sql);
  });

  // Insert sample reviews
  const insertReview = db.prepare(`
    INSERT OR IGNORE INTO reviews (road_id, user_id, rating, comment)
    VALUES (?, ?, ?, ?)
  `);

  const sampleReviews = [
    { road_id: 1, user_id: 1, rating: 9, comment: "Absolutely breathtaking views!" },
    { road_id: 1, user_id: 2, rating: 10, comment: "Perfect for a Sunday drive" },
    { road_id: 2, user_id: 3, rating: 10, comment: "Best motorcycle road ever" },
    { road_id: 2, user_id: 1, rating: 9, comment: "Challenging but rewarding" },
    { road_id: 3, user_id: 2, rating: 9, comment: "Beautiful mountain scenery" },
    { road_id: 4, user_id: 3, rating: 10, comment: "Unforgettable experience" },
    { road_id: 5, user_id: 1, rating: 8, comment: "Classic American road trip" },
    { road_id: 6, user_id: 2, rating: 10, comment: "Every car enthusiast's dream" }
  ];

  sampleReviews.forEach(review => {
    insertReview.run(review.road_id, review.user_id, review.rating, review.comment);
  });

  // Export database to binary file
  const data = db.export();
  const buffer = Buffer.from(data);
  const dbPath = path.join(__dirname, '../../demo.db');
  fs.writeFileSync(dbPath, buffer);

  console.log('✓ Demo database seeded successfully');
  console.log(`✓ Created ${sampleRoads.length} sample roads`);
  console.log(`✓ Created ${sampleReviews.length} sample reviews`);
  console.log(`✓ Database saved to ${dbPath}`);

  db.close();
}

seedDemoDb().catch(console.error);
