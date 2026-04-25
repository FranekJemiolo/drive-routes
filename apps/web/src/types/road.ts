export type Road = {
  id: string;
  name: string;
  description?: string;
  rating_avg: number | string;
  rating_count: number;
  save_count: number;
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
  tags: string[];
  countries: string[];
  region?: string;
  length_km: number | string;
  created_by: string | null;
  created_at: string;
};

export type RoadCreateInput = {
  name: string;
  description?: string;
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
  tags: string[];
  countries: string[];
  region?: string;
};

export type Review = {
  id: string;
  user_id: string;
  road_id: string;
  score: number; // 1-10
  text?: string;
  created_at: string;
  updated_at?: string;
  user?: {
    id: string;
    username: string;
  };
};

export type ReviewCreateInput = {
  road_id: string;
  score: number; // 1-10
  text?: string;
};

export type ReviewUpdateInput = {
  score?: number; // 1-10
  text?: string;
};

export type ReviewSortOption = 'score_asc' | 'score_desc' | 'recency_asc' | 'recency_desc';

export type UserRoute = {
  id: string;
  name: string;
  road_ids: string[];
  created_by: string;
  visibility: "private" | "public" | "unlisted";
  created_at: string;
};
