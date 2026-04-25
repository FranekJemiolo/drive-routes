import { Road, Review, User, UserRoute, ReviewSortOption } from "../types";
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

// Initialize browser storage on client side only
let storageInitialized = false;

function ensureStorageInitialized() {
  if (typeof window !== 'undefined' && !storageInitialized) {
    initializeBrowserStorage();
    storageInitialized = true;
  }
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
  console.log('[API] fetchRoads called, isBrowserMode:', isBrowserMode());
  // For static GitHub Pages deployment, use browser storage
  if (isBrowserMode()) {
    console.log('[API] Using browser storage');
    ensureStorageInitialized();
    const roads = getBrowserRoads();
    console.log('[API] Returning', roads.length, 'roads from browser storage');
    if (roads.length === 0) {
      console.error('[API] Browser storage returned 0 roads');
    }
    return roads;
  }
  
  console.log('[API] Using API backend');
  const data = await safeFetch(`${API_URL}/roads`);
  return data || [];
}

export async function fetchRoadsInBBox(bbox: number[] | null): Promise<Road[]> {
  // For static GitHub Pages deployment, use browser storage
  if (isBrowserMode()) {
    ensureStorageInitialized();
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
    ensureStorageInitialized();
    return getBrowserRoad(id);
  }
  
  const data = await safeFetch(`${API_URL}/roads/${id}`);
  return data;
}

export async function createRoad(road: Partial<Road>): Promise<Road | null> {
  // For static GitHub Pages deployment, use browser storage
  if (isBrowserMode()) {
    ensureStorageInitialized();
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

export async function fetchReviews(roadId: string, sort?: ReviewSortOption): Promise<Review[]> {
  // For static GitHub Pages deployment, use browser storage
  if (isBrowserMode()) {
    ensureStorageInitialized();
    const reviews = getBrowserReviews(roadId);
    // Sort reviews based on sort option
    if (sort === 'score_asc') return reviews.sort((a, b) => a.score - b.score);
    if (sort === 'score_desc') return reviews.sort((a, b) => b.score - a.score);
    if (sort === 'recency_asc') return reviews.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    if (sort === 'recency_desc') return reviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return reviews;
  }

  const url = sort
    ? `${API_URL}/roads/${roadId}/reviews?sort=${sort}`
    : `${API_URL}/roads/${roadId}/reviews`;

  const data = await safeFetch(url);
  return data || [];
}

export async function createReview(roadId: string, review: { score: number; text?: string }): Promise<Review | null> {
  // For static GitHub Pages deployment, use browser storage
  if (isBrowserMode()) {
    ensureStorageInitialized();
    return createBrowserReview({ ...review, road_id: roadId });
  }

  try {
    const res = await fetch(`${API_URL}/roads/${roadId}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(review),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMessage = errorData.error || "Failed to create review";
      showToast("error", errorMessage);
      throw new Error(errorMessage);
    }
    showToast("success", "Review created successfully");
    return await res.json();
  } catch (e) {
    console.error("Create review error:", e);
    if (!(e instanceof Error)) showToast("error", "Failed to create review");
    throw e;
  }
}

export async function updateReview(reviewId: string, review: { score?: number; text?: string }): Promise<Review | null> {
  try {
    const res = await fetch(`${API_URL}/reviews/${reviewId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(review),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMessage = errorData.error || "Failed to update review";
      showToast("error", errorMessage);
      throw new Error(errorMessage);
    }
    showToast("success", "Review updated successfully");
    return await res.json();
  } catch (e) {
    console.error("Update review error:", e);
    if (!(e instanceof Error)) showToast("error", "Failed to update review");
    throw e;
  }
}

export async function deleteReview(reviewId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/reviews/${reviewId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMessage = errorData.error || "Failed to delete review";
      showToast("error", errorMessage);
      throw new Error(errorMessage);
    }
    showToast("success", "Review deleted successfully");
    return true;
  } catch (e) {
    console.error("Delete review error:", e);
    if (!(e instanceof Error)) showToast("error", "Failed to delete review");
    throw e;
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
