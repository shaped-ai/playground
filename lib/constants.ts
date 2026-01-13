export const PLAYGROUND_VIEWER_EMAIL = "demo@shaped.ai"
export const MOVIELENS_MODEL_NAME = "movie_recommendations"
export const SESSION_ID_COLUMN = "_derived_session_id"
export const INTERACTION_ID_COLUMN = "_derived_interaction_id"
export const SHAPED_PLAYGROUND_URL = ""
export const TRIAL_CREDIT_LIMIT = 300

export const DEMO_ENGINES = [
  {
    id: "movielens_demo_v2",
    model_name: "Movielens Dataset",
    created_at: "2025-12-15 10:30:00 UTC",
    status: "ACTIVE" as const,
  },
  {
    id: "hackernews_for_you_v2",
    model_name: "hackernews_for_you_v2",
    created_at: "2024-01-10 14:20:00 UTC",
    status: "ACTIVE" as const,
  },
  {
    id: "amazon_games_v2_dipro",
    model_name: "Amazon Games",
    created_at: "2025-12-20 09:15:00 UTC",
    status: "ACTIVE" as const,
  },
]
