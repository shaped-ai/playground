# ShapedQL Playground

Use the ShapedQL Playground to test ShapedQL queries against a live demo model. Write queries in the editor, click **Run**, and view results in the right pane.

## Dataset

The playground uses the **Movielens** dataset: a movie catalog with items, users, and interactions. The data is enriched with information from IMDb. All demo engines share this dataset.

## Getting Started

1. **Select a use case** — Choose from the dropdown (Agent search, Search and feeds, Recommendations).
2. **Pick a query** — Use a saved query or write your own ShapedQL.
3. **Run** — Click Run or press Cmd/Ctrl + Enter. Results appear in the right pane.

## Available Embeddings

The demo model includes these component embeddings:

### title_embedding
Text embeddings for movie titles. Use for semantic search on film names.

### description_content_embedding
Text embeddings for movie descriptions and overviews. Use for semantic search on plot content.

### poster_embedding
Image embeddings for movie posters. Use for visual similarity search.

### collaborative_embedding
User-item interaction embeddings. Use for collaborative filtering and recommendations.

### personnel_embedding
Text embeddings for cast and crew. Use for diversity and personnel-based filtering.

### people_also_liked
User-item interaction embeddings. Use for collaborative filtering and recommendations.

## Scoring models

The demo engine also has a click-through rate predictor that you can use for scoring: 

### click_through_rate
CTR trained with a LightGBM model.