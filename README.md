# ShapedQL Playground

An interactive environment for experimenting with ShapedQL, a query language for building search and ranking systems. Test queries, explore results, and iterate on relevance configurations without deploying to production.

## What you can do

- **Write and test queries** in SQL or YAML format with syntax highlighting and autocomplete
- **Execute queries** against the Shaped API and view results in multiple formats (tables, grids, lists, feeds)
- **Work with vector stores** and embeddings to understand how semantic search behaves
- **Explore demo datasets** like MovieLens to see examples of ranking and filtering
- **Save and manage queries** for quick iteration and comparison
- **Inspect query details** including scores, metadata, and API request/response data

## Getting started

1. Create a `.env.local` file in the project root and add your Shaped API key:
   ```
   SHAPED_API_KEY=your_api_key_here
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser