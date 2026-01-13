import type { EditorMode, ParameterValue, ResultViewMode } from "@/lib/types/query.types"

export interface QueryTabState {
  id: string
  name: string
  content: string
  language: "yaml" | "sql"
  editorMode?: EditorMode
  engine: string
  savedQueryId?: string
  parameterValues?: ParameterValue
  previewMode?: ResultViewMode
}

export interface QueryPageState {
  tabs: QueryTabState[]
  activeTabId: string
}

/**
 * Encode query state to double-encoded base64 format
 */
export function encodeQueryState(state: QueryPageState): string {
  try {
    const json = JSON.stringify(state)
    const base64Once = btoa(encodeURIComponent(json))
    const base64Twice = btoa(base64Once)
    return base64Twice
  } catch (error) {
    console.error("[v0] Failed to encode query state:", error)
    return ""
  }
}

/**
 * Decode double-encoded base64 format to query state
 */
export function decodeQueryState(encoded: string): QueryPageState | null {
  try {
    const base64Once = atob(encoded)
    const json = decodeURIComponent(atob(base64Once))
    return JSON.parse(json) as QueryPageState
  } catch (error) {
    console.error("[v0] Failed to decode query state:", error)
    return null
  }
}

/**
 * Get current URL with updated query state
 */
export function getShareableUrl(state: QueryPageState): string {
  const encoded = encodeQueryState(state)
  const url = new URL(window.location.href)
  url.searchParams.set("q", encoded)
  return url.toString()
}

/**
 * Extract query state from URL params
 */
export function getQueryStateFromUrl(): QueryPageState | null {
  if (typeof window === "undefined") return null

  const params = new URLSearchParams(window.location.search)
  const encoded = params.get("q")

  if (!encoded) return null

  return decodeQueryState(encoded)
}

/**
 * Sync query state to URL without adding to history
 */
export function syncToUrl(state: QueryPageState): void {
  if (typeof window === "undefined") return

  const encoded = encodeQueryState(state)
  const url = new URL(window.location.href)
  url.searchParams.set("q", encoded)

  window.history.replaceState({}, "", url.toString())
}

/**
 * Push query state to browser history
 */
export function pushStateToHistory(state: QueryPageState): void {
  if (typeof window === "undefined") return

  const encoded = encodeQueryState(state)
  const url = new URL(window.location.href)
  url.searchParams.set("q", encoded)

  window.history.pushState({}, "", url.toString())
}
