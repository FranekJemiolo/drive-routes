import { Road, Review, User, UserRoute } from "../types";
import { showToast } from "../components/ui/toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Demo data for GitHub Pages static deployment
const DEMO_ROADS: Road[] = [
  {
    id: "1",
    name: "Pacific Coast Highway",
    description: "Iconic coastal route with stunning ocean views",
    geometry: {
      type: "LineString",
      coordinates: [[-122.4194, 37.7749], [-122.4783, 37.8199], [-122.5110, 37.7749]]
    },
    length_km: 120.7,
    rating_avg: 9.2,
    rating_count: 156,
    save_count: 89,
    tags: ["scenic", "coastal", "curves"],
    countries: ["USA"],
    region: "California",
    created_by: "1",
    created_at: new Date().toISOString()
  },
  {
    id: "2",
    name: "Stelvio Pass",
    description: "One of the most challenging and beautiful mountain passes in the Alps",
    geometry: {
      type: "LineString",
      coordinates: [[10.4256, 46.5256], [10.4489, 46.5156], [10.4756, 46.5056]]
    },
    length_km: 75.5,
    rating_avg: 9.5,
    rating_count: 234,
    save_count: 156,
    tags: ["mountain", "curves", "scenic"],
    countries: ["Italy"],
    region: "Alps",
    created_by: "1",
    created_at: new Date().toISOString()
  },
  {
    id: "3",
    name: "Transfăgărășan",
    description: "Romania's most spectacular road through the Făgăraș Mountains",
    geometry: {
      type: "LineString",
      coordinates: [[24.6167, 45.6167], [24.6333, 45.6333], [24.6500, 45.6500]]
    },
    length_km: 90.0,
    rating_avg: 9.3,
    rating_count: 189,
    save_count: 112,
    tags: ["mountain", "scenic", "curves"],
    countries: ["Romania"],
    region: "Carpathians",
    created_by: "1",
    created_at: new Date().toISOString()
  },
  {
    id: "4",
    name: "Trollstigen",
    description: "Norway's famous serpentine mountain road with dramatic views",
    geometry: {
      type: "LineString",
      coordinates: [[7.1667, 62.6167], [7.1833, 62.6333], [7.2000, 62.6500]]
    },
    length_km: 55.0,
    rating_avg: 9.1,
    rating_count: 145,
    save_count: 78,
    tags: ["mountain", "scenic", "curves"],
    countries: ["Norway"],
    region: "Fjord",
    created_by: "1",
    created_at: new Date().toISOString()
  },
  {
    id: "5",
    name: "Ring Road",
    description: "Complete circuit around Iceland with waterfalls, glaciers, and volcanoes",
    geometry: {
      type: "LineString",
      coordinates: [[-19.0167, 64.9167], [-19.0333, 64.9333], [-19.0500, 64.9500]]
    },
    length_km: 1332.0,
    rating_avg: 9.4,
    rating_count: 267,
    save_count: 201,
    tags: ["scenic", "epic", "adventure"],
    countries: ["Iceland"],
    region: "Ring Road",
    created_by: "1",
    created_at: new Date().toISOString()
  },
  {
    id: "6",
    name: "Great Ocean Road",
    description: "Australia's most famous coastal drive with the Twelve Apostles",
    geometry: {
      type: "LineString",
      coordinates: [[143.4167, -38.7167], [143.4333, -38.7333], [143.4500, -38.7500]]
    },
    length_km: 243.0,
    rating_avg: 9.0,
    rating_count: 198,
    save_count: 134,
    tags: ["scenic", "coastal", "curves"],
    countries: ["Australia"],
    region: "Victoria",
    created_by: "1",
    created_at: new Date().toISOString()
  },
  {
    id: "7",
    name: "Route 66",
    description: "Historic American highway from Chicago to Santa Monica",
    geometry: {
      type: "LineString",
      coordinates: [[-87.6167, 41.8167], [-87.6333, 41.8333], [-87.6500, 41.8500]]
    },
    length_km: 3940.0,
    rating_avg: 8.8,
    rating_count: 312,
    save_count: 267,
    tags: ["historic", "epic", "adventure"],
    countries: ["USA"],
    region: "USA",
    created_by: "1",
    created_at: new Date().toISOString()
  },
  {
    id: "8",
    name: "Dolomites Road",
    description: "Breathtaking mountain passes through Italy's Dolomite Alps",
    geometry: {
      type: "LineString",
      coordinates: [[11.9167, 46.4167], [11.9333, 46.4333], [11.9500, 46.4500]]
    },
    length_km: 110.0,
    rating_avg: 9.6,
    rating_count: 278,
    save_count: 189,
    tags: ["mountain", "scenic", "curves"],
    countries: ["Italy"],
    region: "Dolomites",
    created_by: "1",
    created_at: new Date().toISOString()
  }
];

export async function safeFetch(url: string): Promise<any | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("API error");
    return await res.json();
  } catch (e) {
    console.error("API fetch error:", e);
    return null;
  }
}

export async function fetchRoads(): Promise<Road[]> {
  // For static GitHub Pages deployment, return demo data
  if (typeof window !== 'undefined' && window.location.hostname.includes('github.io')) {
    return DEMO_ROADS;
  }
  
  const data = await safeFetch(`${API_URL}/roads`);
  return data || [];
}

export async function fetchRoadsInBBox(bbox: number[] | null): Promise<Road[]> {
  // For static GitHub Pages deployment, return demo data
  if (typeof window !== 'undefined' && window.location.hostname.includes('github.io')) {
    return DEMO_ROADS;
  }
  
  const url = bbox 
    ? `${API_URL}/roads?bbox=${bbox.join(",")}` 
    : `${API_URL}/roads`;
  
  const data = await safeFetch(url);
  return data || [];
}

export async function fetchRoadDetail(id: string): Promise<Road | null> {
  // For static GitHub Pages deployment, return demo data
  if (typeof window !== 'undefined' && window.location.hostname.includes('github.io')) {
    return DEMO_ROADS.find(r => r.id === id) || null;
  }
  
  const data = await safeFetch(`${API_URL}/roads/${id}`);
  return data;
}

export async function createRoad(road: Partial<Road>): Promise<Road | null> {
  try {
    const res = await fetch(`${API_URL}/roads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(road),
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || "Failed to create road";
      showToast("error", errorMessage);
      throw new Error(errorMessage);
    }
    return await res.json();
  } catch (e) {
    console.error("Create road error:", e);
    showToast("error", "Failed to create road");
    throw e;
  }
}

export async function fetchReviews(roadId: string): Promise<Review[]> {
  const data = await safeFetch(`${API_URL}/reviews?road_id=${roadId}`);
  return data || [];
}

export async function createReview(review: Partial<Review>): Promise<Review | null> {
  try {
    const res = await fetch(`${API_URL}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(review),
    });
    
    if (!res.ok) throw new Error("Failed to create review");
    return await res.json();
  } catch (e) {
    console.error("Create review error:", e);
    return null;
  }
}

export async function importGPX(gpxText: string, name: string): Promise<Road[] | null> {
  try {
    const res = await fetch(`${API_URL}/roads/import-gpx`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ gpxText, name, tags: ["user-imported"] }),
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || "Failed to import GPX";
      showToast("error", errorMessage);
      throw new Error(errorMessage);
    }
    showToast("success", "GPX imported successfully");
    return await res.json();
  } catch (e) {
    console.error("GPX import error:", e);
    showToast("error", "Failed to import GPX");
    throw e;
  }
}
