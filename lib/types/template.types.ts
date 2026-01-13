export type FieldType = "image" | "video" | "text" | "rating" | "date" | "badge" |"tag"

export interface TemplateField {
  id: string
  type: FieldType
  label: string
  dataKey: string // The key from the result data
  width: "small" | "medium" | "large" | "full" // For image/video fields
  size: "small" | "medium" | "large" | "full" // For image/video fields
  position: number
  visible: boolean
}

export interface CardTemplate {
  id: string
  name: string
  previewMode:"feed" | "carousel" | "grid" | "editorial" | "ticker" | "list" | "masonry"
  fields: TemplateField[]
}

export interface TemplateConfig {
  engineId?: string
  templates: {
    feed?: CardTemplate
    carousel?: CardTemplate
    grid?: CardTemplate
    editorial?: CardTemplate
    ticker?: CardTemplate
    list?: CardTemplate
    masonry?: CardTemplate
    rawTable?: CardTemplate
    summaryTable?: CardTemplate
  }
}
