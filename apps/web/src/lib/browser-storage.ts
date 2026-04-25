import { Road, Review } from "../types";

const STORAGE_KEYS = {
  ROADS: 'drive_routes_roads',
  REVIEWS: 'drive_routes_reviews',
  INITIALIZED: 'drive_routes_initialized'
};

// Demo data for initial load
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

const DEMO_REVIEWS: Review[] = [
  {
    id: "1",
    road_id: "1",
    user_id: "1",
    ratings: {
      enjoyment: 9,
      scenery: 10,
      surface: 8,
      traffic: 7
    },
    text: "Absolutely stunning drive. The ocean views are breathtaking!",
    created_at: new Date().toISOString()
  },
  {
    id: "2",
    road_id: "2",
    user_id: "1",
    ratings: {
      enjoyment: 10,
      scenery: 10,
      surface: 7,
      traffic: 8
    },
    text: "The most challenging and rewarding mountain pass I've ever driven.",
    created_at: new Date().toISOString()
  }
];

// Initialize storage with demo data
export function initializeBrowserStorage(): void {
  if (typeof window === 'undefined') return;
  
  const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  
  if (!initialized) {
    console.log('Initializing browser storage with demo data');
    localStorage.setItem(STORAGE_KEYS.ROADS, JSON.stringify(DEMO_ROADS));
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(DEMO_REVIEWS));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }
}

// Roads CRUD
export function getRoads(): Road[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.ROADS);
  return data ? JSON.parse(data) : [];
}

export function getRoad(id: string): Road | null {
  const roads = getRoads();
  return roads.find(r => r.id === id) || null;
}

export function createRoad(road: Partial<Road>): Road {
  const roads = getRoads();
  const newRoad: Road = {
    id: Date.now().toString(),
    name: road.name || 'Untitled Road',
    description: road.description || '',
    geometry: road.geometry || { type: 'LineString', coordinates: [] },
    length_km: road.length_km || 0,
    rating_avg: 0,
    rating_count: 0,
    save_count: 0,
    tags: road.tags || [],
    countries: road.countries || [],
    region: road.region || '',
    created_by: road.created_by || '1',
    created_at: new Date().toISOString()
  };
  
  roads.push(newRoad);
  localStorage.setItem(STORAGE_KEYS.ROADS, JSON.stringify(roads));
  return newRoad;
}

export function updateRoad(id: string, updates: Partial<Road>): Road | null {
  const roads = getRoads();
  const index = roads.findIndex(r => r.id === id);
  
  if (index === -1) return null;
  
  roads[index] = { ...roads[index], ...updates };
  localStorage.setItem(STORAGE_KEYS.ROADS, JSON.stringify(roads));
  return roads[index];
}

export function deleteRoad(id: string): boolean {
  const roads = getRoads();
  const filtered = roads.filter(r => r.id !== id);
  
  if (filtered.length === roads.length) return false;
  
  localStorage.setItem(STORAGE_KEYS.ROADS, JSON.stringify(filtered));
  return true;
}

// Reviews CRUD
export function getReviews(roadId?: string): Review[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.REVIEWS);
  const reviews: Review[] = data ? JSON.parse(data) : [];
  
  if (roadId) {
    return reviews.filter(r => r.road_id === roadId);
  }
  
  return reviews;
}

export function createReview(review: Partial<Review>): Review {
  const reviews = getReviews();
  const newReview: Review = {
    id: Date.now().toString(),
    road_id: review.road_id || '',
    user_id: review.user_id || '1',
    ratings: review.ratings || { enjoyment: 5, scenery: 5, surface: 5, traffic: 5 },
    text: review.text || '',
    created_at: new Date().toISOString()
  };
  
  reviews.push(newReview);
  localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
  
  // Update road rating
  updateRoadRating(review.road_id || '');
  
  return newReview;
}

export function updateRoadRating(roadId: string): void {
  const reviews = getReviews(roadId);
  const road = getRoad(roadId);
  
  if (!road) return;
  
  if (reviews.length === 0) {
    updateRoad(roadId, { rating_avg: 0, rating_count: 0 });
    return;
  }
  
  // Calculate average of enjoyment ratings
  const avgRating = reviews.reduce((sum, r) => sum + r.ratings.enjoyment, 0) / reviews.length;
  updateRoad(roadId, { rating_avg: avgRating, rating_count: reviews.length });
}

// Check if running in browser mode
export function isBrowserMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.includes('github.io');
}
