import { Road, Review, User, UserRoute } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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

export async function fetchRoadsInBBox(bbox: number[] | null): Promise<Road[]> {
  const url = bbox 
    ? `${API_URL}/roads?bbox=${bbox.join(",")}` 
    : `${API_URL}/roads`;
  
  const data = await safeFetch(url);
  return data || [];
}

export async function fetchRoadDetail(id: string): Promise<Road | null> {
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
    
    if (!res.ok) throw new Error("Failed to create road");
    return await res.json();
  } catch (e) {
    console.error("Create road error:", e);
    return null;
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
    
    if (!res.ok) throw new Error("Failed to import GPX");
    return await res.json();
  } catch (e) {
    console.error("GPX import error:", e);
    return null;
  }
}
