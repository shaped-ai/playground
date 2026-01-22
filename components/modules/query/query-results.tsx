"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { ResultViewMode, type QueryResult } from "@/lib/types/query.types"
import Editor, { type OnMount } from "@monaco-editor/react"
import { useTheme } from "next-themes"
import { ResultsHeader } from "./results-header"
import { ResultsRawTable } from "./results-raw-table"
import { ResultsPreviewGrid } from "./results-preview-grid"
import { ResultsPreviewFeed } from "./results-preview-feed"
import { ResultsPreviewCarousel } from "./results-preview-carousel"
import { ResultsPreviewEditorial } from "./results-preview-editorial"
import { TemplateEditorDialog } from "./template-editor-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Loader2,
  LayoutList,
  LayoutPanelTop,
  GalleryVertical,
  GalleryHorizontalEnd,
  TriangleAlert,
  ArrowUpRight,
  FileCode,
} from "lucide-react"
import type { CardTemplate, TemplateField } from "@/lib/types/template.types"
import { getTemplate, saveTemplate } from "@/lib/utils/template-storage"
import { ResultsPreviewHorizontal } from "./results-preview-horizontal"
import { ResultsPreviewList } from "./results-preview-list"
import { ResultsPreviewMasonry } from "./results-preview-masonry"
import { FeatureType, QueryTab, UserRecommendationTab } from "@/types/enums"
import type { Feature } from "@/types"
import { ModelDetails } from "@/types"
import { ResultsTable } from "@/components/results-table"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/shared/use-media-query"
import { DEMO_ENGINES } from "@/lib/constants"
import type { SavedQuery } from "@/lib/types/query.types"

const allPreviewViewModes = [
  {
    value: ResultViewMode.PREVIEW_MASONRY,
    label: "Masonry",
    icon: LayoutPanelTop,
  },
  { value: ResultViewMode.PREVIEW_FEED, label: "Feed", icon: GalleryVertical },
  { value: ResultViewMode.PREVIEW_LIST, label: "List", icon: LayoutList },
  {
    value: ResultViewMode.PREVIEW_CAROUSEL,
    label: "Carousel",
    icon: GalleryHorizontalEnd,
  },
]

interface JsonMonacoViewerProps {
  data: QueryResult | Error | null
}

function JsonMonacoViewer({ data }: JsonMonacoViewerProps) {
  const { theme } = useTheme()
  const isMobile = useIsMobile()
  const editorRef = useRef<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = theme === "dark"

  // Handle error objects - convert to JSON-serializable format
  const getJsonString = () => {
    if (!data) return "{}"

    if (data instanceof Error) {
      // Convert Error instance to a serializable object
      const errorObj: any = {
        name: data.name,
        message: data.message,
      }

      // Add stack trace if available
      if (data.stack) {
        errorObj.stack = data.stack
      }

      // Add any additional properties from the error
      const errorAny = data as any
      Object.keys(errorAny).forEach((key) => {
        if (!["name", "message", "stack"].includes(key)) {
          try {
            errorObj[key] = errorAny[key]
          } catch {
            // Skip non-serializable properties
          }
        }
      })

      return JSON.stringify({ error: errorObj }, null, 2)
    }

    // For plain objects, stringify directly
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      // Fallback for non-serializable objects
      return JSON.stringify({ error: { message: String(data) } }, null, 2)
    }
  }

  const jsonString = getJsonString()
  const themeName = isDark ? "json-viewer-dark" : "json-viewer-light"
  const backgroundColor = isDark ? "#0f0f0f" : "#FFFFFF"

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor

    try {
      // Define dark theme for JSON viewer
      monaco.editor.defineTheme("json-viewer-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "string", foreground: "CE9178" },
          { token: "number", foreground: "B5CEA8" },
          { token: "keyword", foreground: "569CD6" },
          { token: "delimiter", foreground: "D4D4D4" },
        ],
        colors: {
          "editor.background": backgroundColor,
          "editor.foreground": "#D4D4D4",
          "editor.lineHighlightBackground": "#1A1A1A",
          "editor.selectionBackground": "#9A9A9A99",
          "editorCursor.foreground": "#FFFFFF",
          "editorLineNumber.foreground": "#858585",
          "editorLineNumber.activeForeground": "#C6C6C6",
        },
      })

      // Define light theme for JSON viewer
      monaco.editor.defineTheme("json-viewer-light", {
        base: "vs",
        inherit: true,
        rules: [
          { token: "string", foreground: "A31515" },
          { token: "number", foreground: "098658" },
          { token: "keyword", foreground: "0000FF" },
          { token: "delimiter", foreground: "000000" },
        ],
        colors: {
          "editor.background": backgroundColor,
          "editor.foreground": "#000000",
          "editor.lineHighlightBackground": "#F0F0F0",
          "editor.selectionBackground": "#ADD6FF80",
          "editorCursor.foreground": "#000000",
          "editorLineNumber.foreground": "#858585",
          "editorLineNumber.activeForeground": "#000000",
        },
      })
    } catch (error) {
      // Silently fail
    }

    editor.updateOptions({
      theme: themeName,
      minimap: { enabled: false },
      fontSize: 13,
      lineHeight: 20,
      lineNumbers: isMobile ? "off" : "on",
      glyphMargin: false,
      folding: true,
      foldingStrategy: "indentation",
      showFoldingControls: "always",
      lineDecorationsWidth: 10,
      renderLineHighlight: "line",
      scrollBeyondLastLine: false,
      tabSize: 2,
      wordWrap: "on",
      readOnly: true,
      automaticLayout: true,
      quickSuggestions: false,
      suggestOnTriggerCharacters: false,
      parameterHints: { enabled: false },
      hover: { enabled: false },
      contextmenu: false,
      cursorBlinking: "solid",
      cursorStyle: "line",
      padding: {
        top: 16,
        bottom: 16,
      },
      scrollbar: {
        vertical: "auto",
        useShadows: false,
        verticalHasArrows: false,
        horizontalHasArrows: false,
        verticalScrollbarSize: 12,
        horizontalScrollbarSize: 12,
      },
    })
  }

  if (!mounted) {
    return (
      <div
        className="flex h-full items-center justify-center"
        style={{ backgroundColor }}
      >
        <span className="text-sm text-foreground-muted">
          Loading JSON viewer...
        </span>
      </div>
    )
  }

  const MonacoEditorComponent = Editor as unknown as React.FC<any>

  return (
    <div className="h-full w-full" style={{ backgroundColor }}>
      <MonacoEditorComponent
        height="100%"
        language="json"
        value={jsonString}
        onMount={handleEditorDidMount}
        theme={themeName}
        options={{
          readOnly: true,
          automaticLayout: true,
        }}
        loading={
          <div
            className="flex h-full items-center justify-center"
            style={{ backgroundColor }}
          >
            <span className="text-sm text-foreground-muted">
              Loading JSON viewer...
            </span>
          </div>
        }
      />
    </div>
  )
}

interface QueryResultsProps {
  results: QueryResult | null
  isExecuting?: boolean
  error?: Error | null
  previewMode?: ResultViewMode
  onPreviewModeChange?: (mode: ResultViewMode) => void
  engineName: string
  engineDetails?: ModelDetails
  apiLatency?: number
  showDocumentation?: boolean
  savedQueryId?: string
}

export function QueryResults({
  results,
  isExecuting,
  error,
  previewMode: externalPreviewMode,
  onPreviewModeChange,
  engineName,
  engineDetails,
  apiLatency,
  showDocumentation,
  savedQueryId,
}: QueryResultsProps) {
  const isMobile = useIsMobile()
  const { theme } = useTheme()
  const [viewMode, setViewMode] = useState<ResultViewMode>(
    externalPreviewMode || ResultViewMode.PREVIEW_MASONRY
  )

  // Sync viewMode with externalPreviewMode when it changes
  useEffect(() => {
    if (externalPreviewMode) {
      setViewMode(externalPreviewMode)
    }
  }, [externalPreviewMode])
  const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false)
  const [currentTemplate, setCurrentTemplate] = useState<CardTemplate | null>(
    null
  )
  const [templateRevision, setTemplateRevision] = useState(0)
  const hasCreatedDefaultTemplateRef = useRef<string>("")

  // Get the selected saved query to access defaultFeatures
  const selectedSavedQuery = useMemo<SavedQuery | null>(() => {
    if (!savedQueryId || !engineName) return null
    const demoEngine = DEMO_ENGINES.find((e) => e.id === engineName)
    if (!demoEngine?.saved_queries) return null
    const queries = demoEngine.saved_queries as SavedQuery[]
    return queries.find((q: SavedQuery) => q.id === savedQueryId) || null
  }, [savedQueryId, engineName])

  // Filter preview modes based on screen size
  const previewViewModes = useMemo(() => {
    if (isMobile) {
      // On mobile, only show feed, list, and masonry
      return allPreviewViewModes.filter(
        (mode) =>
          mode.value === ResultViewMode.PREVIEW_FEED ||
          mode.value === ResultViewMode.PREVIEW_LIST ||
          mode.value === ResultViewMode.PREVIEW_MASONRY
      )
    }
    // On desktop, show all modes
    return allPreviewViewModes
  }, [isMobile])

  // Load template from localStorage when viewMode is a preview mode
  useEffect(() => {
    const previewModes = [
      ResultViewMode.PREVIEW_FEED,
      ResultViewMode.PREVIEW_CAROUSEL,
      ResultViewMode.PREVIEW_GRID,
      ResultViewMode.PREVIEW_EDITORIAL,
      ResultViewMode.PREVIEW_TICKER,
      ResultViewMode.PREVIEW_LIST,
      ResultViewMode.PREVIEW_MASONRY,
    ]

    if (previewModes.includes(viewMode)) {
      // Convert viewMode to previewMode string
      let previewMode: string | null = null
      switch (viewMode) {
        case ResultViewMode.PREVIEW_FEED:
          previewMode = "feed"
          break
        case ResultViewMode.PREVIEW_CAROUSEL:
          previewMode = "carousel"
          break
        case ResultViewMode.PREVIEW_GRID:
          previewMode = "grid"
          break
        case ResultViewMode.PREVIEW_EDITORIAL:
          previewMode = "editorial"
          break
        case ResultViewMode.PREVIEW_TICKER:
          previewMode = "ticker"
          break
        case ResultViewMode.PREVIEW_LIST:
          previewMode = "list"
          break
        case ResultViewMode.PREVIEW_MASONRY:
          previewMode = "masonry"
          break
      }

      if (previewMode) {
        const template = getTemplate(engineName, previewMode)
        if (template) {
          setCurrentTemplate(template)
          // Reset the ref when a saved template is found
          hasCreatedDefaultTemplateRef.current = ""
        } else {
          // Only create default template if:
          // 1. Results data is available
          // 2. We haven't already created a default template for this engine+mode combination
          const templateKey = `${engineName}-${previewMode}`
          if (
            results?.data &&
            results.data.length > 0 &&
            hasCreatedDefaultTemplateRef.current !== templateKey
          ) {
            const keys = Object.keys(results.data[0] || {})
            const defaultFields: TemplateField[] = []

            // Add defaultFeatures from saved query configuration if available
            const defaultFeatures = selectedSavedQuery?.defaultFeatures || []
            defaultFeatures.forEach((featureName) => {
              if (keys.includes(featureName)) {
                defaultFields.push({
                  id: crypto.randomUUID(),
                  type: "text",
                  label: "",
                  dataKey: featureName,
                  size: "small",
                  width: "full",
                  position: defaultFields.length,
                  visible: true,
                })
              }
            })

            // Try to find common field names
            const imageKey = keys.find(
              (k) =>
                k.includes("image") ||
                k.includes("poster") ||
                k.includes("thumbnail")
            )
            const titleKey = keys.find(
              (k) => k.includes("title") || k.includes("name")
            )
            const descKey = keys.find(
              (k) =>
                k.includes("desc") ||
                k.includes("overview") ||
                k.includes("summary")
            )

            // Adjust positions for defaultFeatures that were already added
            let nextPosition = defaultFields.length

            if (imageKey) {
              defaultFields.push({
                id: crypto.randomUUID(),
                type: "image",
                label: "",
                dataKey: imageKey,
                size: "medium",
                width: "full",
                position: nextPosition++,
                visible: true,
              })
            }

            if (titleKey) {
              defaultFields.push({
                id: crypto.randomUUID(),
                type: "text",
                label: "",
                dataKey: titleKey,
                size: "medium",
                width: "full",
                position: nextPosition++,
                visible: true,
              })
            } else if (descKey) {
              defaultFields.push({
                id: crypto.randomUUID(),
                type: "text",
                label: "",
                dataKey: descKey,
                size: "small",
                width: "full",
                position: nextPosition++,
                visible: true,
              })
            } else if (
              keys.length > 0 &&
              !defaultFields.some((f) => f.dataKey === keys[0])
            ) {
              defaultFields.push({
                id: crypto.randomUUID(),
                type: "text",
                label: "",
                dataKey: keys[0],
                size: "small",
                width: "full",
                position: nextPosition++,
                visible: true,
              })
            }

            const newTemplate: CardTemplate = {
              id: crypto.randomUUID(),
              name: `${previewMode} Template`,
              previewMode: previewMode as
                | "feed"
                | "carousel"
                | "grid"
                | "editorial"
                | "ticker"
                | "list"
                | "masonry",
              fields: defaultFields,
            }

            saveTemplate(engineName, previewMode, newTemplate)
            setCurrentTemplate(newTemplate)
            // Mark that we've created a default template for this combination
            hasCreatedDefaultTemplateRef.current = templateKey
          }
        }
      }
    } else {
      // Clear template for non-preview modes
      setCurrentTemplate(null)
      hasCreatedDefaultTemplateRef.current = ""
    }
  }, [viewMode, engineName, results, selectedSavedQuery])

  const [rankFeatures, rankImageFeatures] = [
    [
      ...(
        (
          engineDetails?.model_schema as Record<string, Feature[]> | undefined
        )?.[results?.entity_type ?? "item"] ?? []
      ).filter((d: Feature) => d.type != FeatureType.IMAGE),
    ],
    [
      ...(
        (
          engineDetails?.model_schema as Record<string, Feature[]> | undefined
        )?.[results?.entity_type ?? "item"] ?? []
      ).filter((d: Feature) => d.type == FeatureType.IMAGE),
    ],
  ]

  const handleViewModeChange = (mode: ResultViewMode) => {
    setViewMode(mode)
    onPreviewModeChange?.(mode)
  }

  const getPreviewMode = ():
    | "feed"
    | "carousel"
    | "grid"
    | "editorial"
    | "ticker"
    | "list"
    | "masonry"
    | null => {
    switch (viewMode) {
      case ResultViewMode.PREVIEW_FEED:
        return "feed"
      case ResultViewMode.PREVIEW_CAROUSEL:
        return "carousel"
      case ResultViewMode.PREVIEW_GRID:
        return "grid"
      case ResultViewMode.PREVIEW_EDITORIAL:
        return "editorial"
      case ResultViewMode.PREVIEW_TICKER:
        return "ticker"
      case ResultViewMode.PREVIEW_LIST:
        return "list"
      case ResultViewMode.PREVIEW_MASONRY:
        return "masonry"
      default:
        return null
    }
  }

  const isPreviewMode = [
    ResultViewMode.PREVIEW_FEED,
    ResultViewMode.PREVIEW_CAROUSEL,
    ResultViewMode.PREVIEW_GRID,
    ResultViewMode.PREVIEW_EDITORIAL,
    ResultViewMode.PREVIEW_TICKER,
    ResultViewMode.PREVIEW_LIST,
    ResultViewMode.PREVIEW_MASONRY,
  ].includes(viewMode)

  // Mobile-supported view modes
  const mobileSupportedModes = [
    ResultViewMode.RAW_TABLE,
    ResultViewMode.JSON,
    ResultViewMode.PREVIEW_FEED,
    ResultViewMode.PREVIEW_LIST,
    ResultViewMode.PREVIEW_MASONRY,
  ]

  // Handle view mode fallback when switching to mobile with unsupported mode
  useEffect(() => {
    if (isMobile && !mobileSupportedModes.includes(viewMode)) {
      // Switch to a supported mode (prefer masonry for preview modes, otherwise raw table)
      const fallbackMode = isPreviewMode
        ? ResultViewMode.PREVIEW_MASONRY
        : ResultViewMode.RAW_TABLE
      setViewMode(fallbackMode)
      onPreviewModeChange?.(fallbackMode)
    }
  }, [isMobile, viewMode, isPreviewMode, onPreviewModeChange])

  const handleTemplateChange = (template: CardTemplate | null) => {
    setCurrentTemplate(template)
    setTemplateRevision((prev) => prev + 1)
  }

  // Debug logging
  useEffect(() => {
    console.log("[DEBUG QueryResults] Results prop:", results)
    console.log("[DEBUG QueryResults] Results data:", results?.data)
    console.log(
      "[DEBUG QueryResults] Results data length:",
      results?.data?.length
    )
    console.log("[DEBUG QueryResults] Results rowCount:", results?.rowCount)
    console.log("[DEBUG QueryResults] Is executing:", isExecuting)
    console.log("[DEBUG QueryResults] Error:", error)
  }, [results, isExecuting, error])

  return isExecuting ? (
    <div className="flex h-screen items-center justify-center bg-background-solid text-foreground">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="size-8 animate-spin text-foreground" />
        <p className="text-sm text-foreground-muted">Executing query...</p>
      </div>
    </div>
  ) : error ? (
    viewMode === ResultViewMode.JSON ? (
      <div className="flex h-full flex-col overflow-hidden border-border bg-background-solid">
        <div className="shrink-0">
          <ResultsHeader
            rowCount={0}
            executionTime={apiLatency || 0}
            viewMode={viewMode}
            isPreviewMode={false}
            onViewModeChange={handleViewModeChange}
          />
        </div>
        <div
          className="min-h-0 flex-1 bg-background-solid"
          style={{ height: "calc(100vh - 171px)" }}
        >
          <JsonMonacoViewer data={error} />
        </div>
      </div>
    ) : (
      <div className="flex h-full flex-col bg-background-solid">
        <div className="flex items-center justify-between border-b border-border bg-background-base p-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg border border-accent-brand-red bg-background-primary p-1.5">
              <TriangleAlert className="size-4 text-accent-brand-red" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Query Error</h2>
          </div>
          <a
            href="https://docs.shaped.ai/docs/v2/guides/errors"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg border border-border bg-background-primary px-3 py-1.5 text-xs font-medium text-foreground shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] hover:bg-background-secondary"
          >
            Common Errors
            <ArrowUpRight className="h-4 w-4 text-accent-brand-purple" />
          </a>
        </div>
        <div className="flex-1 p-4">
          <pre className="text-wrap overflow-auto text-sm text-foreground">
            {typeof error === "object" && error !== null
              ? JSON.stringify(error, null, 2)
              : String(error || "An unknown error occurred")}
          </pre>
        </div>
      </div>
    )
  ) : (!results && !isExecuting && !error) || showDocumentation ? (
    <div className="flex h-full w-full overflow-auto bg-background-solid">
      <iframe
        src={`https://docs.shaped.ai/docs/v2/query_reference/shapedql/?hide-nav=true&docusaurus-theme=${theme === "dark" ? "dark" : "light"}`}
        className="h-full w-full border-0"
        title="Query Documentation"
        allowFullScreen
        allow="clipboard-write"
        scrolling="yes"
        style={{
          WebkitOverflowScrolling: "touch",
        }}
      />
    </div>
  ) : (
    <div className="flex h-full flex-col overflow-hidden border-border bg-background-solid">
      <div className="shrink-0">
        <ResultsHeader
          rowCount={results?.rowCount || results?.data.length || 0}
          executionTime={apiLatency || 0}
          viewMode={viewMode}
          isPreviewMode={isPreviewMode}
          onViewModeChange={handleViewModeChange}
          onEditTemplate={
            isPreviewMode ? () => setIsTemplateEditorOpen(true) : undefined
          }
          hasNoResults={!results?.data || results.data.length === 0}
        />
      </div>
      {isPreviewMode && results?.data && results.data.length > 0 && (
        <div className="m-4 flex items-center justify-center overflow-x-auto whitespace-nowrap">
          <div className="flex w-fit shrink-0 items-center gap-0 rounded-[32px] border border-border bg-background-primary p-1">
            {previewViewModes.map((mode) => {
              const Icon = mode.icon
              const isActive = viewMode === mode.value
              return (
                <Button
                  key={mode.value}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewModeChange(mode.value)}
                  className={cn(
                    "text-nowrap relative h-auto w-auto shrink-0 cursor-pointer rounded-[32px] border transition-all",
                    isMobile ? "gap-0 px-2 py-1" : "gap-1 px-3 py-1.5",
                    isActive
                      ? "border-border-active bg-background-accent text-accent-brand-off-white hover:border-border-active hover:bg-accent-active"
                      : " border-transparent text-foreground hover:bg-background-secondary hover:text-foreground"
                  )}
                >
                  {!isMobile && <Icon className="h-3.5 w-3.5 shrink-0" />}
                  <span className="text-nowrap shrink-0 text-xs font-medium">
                    {mode.label}
                  </span>
                </Button>
              )
            })}
          </div>
        </div>
      )}
      {!results?.data || results.data.length === 0 ? (
        <div
          className="min-h-0 flex-1 bg-background-solid"
          style={{ height: "calc(100vh - 171px)" }}
        >
          <JsonMonacoViewer data={results} />
        </div>
      ) : (
        <div
          className={cn(
            "min-h-0 flex-1 bg-background-solid",
            viewMode === ResultViewMode.PREVIEW_FEED
              ? "min-h-0 "
              : "min-h-0 overflow-auto"
          )}
          style={{ height: "calc(100vh - 171px)" }}
        >
          <div
            className={cn(
              "h-full bg-background-solid",
              viewMode === ResultViewMode.PREVIEW_FEED ? " flex-1" : ""
            )}
          >
            {viewMode === ResultViewMode.RAW_TABLE && results && (
              <ResultsRawTable
                data={results?.data || []}
                columns={results?.columns || []}
              />
            )}
            {viewMode === ResultViewMode.SUMMARY_TABLE && results && (
              // <ResultsSummaryTable data={results?.data || []} />
              <ResultsTable
                key={JSON.stringify(results)}
                currentRankTab={UserRecommendationTab.RANK}
                resultsData={results?.data}
                features={rankFeatures.filter((f) =>
                  results?.columns.includes(f.name)
                )}
                imageFeatures={rankImageFeatures.filter((f) =>
                  results?.columns.includes(f.name)
                )}
                scoringPolicyNames={[]}
                selectedResultsItems={[]}
                setSelectedResultsItems={() => {}}
                sessionInteractionEnabled={false}
                rankTime={0}
                modelDetails={engineDetails}
                queryStep={3}
                configuration={{}}
                currentQueryTab={QueryTab.USER}
                handleShowRankConfig={() => {}}
                title={"Results Table"}
                searchScoresBreakdown={[]}
                updateQueryParams={() => {}}
              />
            )}
            {viewMode === ResultViewMode.JSON && results && (
              <JsonMonacoViewer data={results} />
            )}
            {viewMode === ResultViewMode.PREVIEW_GRID && results && (
              <ResultsPreviewGrid
                data={results?.data || []}
                template={currentTemplate}
                engineName={engineName}
                key={templateRevision}
                rankFeatures={rankFeatures}
                rankImageFeatures={rankImageFeatures}
              />
            )}
            {viewMode === ResultViewMode.PREVIEW_FEED && results && (
              <ResultsPreviewFeed
                data={results?.data || []}
                template={currentTemplate}
                engineName={engineName}
                key={templateRevision}
                rankFeatures={rankFeatures}
                rankImageFeatures={rankImageFeatures}
              />
            )}
            {viewMode === ResultViewMode.PREVIEW_CAROUSEL && results && (
              <ResultsPreviewCarousel
                data={results?.data || []}
                template={currentTemplate}
                key={templateRevision}
                engineName={engineName}
                rankFeatures={rankFeatures}
                rankImageFeatures={rankImageFeatures}
              />
            )}
            {viewMode === ResultViewMode.PREVIEW_EDITORIAL && results && (
              <ResultsPreviewEditorial
                data={results?.data || []}
                template={currentTemplate}
                key={templateRevision}
                engineName={engineName}
              />
            )}
            {viewMode === ResultViewMode.PREVIEW_TICKER && results && (
              <ResultsPreviewHorizontal
                data={results.data}
                template={currentTemplate}
                key={templateRevision}
                engineName={engineName}
                rankFeatures={rankFeatures}
                rankImageFeatures={rankImageFeatures}
              />
            )}
            {viewMode === ResultViewMode.PREVIEW_LIST && results && (
              <ResultsPreviewList
                data={results.data}
                template={currentTemplate}
                key={templateRevision}
                engineName={engineName}
                rankFeatures={rankFeatures}
                rankImageFeatures={rankImageFeatures}
              />
            )}
            {viewMode === ResultViewMode.PREVIEW_MASONRY && results && (
              <ResultsPreviewMasonry
                data={results.data}
                template={currentTemplate}
                key={templateRevision}
                engineName={engineName}
                rankFeatures={rankFeatures}
                rankImageFeatures={rankImageFeatures}
              />
            )}
          </div>
        </div>
      )}

      {isPreviewMode && results && (
        <TemplateEditorDialog
          open={isTemplateEditorOpen}
          onOpenChange={setIsTemplateEditorOpen}
          previewMode={getPreviewMode()!}
          engineName={engineName || ""}
          sampleData={results.data[0] || null}
          onTemplateChange={handleTemplateChange}
          previewViewModes={previewViewModes}
          viewMode={viewMode}
          handleViewModeChange={handleViewModeChange}
        />
      )}
    </div>
  )
}
