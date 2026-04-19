export type Road = {
  id: string;
  name: string;
  description?: string;
  rating_avg: number;
  rating_count: number;
  save_count: number;
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
  tags: string[];
  country: string;
  region?: string;
  length_km: number;
  created_by: string;
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
  country: string;
  region?: string;
};

export type Review = {
  id: string;
  user_id: string;
  road_id: string;
  ratings: {
    enjoyment: number; // 1-10
    scenery: number; // 1-10
    surface: number; // 1-10
    traffic: number; // 1-10
  };
  text?: string;
  created_at: string;
};

export type UserRoute = {
  id: string;
  name: string;
  road_ids: string[];
  created_by: string;
  visibility: "private" | "public" | "unlisted";
  created_at: string;
};
