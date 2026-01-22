export const DEFAULT_YAML_QUERY = `query:
  type: rank
  from: item
  retrieve:
    - name: test
      type: text_search
      mode: 
        type: lexical
      input_text_query: "text_query_test"
return_metadata: true
return_journey_explanations: true
return_explanation: true`

export const DEFAULT_SQL_QUERY = `SELECT *
FROM text_search(
  query='$query',  
  mode='vector',  
  text_embedding_ref='title_embedding', 
  limit=50)
LIMIT 200`
