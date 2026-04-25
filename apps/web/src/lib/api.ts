import { Road, Review, User, UserRoute } from "../types";
import { showToast } from "../components/ui/toast";
import { 
  isBrowserMode, 
  initializeBrowserStorage,
  getRoads as getBrowserRoads,
  getRoad as getBrowserRoad,
  createRoad as createBrowserRoad,
  updateRoad as updateBrowserRoad,
  deleteRoad as deleteBrowserRoad,
  getReviews as getBrowserReviews,
  createReview as createBrowserReview
} from "./browser-storage";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Initialize browser storage on client side
if (typeof window !== 'undefined') {
  initializeBrowserStorage();
}

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
  // For static GitHub Pages deployment, use browser storage
  if (isBrowserMode()) {
    return getBrowserRoads();
  }
  
  const data = await safeFetch(`${API_URL}/roads`);
  return data || [];
}

export async function fetchRoadsInBBox(bbox: number[] | null): Promise<Road[]> {
  // For static GitHub Pages deployment, use browser storage
  if (isBrowserMode()) {
    return getBrowserRoads();
  }
  
  const url = bbox 
    ? `${API_URL}/roads?bbox=${bbox.join(",")}` 
    : `${API_URL}/roads`;
  
  const data = await safeFetch(url);
  return data || [];
}

export async function fetchRoadDetail(id: string): Promise<Road | null> {
  // For static GitHub Pages deployment, use browser storage
  if (isBrowserMode()) {
    return getBrowserRoad(id);
  }
  
  const data = await safeFetch(`${API_URL}/roads/${id}`);
  return data;
}

export async function createRoad(road: Partial<Road>): Promise<Road | null> {
  // For static GitHub Pages deployment, use browser storage
  if (isBrowserMode()) {
    return createBrowserRoad(road);
  }
  
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
  // For static GitHub Pages deployment, use browser storage
  if (isBrowserMode()) {
    return getBrowserReviews(roadId);
  }
  
  const data = await safeFetch(`${API_URL}/reviews?road_id=${roadId}`);
  return data || [];
}

export async function createReview(review: Partial<Review>): Promise<Review | null> {
  // For static GitHub Pages deployment, use browser storage
  if (isBrowserMode()) {
    return createBrowserReview(review);
  }
  
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
