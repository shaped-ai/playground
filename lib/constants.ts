import { ModelStatus } from "@/types/enums"
import { ResultViewMode } from "@/lib/types/query.types"

export const PLAYGROUND_VIEWER_EMAIL = "demo@shaped.ai"
export const MOVIELENS_MODEL_NAME = "movie_recommendations"
export const SESSION_ID_COLUMN = "_derived_session_id"
export const INTERACTION_ID_COLUMN = "_derived_interaction_id"
export const SHAPED_PLAYGROUND_URL = ""
export const TRIAL_CREDIT_LIMIT = 300

export const DEMO_ENGINES = [
  {
    id: "agent_search",
    model_name: "Agent search",
    created_at: "2025-12-15 10:30:00 UTC",
    status: "ACTIVE" as const,
    details: {
      model_name: "Movielens Dataset",
      status: ModelStatus.ACTIVE,
      created_at: "2025-12-15 10:30:00 UTC",
      last_updated: "2025-12-15 10:30:00 UTC",
      model_uri: "movielens_demo_v2",
    },
    saved_queries: [
      {
        id: "semantic_search",
        name: "Semantic search",
        description: "Fetch all items for the Movielens demo engine",
        engine: "movielens_demo_v2",
        template: `-- semantic vector search on movie titles
SELECT *
FROM text_search(
  query='$query',  -- change query to see results from other search terms
  mode='vector',  
  text_embedding_ref='title_embedding', 
  limit=50)
LIMIT 200`,
        parameters: [
          {
            name: "query",
            type: "string" as const,
            value: "movies about talking toys",
          },
        ],
      },
      {
        id: "hybrid_search_rag",
        name: "Hybrid search",
        description: "Fetch all items for the Movielens demo engine",
        engine: "movielens_demo_v2",
        template: `-- keyword and semantic search with weighting
SELECT *
FROM text_search(
    name='semantic',
    query='$query',  
    mode='vector',  
    text_embedding_ref='description_content_embedding', 
    limit=50), 
  text_search(
    name='text_match',
    query='$query', 
    mode='lexical', 
    fuzziness=0, 
    limit=50)
-- weigh semantic matches more heavily than the keyword matches
ORDER BY score(expression= '1.5 * retrieval.get_score("semantic") + 0.01 * retrieval.get_score("text_match")')
LIMIT 200`,
        parameters: [
          {
            name: "query",
            type: "string" as const,
            value: "movies about talking toys",
          },
        ],
      },
      {
        id: "hybrid_search_lightgbm",
        name: "Image search",
        description: "Fetch all items for the Movielens demo engine",
        engine: "movielens_demo_v2",
        template: `SELECT *
FROM text_search(
  query='$query',  
  mode='vector',  
  text_embedding_ref='poster_embedding', 
  limit=25)
ORDER BY score(expression='click_through_rate', input_user_id='$user_id')
LIMIT 50`,
        parameters: [
          {
            name: "query",
            type: "string" as const,
            value: "space",
          },
          {
            name: "user_id",
            type: "string" as const,
            value: "122",
          },
        ],
      },
      {
        id: "personalized_hybrid",
        name: "Personalized hybrid search",
        description: "Fetch all items for the Movielens demo engine",
        engine: "movielens_demo_v2",
        template: `SELECT *
FROM similarity( -- items similar to what user has interacted with
    input_user_id='$user_id', 
    embedding_ref='collaborative_embedding', 
    limit=50), 
  text_search( -- items matching the text query
    name='text_match',
    query='$query', 
    mode='lexical', 
    fuzziness=0, 
    limit=50)
  -- change user_id to see results for different users
ORDER BY score(expression='cosine_similarity(\\
  pooled_text_encoding(\\
    user.recent_interactions, \\
    pool_fn=''mean'', \\
    embedding_ref="description_content_embedding"\\
  ), \\
  text_encoding(\\
    item, \\
    embedding_ref="description_content_embedding"\\
  )\\
)', input_user_id='$user_id')
LIMIT 200`,
        parameters: [
          {
            name: "query",
            type: "string" as const,
            value: "space movies",
          },
          {
            name: "user_id",
            type: "string" as const,
            value: "112",
          },
        ],
      },
      {
        id: "break_bubbles",
        name: "Break filter bubbles",
        description: "Fetch the most highly rated films for a given user",
        engine: "movielens_demo_v2",
        template: `SELECT *
FROM text_search(
    name='semantic',
    query='$query',  
    mode='vector',  
    text_embedding_ref='description_content_embedding', 
    limit=50)
ORDER BY score(expression='cosine_similarity(\\
  pooled_text_encoding(\\
    user.recent_interactions, \\
    pool_fn=''mean'', \\
    embedding_ref="description_content_embedding"\\
  ), \\
  text_encoding(\\
    item, \\
    embedding_ref="description_content_embedding"\\
  )\\
)', input_user_id='$user_id')
-- change user_id to see results for different users
REORDER BY exploration(0.2)
LIMIT 200
`,
        parameters: [
          {
            name: "query",
            type: "string" as const,
            value: "romance",
          },
          {
            name: "user_id",
            type: "string" as const,
            value: "112",
          },
        ],
      },
    ],
  },
  {
    id: "movielens_demo_v2",
    model_name: "Search and feeds",
    created_at: "2025-12-15 10:30:00 UTC",
    status: "ACTIVE" as const,
    details: {
      model_name: "Movielens Dataset",
      status: ModelStatus.ACTIVE,
      created_at: "2025-12-15 10:30:00 UTC",
      last_updated: "2025-12-15 10:30:00 UTC",
      model_uri: "movielens_demo_v2",
    },
    saved_queries: [
      {
        id: "hybrid_search",
        name: "Hybrid search",
        description: "Fetch all items for the Movielens demo engine",
        engine: "movielens_demo_v2",
        template: `SELECT *
FROM text_search(
    name='semantic',
    query='$query',  
    mode='vector',  
    text_embedding_ref='description_content_embedding', 
    limit=50), 
  text_search(
    name='text_match',
    query='$query', 
    mode='lexical', 
    fuzziness=0, 
    limit=50)
ORDER BY score(expression= '1.5 * retrieval.get_score("semantic") + 0.01 * retrieval.get_score("text_match")')
LIMIT 200`,
        parameters: [
          {
            name: "query",
            type: "string" as const,
            value: "horror movies about backpackers",
          },
        ],
      },
      {
        id: "hybrid_search_lightgbm",
        name: "Image search",
        description: "Fetch all items for the Movielens demo engine",
        engine: "movielens_demo_v2",
        template: `SELECT *
FROM text_search(
  query='$query',  
  mode='vector',  
  text_embedding_ref='poster_embedding', 
  limit=25)
ORDER BY score(expression='click_through_rate', input_user_id='$user_id')
LIMIT 50`,
        parameters: [
          {
            name: "query",
            type: "string" as const,
            value: "space",
          },
          {
            name: "user_id",
            type: "string" as const,
            value: "122",
          },
        ],
      },
      {
        id: "top_rated_movies",
        name: "Collaborative similarity",
        description: "Fetch the most highly rated films for a given user",
        engine: "movielens_demo_v2",
        template: `SELECT * FROM similarity(
  embedding_ref="collaborative_embedding" , 
  entity_type="items",
  limit=200, 
  encoder='precomputed_user',

  -- choose a user_id between 1 and 150  
  -- to see personalized results for different people
  input_user_id='105' 
)`,
        parameters: [],
      },
      {
        id: "recommendations",
        name: "Recommendations feed",
        description:
          "Fetch the most highly rated films for a given user, falling back to popular",
        engine: "movielens_demo_v2",
        template: `SELECT *
FROM similarity(
    embedding_ref='collaborative_embedding',
    encoder='precomputed_user',
    input_user_id='$user_id'
  )
ORDER BY score(
  expression='0.2 * click_through_rate + \\
    0.8 * cosine_similarity(\\
    pooled_text_encoding(\\
      user.recent_interactions, \\
      pool_fn=''mean'', \\
      embedding_ref="description_content_embedding"\\
    ), \\
    text_encoding(\\
      item, \\
      embedding_ref="description_content_embedding"\\
    )\\
  )', input_user_id='$user_id')
REORDER BY diversity(0.2, text_encoding_embedding_ref='personnel_embedding')`,
        parameters: [
          {
            name: "user_id",
            type: "string" as const,
            value: "122",
          },
        ],
        defaultViewMode: ResultViewMode.PREVIEW_LIST,
        defaultFeatures: ["interaction_count"],
      },
      {
        id: "cold_start",
        name: "Cold start",
        description:
          "Fetch the most highly rated films for a given user, falling back to popular",
        engine: "movielens_demo_v2",
        template: `SELECT * FROM similarity(
    embedding_ref='collaborative_embedding' , 
    entity_type='items',
    encoder='precomputed_user',
    input_user_id='120' 
  ),
  column_order(
    -- cold start: return popular items for 
    -- users with no interactions
    columns='_derived_popular_rank asc',
  )`,
        parameters: [],
        defaultViewMode: ResultViewMode.PREVIEW_LIST,
        defaultFeatures: ["interaction_count"],
      },
    ],
  },
  {
    id: "recommendations",
    model_name: "Recommendations",
    created_at: "2025-12-15 10:30:00 UTC",
    status: "ACTIVE" as const,
    details: {
      model_name: "Movielens Dataset",
      status: ModelStatus.ACTIVE,
      created_at: "2025-12-15 10:30:00 UTC",
      last_updated: "2025-12-15 10:30:00 UTC",
      model_uri: "movielens_demo_v2",
    },
    saved_queries: [
      {
        id: "chronological",
        name: "Chronological",
        description: "Order items by release date",
        engine: "movielens_demo_v2",
        template: `SELECT *
FROM column_order(
  columns='release_date desc',
)`,
        parameters: [],
      },
      {
        id: "popular",
        name: "Popular",
        description: "Show popular items based on derived rank",
        engine: "movielens_demo_v2",
        template: `SELECT *
FROM column_order(
  columns='_derived_popular_rank',
)`,
        parameters: [],
      },
      {
        id: "content_filtering",
        name: "Content Filtering",
        description:
          "Show items that have similar titles to what user has interacted with",
        engine: "movielens_demo_v2",
        template: `SELECT *
FROM similarity(
  embedding_ref='title_embedding',
  encoder='interaction_round_robin',
  input_user_id='$user_id'
)`,
        parameters: [
          {
            name: "user_id",
            type: "string" as const,
            value: "3",
          },
        ],
      },
      {
        id: "collaborative_filtering",
        name: "Collaborative Filtering",
        description:
          "Show items that were interacted with by people similar to the user",
        engine: "movielens_demo_v2",
        template: `SELECT *
FROM similarity(
  embedding_ref='collaborative_embedding',
  encoder='interaction_round_robin',
  input_user_id='$user_id'
)`,
        parameters: [
          {
            name: "user_id",
            type: "string" as const,
            value: "3",
          },
        ],
      },
      {
        id: "collaborative_content_ensemble",
        name: "Collaborative & Content Filtering ensemble",
        description: "Combine collaborative and content filtering approaches",
        engine: "movielens_demo_v2",
        template: `SELECT *
FROM similarity(
  embedding_ref='collaborative_embedding',
  encoder='interaction_round_robin',
  input_user_id='$user_id'
),
similarity(
  embedding_ref='title_embedding',
  encoder='interaction_round_robin',
  input_user_id='$user_id'
)`,
        parameters: [
          {
            name: "user_id",
            type: "string" as const,
            value: "3",
          },
        ],
      },
      {
        id: "ensemble_with_ctr_scorer",
        name: "Ensemble with CTR scorer",
        description:
          "Collaborative & Content Filtering ensemble with click-through-rate scorer",
        engine: "movielens_demo_v2",
        template: `SELECT *
FROM similarity(
  embedding_ref='collaborative_embedding',
  encoder='interaction_round_robin',
  input_user_id='$user_id'
),
similarity(
  embedding_ref='title_embedding',
  encoder='interaction_round_robin',
  input_user_id='$user_id'
)
ORDER BY score(expression='click_through_rate', input_user_id='$user_id')`,
        parameters: [
          {
            name: "user_id",
            type: "string" as const,
            value: "3",
          },
        ],
      },
      {
        id: "ensemble_ctr_diversity",
        name: "Ensemble with CTR and diversity",
        description:
          "Collaborative & Content Filtering ensemble with click-through-rate scorer and reordering",
        engine: "movielens_demo_v2",
        template: `SELECT *
FROM similarity(
  embedding_ref='collaborative_embedding',
  encoder='interaction_round_robin',
  input_user_id='$user_id'
),
similarity(
  embedding_ref='title_embedding',
  encoder='interaction_round_robin',
  input_user_id='$user_id'
)
ORDER BY score(expression='click_through_rate', input_user_id='$user_id)
REORDER BY diversity(0.2, text_encoding_embedding_ref='personnel_embedding')`,
        parameters: [
          {
            name: "user_id",
            type: "string" as const,
            value: "3",
          },
        ],
      },
    ],
  },
  // {
  //   id: "hackernews_for_you_v2",
  //   model_name: "Hackernews Posts",
  //   created_at: "2024-01-10 14:20:00 UTC",
  //   status: "ACTIVE" as const,
  //   details: {
  //     model_name: "hackernews_for_you_v2",
  //     status: ModelStatus.ACTIVE,
  //     created_at: "2024-01-10 14:20:00 UTC",
  //     last_updated: "2024-01-10 14:20:00 UTC",
  //     model_uri: "hackernews_for_you_v2",
  //   },
  //   saved_queries: [
  //     {
  //       id: "hackernews_get_items_dataset",
  //       name: "Get items dataset",
  //       description: "Fetch all items for the Hackernews demo engine",
  //       engine: "hackernews_for_you_v2",
  //       template: "SELECT * FROM items",
  //       parameters: [],
  //     },
  //   ],
  // },
  // {
  //   id: "amazon_games_v2_dipro",
  //   model_name: "Amazon Games",
  //   created_at: "2025-12-20 09:15:00 UTC",
  //   status: "ACTIVE" as const,
  //   details: {
  //     model_name: "Amazon Games",
  //     status: ModelStatus.ACTIVE,
  //     created_at: "2025-12-20 09:15:00 UTC",
  //     last_updated: "2025-12-20 09:15:00 UTC",
  //     model_uri: "amazon_games_v2_dipro",
  //   },
  //   saved_queries: [
  //     {
  //       id: "amazon_games_get_items_dataset",
  //       name: "Get items dataset",
  //       description: "Fetch all items for the Amazon Games demo engine",
  //       engine: "amazon_games_v2_dipro",
  //       template: "SELECT * FROM items",
  //       parameters: [],
  //     },
  //   ],
  // },
]
