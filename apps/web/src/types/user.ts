export type User = {
  id: string;
  username: string;
  email: string;
  reputation_score: number;
  onboarding_state: "new" | "welcome_seen" | "interests_selected" | "first_action_done" | "completed";
  onboarding_step: number;
  onboarding_completed_at?: string;
  preferences: {
    prefers_twisty: boolean;
    prefers_scenic: boolean;
    avoids_highways: boolean;
    tags: string[];
  };
  stats: {
    roads_rated: number;
    distance_driven_logged: number;
  };
  created_at: string;
};

export type Vehicle = {
  id: string;
  user_id: string;
  type: "car" | "motorcycle";
  make: string;
  model: string;
  power_hp?: number;
  drivetrain: "FWD" | "RWD" | "AWD";
};
