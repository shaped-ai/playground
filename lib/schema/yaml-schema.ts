// JSON Schema for YAML query language with 5 levels of nesting
export const QUERY_YAML_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    queries: {
      type: "object",
      description: "Define one or more named queries",
      patternProperties: {
        "^[a-zA-Z_][a-zA-Z0-9_]*$": {
          type: "object",
          description: "Query definition",
          properties: {
            params: {
              type: "object",
              description: "Query parameters configuration",
              properties: {
                user_id: {
                  type: "object",
                  description: "User identifier parameter",
                  properties: {
                    type: {
                      type: "string",
                      enum: ["string", "number", "boolean", "object", "array"],
                      description: "Parameter data type",
                    },
                    required: {
                      type: "boolean",
                      description: "Whether this parameter is required",
                    },
                    default: {
                      description: "Default value for the parameter",
                    },
                  },
                },
                limit: {
                  type: "object",
                  description: "Result limit parameter",
                  properties: {
                    type: {
                      type: "string",
                      enum: ["number"],
                      description: "Parameter data type",
                    },
                    default: {
                      type: "number",
                      description: "Default limit value",
                    },
                    min: {
                      type: "number",
                      description: "Minimum allowed value",
                    },
                    max: {
                      type: "number",
                      description: "Maximum allowed value",
                    },
                  },
                },
              },
            },
            query: {
              type: "object",
              description: "Main query configuration",
              properties: {
                type: {
                  type: "string",
                  enum: ["rank", "filter", "search", "aggregate", "join"],
                  description: "Query operation type",
                },
                return_entity: {
                  type: "string",
                  enum: ["user", "item", "content", "product", "document"],
                  description: "Entity type to return",
                },
                retrieve: {
                  type: "array",
                  description: "Retrieval pipeline configuration",
                  items: {
                    type: "object",
                    properties: {
                      name: {
                        type: "string",
                        description: "Retrieval step name",
                      },
                      type: {
                        type: "string",
                        enum: [
                          "similarity_search",
                          "keyword_search",
                          "hybrid_search",
                          "vector_search",
                          "full_text_search",
                        ],
                        description: "Type of retrieval operation",
                      },
                      using_embedding: {
                        type: "string",
                        description: "Name of the embedding to use",
                      },
                      using_index: {
                        type: "string",
                        description: "Index to search in",
                      },
                      query_encoder: {
                        type: "object",
                        description: "Query encoding configuration",
                        properties: {
                          type: {
                            type: "string",
                            enum: [
                              "user_attribute_pooling",
                              "text_encoder",
                              "image_encoder",
                              "multi_modal_encoder",
                            ],
                            description: "Encoder type for query processing",
                          },
                          input_field: {
                            type: "string",
                            description: "Field name to encode from input",
                          },
                          pooling_strategy: {
                            type: "string",
                            enum: [
                              "mean",
                              "max",
                              "sum",
                              "weighted",
                              "attention",
                            ],
                            description: "How to aggregate multiple values",
                          },
                          model: {
                            type: "object",
                            description: "Model configuration for encoding",
                            properties: {
                              name: {
                                type: "string",
                                description: "Model identifier or path",
                              },
                              version: {
                                type: "string",
                                description: "Model version to use",
                              },
                              params: {
                                type: "object",
                                description: "Model-specific parameters",
                                properties: {
                                  temperature: {
                                    type: "number",
                                    description: "Temperature for generation",
                                    minimum: 0,
                                    maximum: 2,
                                  },
                                  max_length: {
                                    type: "number",
                                    description: "Maximum sequence length",
                                  },
                                  embedding_dim: {
                                    type: "number",
                                    enum: [128, 256, 384, 512, 768, 1024],
                                    description: "Embedding dimension size",
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                      limit: {
                        type: "string",
                        description:
                          "Maximum results from this step (can reference $params.limit)",
                      },
                      filters: {
                        type: "array",
                        description: "Filters to apply on results",
                        items: {
                          type: "object",
                          properties: {
                            field: {
                              type: "string",
                              description: "Field to filter on",
                            },
                            operator: {
                              type: "string",
                              enum: [
                                "eq",
                                "ne",
                                "gt",
                                "gte",
                                "lt",
                                "lte",
                                "in",
                                "nin",
                                "contains",
                                "regex",
                              ],
                              description: "Comparison operator",
                            },
                            value: {
                              description: "Value to compare against",
                            },
                          },
                          required: ["field", "operator", "value"],
                        },
                      },
                    },
                    required: ["name", "type"],
                  },
                },
                rerank: {
                  type: "object",
                  description: "Reranking configuration",
                  properties: {
                    type: {
                      type: "string",
                      enum: [
                        "cross_encoder",
                        "colbert",
                        "bm25",
                        "learning_to_rank",
                      ],
                      description: "Reranking algorithm",
                    },
                    model: {
                      type: "string",
                      description: "Model to use for reranking",
                    },
                    top_k: {
                      type: "number",
                      description: "Number of results to rerank",
                    },
                  },
                },
                sort: {
                  type: "array",
                  description: "Sorting configuration",
                  items: {
                    type: "object",
                    properties: {
                      field: {
                        type: "string",
                        description: "Field to sort by",
                      },
                      order: {
                        type: "string",
                        enum: ["asc", "desc"],
                        description: "Sort order",
                      },
                    },
                  },
                },
              },
              required: ["type"],
            },
          },
          required: ["query"],
        },
      },
    },
  },
}
