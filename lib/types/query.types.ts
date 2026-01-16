export interface QueryTab {
  id: string
  name: string
  content: string
  language: "yaml" | "sql"
  editorMode?: EditorMode
  results?: QueryResult
  isExecuting?: boolean
  engine?: string
  savedQueryId?: string
  parameterValues?: ParameterValue
  previewMode?: ResultViewMode
}

export interface QueryResult {
  data: QueryResultRow[]
  executionTime: number
  rowCount: number
  columns: string[]
  entity_type?: string
}

export interface QueryResultRow {
  [key: string]: any
}

export enum ResultViewMode {
  RAW_TABLE = "raw",
  SUMMARY_TABLE = "summary",
  JSON = "json",
  PREVIEW_GRID = "grid",
  PREVIEW_FEED = "feed",
  PREVIEW_CAROUSEL = "carousel",
  PREVIEW_EDITORIAL = "editorial",
  PREVIEW_TICKER = "ticker",
  PREVIEW_LIST = "list",
  PREVIEW_MASONRY = "masonry",
}

export enum EditorMode {
  PLAIN = "plain",
  YAML = "yaml",
  SQL = "sql",
}

export interface QueryEngine {
  id: string
  name: string
  type: string
}

export interface SavedQuery {
  id: string
  name: string
  description?: string
  engine: string
  template: string
  parameters: QueryParameter[]
}

export interface QueryParameter {
  name: string
  type: "string" | "number" | "boolean"
  description?: string
  defaultValue?: any
  value?: any
  required?: boolean
}

export interface ParameterValue {
  [key: string]: any
}
