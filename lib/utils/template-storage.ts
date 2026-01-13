import type { TemplateConfig, CardTemplate } from "@/lib/types/template.types"

const TEMPLATE_STORAGE_KEY = "query_card_templates"

export function saveTemplate(engineId: string, previewMode: string, template: CardTemplate) {
  const allTemplates = getAllTemplates()

  if (!allTemplates[engineId]) {
    allTemplates[engineId] = { templates: {} }
  }

  allTemplates[engineId].templates[previewMode as keyof TemplateConfig["templates"]] = template

  localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(allTemplates))
}

export function getTemplate(engineId: string, previewMode: string): CardTemplate | null {
  const allTemplates = getAllTemplates()
  return allTemplates[engineId]?.templates[previewMode as keyof TemplateConfig["templates"]] || null
}

export function getAllTemplates(): Record<string, TemplateConfig> {
  if (typeof window === "undefined") return {}

  const stored = localStorage.getItem(TEMPLATE_STORAGE_KEY)
  if (!stored) return {}

  try {
    return JSON.parse(stored)
  } catch {
    return {}
  }
}

export function deleteTemplate(engineId: string, previewMode: string) {
  const allTemplates = getAllTemplates()

  if (allTemplates[engineId]?.templates) {
    delete allTemplates[engineId].templates[previewMode as keyof TemplateConfig["templates"]]
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(allTemplates))
  }
}
