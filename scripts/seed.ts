import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const sampleRoads = [
  {
    name: "Alpine Pass Loop",
    description: "A challenging mountain pass with hairpin turns and stunning alpine scenery",
    geometry: {
      type: "LineString",
      coordinates: [
        [11.0, 47.0], [11.1, 47.1], [11.2, 47.2], [11.3, 47.1], [11.4, 47.0], [11.3, 46.9], [11.2, 46.8], [11.1, 46.9], [11.0, 47.0]
      ]
    },
    tags: ["mountain", "twisty", "scenic"],
    country: "AT",
    region: "Tyrol"
  },
  {
    name: "Coastal Highway 1",
    description: "Scenic coastal drive with ocean views and gentle curves",
    geometry: {
      type: "LineString",
      coordinates: [
        [-122.5, 37.8], [-122.4, 37.7], [-122.3, 37.6], [-122.2, 37.5], [-122.1, 37.4]
      ]
    },
    tags: ["coastal", "scenic", "highway"],
    country: "US",
    region: "California"
  },
  {
    name: "Black Forest Twist",
    description: "Dense forest roads with technical corners and elevation changes",
    geometry: {
      type: "LineString",
      coordinates: [
        [8.0, 48.0], [8.1, 48.1], [8.2, 48.0], [8.3, 48.1], [8.4, 48.0], [8.5, 47.9]
      ]
    },
    tags: ["forest", "twisty", "technical"],
    country: "DE",
    region: "Baden-Württemberg"
  }
];

async function seed() {
  console.log("Seeding database...");

  try {
    // Insert sample roads
    for (const road of sampleRoads) {
      await pool.query(
        `
        INSERT INTO roads (name, description, geometry, tags, country, region, length_km, rating_avg, rating_count, save_count)
        VALUES (
          $1, $2, ST_GeomFromGeoJSON($3), $4, $5, $6,
          ST_Length(ST_GeomFromGeoJSON($3)::geography, true) / 1000,
          7.5, 3, 12
        )
        ON CONFLICT DO NOTHING
        `,
        [
          road.name,
          road.description,
          JSON.stringify(road.geometry),
          road.tags,
          road.country,
          road.region
        ]
      );
    }

    // Insert sample reviews
    const roads = await pool.query("SELECT id FROM roads LIMIT 3");
    
    for (let i = 0; i < Math.min(roads.rows.length, 3); i++) {
      const roadId = roads.rows[i].id;
      
      await pool.query(
        `
        INSERT INTO reviews (user_id, road_id, ratings, text)
        VALUES (
          gen_random_uuid(), $1,
          '{"enjoyment": 8, "scenery": 9, "surface": 7, "traffic": 3}',
          'Amazing road with beautiful views and great corners!'
        )
        ON CONFLICT DO NOTHING
        `,
        [roadId]
      );
    }

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await pool.end();
  }
}

seed();
