import { Road, Review } from "../types";

const STORAGE_KEYS = {
  ROADS: 'drive_routes_roads',
  REVIEWS: 'drive_routes_reviews',
  SAVED_ROUTES: 'drive_routes_saved',
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
    rating_avg: 0,
    rating_count: 0,
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
    rating_avg: 0,
    rating_count: 0,
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
    rating_avg: 0,
    rating_count: 0,
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
    rating_avg: 0,
    rating_count: 0,
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
    rating_avg: 0,
    rating_count: 0,
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
    rating_avg: 0,
    rating_count: 0,
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
    rating_avg: 0,
    rating_count: 0,
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
    rating_avg: 0,
    rating_count: 0,
    save_count: 189,
    tags: ["mountain", "scenic", "curves"],
    countries: ["Italy"],
    region: "Dolomites",
    created_by: "1",
    created_at: new Date().toISOString()
  }
];

const DEMO_REVIEWS: Review[] = [
  // Pacific Coast Highway reviews
  {
    id: "1",
    road_id: "1",
    user_id: "1",
    score: 9,
    text: "Absolutely stunning drive. The ocean views are breathtaking!",
    created_at: new Date(Date.now() - 86400000 * 30).toISOString()
  },
  {
    id: "2",
    road_id: "1",
    user_id: "2",
    score: 10,
    text: "Best coastal drive in America. Don't miss sunset at Big Sur.",
    created_at: new Date(Date.now() - 86400000 * 15).toISOString()
  },
  {
    id: "3",
    road_id: "1",
    user_id: "3",
    score: 8,
    text: "Great road but can get crowded on weekends. Go early morning.",
    created_at: new Date(Date.now() - 86400000 * 7).toISOString()
  },
  // Stelvio Pass reviews
  {
    id: "4",
    road_id: "2",
    user_id: "1",
    score: 10,
    text: "The most challenging and rewarding mountain pass I've ever driven.",
    created_at: new Date(Date.now() - 86400000 * 45).toISOString()
  },
  {
    id: "5",
    road_id: "2",
    user_id: "2",
    score: 9,
    text: "Incredible engineering. The hairpin turns are legendary.",
    created_at: new Date(Date.now() - 86400000 * 20).toISOString()
  },
  {
    id: "6",
    road_id: "2",
    user_id: "3",
    score: 9,
    text: "Not for the faint of heart. Bring a good car with strong brakes.",
    created_at: new Date(Date.now() - 86400000 * 10).toISOString()
  },
  // Transfăgărășan reviews
  {
    id: "7",
    road_id: "3",
    user_id: "1",
    score: 9,
    text: "Romania's hidden gem. The scenery is unmatched.",
    created_at: new Date(Date.now() - 86400000 * 60).toISOString()
  },
  {
    id: "8",
    road_id: "3",
    user_id: "2",
    score: 10,
    text: "Top Gear was right - this is the best road in the world.",
    created_at: new Date(Date.now() - 86400000 * 25).toISOString()
  },
  {
    id: "9",
    road_id: "3",
    user_id: "3",
    score: 8,
    text: "Check if it's open before going - closes in winter.",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  // Trollstigen reviews
  {
    id: "10",
    road_id: "4",
    user_id: "1",
    score: 9,
    text: "The views from the top are worth every hairpin turn.",
    created_at: new Date(Date.now() - 86400000 * 35).toISOString()
  },
  {
    id: "11",
    road_id: "4",
    user_id: "2",
    score: 8,
    text: "Scary but amazing. Not recommended for RVs!",
    created_at: new Date(Date.now() - 86400000 * 18).toISOString()
  },
  // Ring Road reviews
  {
    id: "12",
    road_id: "5",
    user_id: "1",
    score: 10,
    text: "The trip of a lifetime. Plan at least 10 days.",
    created_at: new Date(Date.now() - 86400000 * 90).toISOString()
  },
  {
    id: "13",
    road_id: "5",
    user_id: "2",
    score: 9,
    text: "Every corner reveals something new - waterfalls, glaciers, volcanoes.",
    created_at: new Date(Date.now() - 86400000 * 40).toISOString()
  },
  {
    id: "14",
    road_id: "5",
    user_id: "3",
    score: 9,
    text: "Expensive but worth every penny. Pack warm clothes!",
    created_at: new Date(Date.now() - 86400000 * 12).toISOString()
  },
  // Great Ocean Road reviews
  {
    id: "15",
    road_id: "6",
    user_id: "1",
    score: 9,
    text: "The Twelve Apostles are even more impressive in person.",
    created_at: new Date(Date.now() - 86400000 * 50).toISOString()
  },
  {
    id: "16",
    road_id: "6",
    user_id: "2",
    score: 8,
    text: "Beautiful drive but watch out for wildlife on the road.",
    created_at: new Date(Date.now() - 86400000 * 22).toISOString()
  },
  // Route 66 reviews
  {
    id: "17",
    road_id: "7",
    user_id: "1",
    score: 8,
    text: "More about the journey and nostalgia than the road itself.",
    created_at: new Date(Date.now() - 86400000 * 120).toISOString()
  },
  {
    id: "18",
    road_id: "7",
    user_id: "2",
    score: 9,
    text: "Classic American road trip. Stop at all the odd roadside attractions.",
    created_at: new Date(Date.now() - 86400000 * 55).toISOString()
  },
  // Dolomites Road reviews
  {
    id: "19",
    road_id: "8",
    user_id: "1",
    score: 10,
    text: "The most beautiful mountain scenery I've ever seen.",
    created_at: new Date(Date.now() - 86400000 * 70).toISOString()
  },
  {
    id: "20",
    road_id: "8",
    user_id: "2",
    score: 9,
    text: "Perfect for photographers. Every turn is a postcard.",
    created_at: new Date(Date.now() - 86400000 * 30).toISOString()
  }
];

// Initialize storage with demo data
export function initializeBrowserStorage(): void {
  if (typeof window === 'undefined') return;
  
  const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  
  if (!initialized) {
    console.log('[Browser Storage] Initializing with demo data');
    try {
      localStorage.setItem(STORAGE_KEYS.ROADS, JSON.stringify(DEMO_ROADS));
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(DEMO_REVIEWS));
      localStorage.setItem(STORAGE_KEYS.SAVED_ROUTES, JSON.stringify({}));
      
      // Calculate ratings from actual reviews
      DEMO_ROADS.forEach(road => {
        const roadReviews = DEMO_REVIEWS.filter(r => r.road_id === road.id);
        if (roadReviews.length > 0) {
          const avgRating = roadReviews.reduce((sum, r) => sum + r.score, 0) / roadReviews.length;
          updateRoad(road.id, { rating_avg: avgRating, rating_count: roadReviews.length });
        }
      });
      
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      console.log('[Browser Storage] Initialized with', DEMO_ROADS.length, 'roads and', DEMO_REVIEWS.length, 'reviews');
      
      // Verify the data was stored
      const storedRoads = localStorage.getItem(STORAGE_KEYS.ROADS);
      console.log('[Browser Storage] Verification - stored roads length:', storedRoads ? JSON.parse(storedRoads).length : 0);
    } catch (error) {
      console.error('[Browser Storage] Failed to initialize:', error);
    }
  } else {
    console.log('[Browser Storage] Already initialized');
    
    // Verify existing data
    const storedRoads = localStorage.getItem(STORAGE_KEYS.ROADS);
    console.log('[Browser Storage] Verification - existing roads length:', storedRoads ? JSON.parse(storedRoads).length : 0);
  }
}

// Roads CRUD
export function getRoads(): Road[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.ROADS);
  return data ? JSON.parse(data) : [];
}

export function getRoadsByUserId(userId: string): Road[] {
  const roads = getRoads();
  return roads.filter(r => r.created_by === userId);
}

export function getRoad(id: string): Road | null {
  const roads = getRoads();
  return roads.find(r => r.id === id) || null;
}

export function createRoad(road: Partial<Road>, userId?: string): Road {
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
    created_by: userId || road.created_by || '1',
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

// Saved Routes (user's liked/saved routes)
export function getSavedRoutes(userId: string): string[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.SAVED_ROUTES);
  const saved: Record<string, string[]> = data ? JSON.parse(data) : {};
  return saved[userId] || [];
}

export function saveRoute(userId: string, roadId: string): void {
  const saved = localStorage.getItem(STORAGE_KEYS.SAVED_ROUTES);
  const savedMap: Record<string, string[]> = saved ? JSON.parse(saved) : {};
  
  if (!savedMap[userId]) {
    savedMap[userId] = [];
  }
  
  if (!savedMap[userId].includes(roadId)) {
    savedMap[userId].push(roadId);
    localStorage.setItem(STORAGE_KEYS.SAVED_ROUTES, JSON.stringify(savedMap));
    
    // Increment save_count on the road
    const road = getRoad(roadId);
    if (road) {
      updateRoad(roadId, { save_count: (road.save_count || 0) + 1 });
    }
  }
}

export function unsaveRoute(userId: string, roadId: string): void {
  const saved = localStorage.getItem(STORAGE_KEYS.SAVED_ROUTES);
  const savedMap: Record<string, string[]> = saved ? JSON.parse(saved) : {};
  
  if (savedMap[userId]) {
    savedMap[userId] = savedMap[userId].filter(id => id !== roadId);
    localStorage.setItem(STORAGE_KEYS.SAVED_ROUTES, JSON.stringify(savedMap));
    
    // Decrement save_count on the road
    const road = getRoad(roadId);
    if (road && road.save_count > 0) {
      updateRoad(roadId, { save_count: road.save_count - 1 });
    }
  }
}

export function isRouteSaved(userId: string, roadId: string): boolean {
  const savedRoutes = getSavedRoutes(userId);
  return savedRoutes.includes(roadId);
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
    score: review.score || 5,
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

  // Calculate average of scores
  const avgRating = reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length;
  updateRoad(roadId, { rating_avg: avgRating, rating_count: reviews.length });
}

// Check if running in browser mode
export function isBrowserMode(): boolean {
  if (typeof window === 'undefined') {
    console.log('[Browser Storage] SSR - returning false');
    return false;
  }
  const hostname = window.location.hostname;
  console.log('[Browser Storage] Hostname:', hostname);
  // Always use browser mode for GitHub Pages or when no API URL is configured
  const noApiUrl = !process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL === 'http://localhost:3001';
  const isBrowser = hostname.includes('github.io') || hostname.includes('localhost') || noApiUrl;
  console.log('[Browser Storage] isBrowserMode:', isBrowser, '(noApiUrl:', noApiUrl, ')');
  return isBrowser;
}
