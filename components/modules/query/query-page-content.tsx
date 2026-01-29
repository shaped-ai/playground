"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { useExecuteQuery } from "@/hooks/query/use-execute-query"
import { useQueryStateSync } from "@/hooks/query/use-query-state-sync"
import { QueryControls } from "@/components/modules/query/query-controls"
import { QueryEditor } from "@/components/modules/query/query-editor"
import { QueryResults } from "@/components/modules/query/query-results"
import { QueryParametersEditor } from "@/components/modules/query/query-parameters-editor"
import {
  EditorMode,
  type SavedQuery,
  type ParameterValue,
  ResultViewMode,
  QueryResult,
} from "@/lib/types/query.types"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"
import type { QueryPageState } from "@/lib/utils/query-state"
import { AccountType, ModelStatus } from "@/types/enums"
import type { ModelDetails } from "@/types"
import YAML from "yaml"
import { useQuery } from "@tanstack/react-query"
import { useEngineDetails } from "@/hooks/engines/use-engine-details"
import { EngineSelector } from "@/components/selector/engine-selector"
import {
  ArrowUpRight,
  BrainCircuit,
  HelpCircle,
  Loader2,
  Moon,
  Sun,
  TriangleAlert,
} from "lucide-react"
import ShapedLogo from "@/components/logo/shaped-logo"
import { AccountUpgradeModal } from "@/components/modals/account-upgrade-modal"
import { TRIAL_CREDIT_LIMIT, DEMO_ENGINES } from "@/lib/constants"
import { DEFAULT_SQL_QUERY } from "@/lib/constants/query.constants"
import { useIsMobile } from "@/hooks/shared/use-media-query"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useAnalytics } from "@/components/providers/analytics-provider"
import { useOnboardingTour } from "@/hooks/use-onboarding-tour"
import { QueryOnboardingOverlay } from "@/components/modules/query/query-onboarding-overlay"

// Helper function to get default parameter values for DEFAULT_SQL_QUERY
const getDefaultParameterValues = (content: string): ParameterValue => {
  if (content?.trim() === DEFAULT_SQL_QUERY.trim()) {
    return { query: "romeo and juliet" }
  }
  return {}
}

export function QueryPageContent({}: {}) {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const { theme, setTheme } = useTheme()
  const { trackEvent } = useAnalytics()

  // Direct state variables instead of tab-based state
  const [content, setContent] = useState<string>(DEFAULT_SQL_QUERY)
  const [engine, setEngine] = useState<string>("")
  const [editorMode, setEditorMode] = useState<EditorMode>(EditorMode.SQL)
  const [language, setLanguage] = useState<"yaml" | "sql">("sql")
  const [savedQueryId, setSavedQueryId] = useState<string | undefined>(
    undefined
  )
  const [parameterValues, setParameterValues] = useState<ParameterValue>(
    getDefaultParameterValues(DEFAULT_SQL_QUERY)
  )
  const [previewMode, setPreviewMode] = useState<ResultViewMode>(
    ResultViewMode.RAW_TABLE
  )
  const [isExecuting, setIsExecuting] = useState<boolean>(false)

  const [isInitialized, setIsInitialized] = useState(false)
  const [pendingRestoration, setPendingRestoration] = useState<{
    savedQueryId?: string
    parameterValues?: ParameterValue
    previewMode?: ResultViewMode
  } | null>(null)

  const [apiLatency, setApiLatency] = useState(0)
  const [results, setResults] = useState<QueryResult | null>(null)
  const [showDocumentation, setShowDocumentation] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [apiExplanation, setApiExplanation] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [rawResponse, setRawResponse] = useState<any>(null)
  const hasAutoRun = useRef(false)

  const selectedSavedQueryObject = useMemo(() => {
    if (!savedQueryId || !engine) return null
    const demoEngine = DEMO_ENGINES.find((e) => e.id === engine)
    if (!demoEngine?.saved_queries) return null
    const queries = demoEngine.saved_queries as SavedQuery[]
    const found = queries.find((q: SavedQuery) => q.id === savedQueryId)
    return found || null
  }, [savedQueryId, engine])

  const {
    data: engineDetails,
    isLoading: isLoadingEngineDetails,
    isError,
    error: organizationError,
  } = useEngineDetails(engine, {
    isDemoModel: false,
  })

  const {
    steps: tourSteps,
    isOpen: isTourOpen,
    currentStepIndex: tourStepIndex,
    startTour,
    nextStep: nextTourStep,
    prevStep: prevTourStep,
    skipTour,
    closeTour,
  } = useOnboardingTour(isMobile)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const hasSeenTour = localStorage.getItem(
      "playground-onboarding-tour-viewed"
    )
    if (!hasSeenTour) {
      startTour()
      localStorage.setItem("playground-onboarding-tour-viewed", "true")
    }
  }, [startTour])

  useEffect(() => {
    const hasViewedDocs = localStorage.getItem("query-docs-viewed")
    if (!hasViewedDocs) {
      setShowDocumentation(true)
      localStorage.setItem("query-docs-viewed", "true")
    }
  }, [])

  useEffect(() => {
    if (!pendingRestoration) return

    if (pendingRestoration.savedQueryId) {
      // Verify the query exists in DEMO_ENGINES
      const demoEngine = DEMO_ENGINES.find((e) => e.id === engine)
      const query = demoEngine?.saved_queries?.find(
        (q: SavedQuery) => q.id === pendingRestoration.savedQueryId
      )
      if (query) {
        setSavedQueryId(query.id)
      }
    }

    if (pendingRestoration.parameterValues) {
      setParameterValues(pendingRestoration.parameterValues)
    }

    if (pendingRestoration.previewMode) {
      setPreviewMode(pendingRestoration.previewMode)
    }

    setPendingRestoration(null)
  }, [pendingRestoration, engine])
  const { mutate: executeQuery, isPending, error } = useExecuteQuery()

  const getCurrentState = useCallback((): QueryPageState => {
    return {
      content,
      language,
      editorMode,
      engine: engine ?? "",
      savedQueryId,
      parameterValues,
      previewMode,
    }
  }, [
    content,
    language,
    editorMode,
    engine,
    savedQueryId,
    parameterValues,
    previewMode,
  ])

  const applyState = useCallback((state: QueryPageState) => {
    const contentToUse = state.content || DEFAULT_SQL_QUERY
    setContent(contentToUse)
    setLanguage(state.language || "sql")
    setEditorMode(state.editorMode || EditorMode.SQL)
    setEngine(state.engine ?? "")
    setSavedQueryId(state.savedQueryId)
    // Use provided parameterValues if it exists, otherwise use defaults for DEFAULT_SQL_QUERY
    // This ensures parameterValues from URL are properly restored
    if (state.parameterValues !== undefined) {
      setParameterValues(state.parameterValues)
    } else {
      setParameterValues(getDefaultParameterValues(contentToUse))
    }
    setPreviewMode(state.previewMode || ResultViewMode.RAW_TABLE)

    if (state.savedQueryId || state.parameterValues || state.previewMode) {
      setPendingRestoration({
        savedQueryId: state.savedQueryId,
        parameterValues: state.parameterValues,
        previewMode: state.previewMode,
      })
    }

    setIsInitialized(true)
  }, [])

  const { pushStateToHistory: pushToHistory } = useQueryStateSync(
    getCurrentState,
    applyState,
    true
  )

  const searchParams = useSearchParams()
  const hasProcessedEngineName = useRef(false)

  // Handle engineName query param - set the engine on the single query
  // Only process if there's no 'q' param (which means URL state restoration)
  useEffect(() => {
    // Skip if we've already processed engineName or if URL state exists
    if (hasProcessedEngineName.current) return
    const hasUrlState = searchParams?.get("q")
    if (hasUrlState) return

    const engineName = searchParams?.get("engineName")
    if (engineName && isInitialized) {
      hasProcessedEngineName.current = true
      setEngine(engineName)

      // Clean up the engineName param from URL
      const url = new URL(window.location.href)
      url.searchParams.delete("engineName")
      window.history.replaceState({}, "", url.toString())
    }
  }, [searchParams, isInitialized])

  useEffect(() => {
    setIsInitialized(true)
  }, [])

  const handleEngineChange = useCallback(
    (engineValue: string) => {
      setEngine(engineValue)
      setSavedQueryId(undefined)
      // Reset to default parameter values if using DEFAULT_SQL_QUERY
      setParameterValues(getDefaultParameterValues(content))

      if (isInitialized) {
        setTimeout(() => {
          const state = getCurrentState()
          pushToHistory(state)
        }, 100)
      }
    },
    [isInitialized, getCurrentState, pushToHistory, content]
  )

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    // Update parameter values when content changes to DEFAULT_SQL_QUERY
    if (newContent?.trim() === DEFAULT_SQL_QUERY.trim()) {
      const defaultParams = getDefaultParameterValues(newContent)
      // Only set defaults if parameterValues is empty or doesn't have the query param
      if (!parameterValues.query || Object.keys(parameterValues).length === 0) {
        setParameterValues(defaultParams)
      }
    }
  }

  const handleEditorModeChange = (mode: EditorMode) => {
    setEditorMode(mode)
  }

  const parameterValuesEqual = (
    a: ParameterValue | undefined,
    b: ParameterValue | undefined
  ) => {
    if (a === b) return true
    const valuesA = a ?? {}
    const valuesB = b ?? {}
    const keysA = Object.keys(valuesA)
    const keysB = Object.keys(valuesB)
    if (keysA.length !== keysB.length) return false
    return keysA.every((key) => valuesA[key] === valuesB[key])
  }

  // Detect parameter references in query content
  // Supports: $query, $parameters.query, $params.key, :key patterns
  const detectParametersInContent = useCallback((content: string): string[] => {
    if (!content) return []
    const parameters = new Set<string>()

    // Normalize content: remove invisible Unicode characters that might be introduced by copy-paste
    // This includes zero-width spaces, non-breaking spaces, and other invisible characters
    // but preserves the actual dollar sign and other visible characters
    const normalizedContent = content
      .replace(/[\u200B-\u200D\uFEFF]/g, "") // Remove zero-width spaces and BOM
      .replace(/\u00A0/g, " ") // Replace non-breaking space with regular space
      .replace(/[\u2028\u2029]/g, "\n") // Replace line/paragraph separators with newline

    // Match $query, $parameters.query, $params.key patterns
    // Use explicit dollar sign character (U+0024) to avoid matching similar Unicode characters
    const dollarPattern = /\$(?:parameters?\.)?(\w+)/g
    const dollarMatches = normalizedContent.matchAll(dollarPattern)
    for (const match of dollarMatches) {
      if (match[1]) {
        parameters.add(match[1])
      }
    }

    // Match :key patterns (colon prefix)
    const colonPattern = /:(\w+)\b/g
    const colonMatches = normalizedContent.matchAll(colonPattern)
    for (const match of colonMatches) {
      if (match[1]) {
        parameters.add(match[1])
      }
    }

    return Array.from(parameters)
  }, [])

  // Get detected parameters from current editor content
  const detectedParameters = useMemo(() => {
    return detectParametersInContent(content ?? "")
  }, [content, detectParametersInContent])

  // Get the parameters to display - prioritize saved query parameters if content matches template
  const displayParameters = useMemo(() => {
    // Check if content matches the saved query template
    const contentMatchesSavedQuery =
      selectedSavedQueryObject &&
      content?.trim() === selectedSavedQueryObject.template?.trim()

    // If we have a saved query with parameters AND content matches the template, use saved query parameters
    if (
      contentMatchesSavedQuery &&
      selectedSavedQueryObject.parameters.length > 0
    ) {
      return selectedSavedQueryObject.parameters
    }
    // Otherwise, use detected parameters from content (including when content has been modified)
    return detectedParameters.map((name) => ({
      name,
      type: "string" as const,
      required: false,
    }))
  }, [selectedSavedQueryObject, detectedParameters, content])

  // Check if parameters pane should be shown
  const shouldShowParametersPane = useMemo(() => {
    // Show if saved query has parameters OR if content has parameter references
    return (
      (selectedSavedQueryObject?.parameters.length ?? 0) > 0 ||
      detectedParameters.length > 0
    )
  }, [selectedSavedQueryObject, detectedParameters])

  const handleSavedQuerySelect = (query: SavedQuery | null) => {
    const nextSavedQueryId = query?.id ?? null
    const nextParameterValues: ParameterValue = {}

    // Set default parameter values if query has parameters
    if (query && query.parameters) {
      query.parameters.forEach((param) => {
        // Use value if present, otherwise fall back to defaultValue
        if (param.value !== undefined) {
          nextParameterValues[param.name] = param.value
        } else if (param.defaultValue !== undefined) {
          nextParameterValues[param.name] = param.defaultValue
        }
        // If neither exists, don't set it - let the Input component handle the fallback
      })
    }

    if (
      savedQueryId === nextSavedQueryId &&
      parameterValuesEqual(parameterValues, nextParameterValues)
    ) {
      return
    }

    // Update state with saved query ID, parameters, and immediately update editor content
    // Use React.startTransition or ensure all state updates happen together
    setSavedQueryId(nextSavedQueryId ?? undefined)
    setParameterValues(nextParameterValues)
    setContent(query?.template ?? content ?? "")

    // Apply defaultViewMode if specified in the query configuration
    if (query?.defaultViewMode) {
      setPreviewMode(query.defaultViewMode)
    }
  }

  const handlePreviewModeChange = useCallback(
    (mode: ResultViewMode) => {
      setPreviewMode(mode)

      if (isInitialized) {
        setTimeout(() => {
          const state = getCurrentState()
          pushToHistory(state)
        }, 100)
      }
    },
    [isInitialized, getCurrentState, pushToHistory]
  )

  const handleParameterValuesChange = useCallback((values: ParameterValue) => {
    setParameterValues(values)
  }, [])

  const handleRun = () => {
    const startTime = performance.now()

    // On first run (when results is null), default to Masonry preview mode
    // But only if the selected query doesn't have a defaultViewMode configured
    if (results === null && !selectedSavedQueryObject?.defaultViewMode) {
      setPreviewMode(ResultViewMode.RAW_TABLE)
    }

    setIsExecuting(true)
    // Use model_uri from engineDetails if available (for demo engines),
    // otherwise fall back to engine (for non-demo engines)
    const actualEngineId = engineDetails?.model_uri ?? engine ?? ""
    executeQuery(
      {
        engine: actualEngineId,
        query:
          language === "yaml" ? YAML.parse(content ?? "") : (content ?? ""),
        parameters: parameterValues,
      },
      {
        onSuccess: (results) => {
          console.log("[DEBUG] Regular query API response:", results)
          // Handle both wrapped { data: { results: [...] ] } and unwrapped { results: [...] } structures
          const resultsArray = Array.isArray(results?.data?.results)
            ? results.data.results
            : Array.isArray((results as any)?.results)
              ? (results as any).results
              : []
          const responseData = results?.data || results
          setRawResponse(responseData)
          console.log("[DEBUG] Raw results after check:", {
            results: resultsArray,
          })
          console.log("[DEBUG] Results array length:", resultsArray.length)
          if (responseData?.explanation) {
            setApiExplanation(responseData.explanation)
          }
          const hasScore = resultsArray?.some(
            (item: any) => item.score !== undefined
          )
          const normalizedResults: QueryResult = {
            data: resultsArray.map((item: any) => ({
              id: item.id,
              ...(hasScore ? { score: item.score } : {}),
              ...(item.metadata ?? {}),
            })),
            executionTime: (responseData as any)?.executionTime ?? 0,
            rowCount: resultsArray.length,
            columns: resultsArray.length
              ? Object.keys({
                  id: resultsArray[0]?.id,
                  score: resultsArray[0]?.score,
                  ...(resultsArray[0]?.metadata ?? {}),
                })
              : [],
            entity_type: (responseData as any)?.entity_type,
          }
          console.log(
            "[DEBUG] Normalized results (regular query):",
            normalizedResults
          )
          console.log(
            "[DEBUG] Normalized results data length:",
            normalizedResults.data?.length
          )
          setResults(normalizedResults)
          setIsExecuting(false)

          // Track query execution event
          trackEvent("playground_query_executed", {
            engine: actualEngineId,
            has_parameters: Object.keys(parameterValues).length > 0,
            result_count: normalizedResults.rowCount,
            execution_time_ms: normalizedResults.executionTime,
            saved_query_id: savedQueryId,
          })

          if (isInitialized) {
            setTimeout(() => {
              const state = getCurrentState()
              pushToHistory(state)
            }, 100)
          }
        },
        onError: (error) => {
          setIsExecuting(false)
        },
      }
    )
    const latency = ((performance.now() - startTime) / 1000).toFixed(4)
    setApiLatency(Number(latency))
  }

  const handleRunWithConditions = useCallback(() => {
    const canRun =
      engineDetails?.status !== ModelStatus.ERROR && !isLoadingEngineDetails

    if (canRun) {
      handleRun()
    }
  }, [engineDetails?.status, isLoadingEngineDetails, handleRun])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const canRun =
        engineDetails?.status !== ModelStatus.ERROR && !isLoadingEngineDetails

      const isCtrlEnter =
        (event.ctrlKey || event.metaKey) && event.key === "Enter"

      if (isCtrlEnter && canRun) {
        const activeElement = document.activeElement
        const isEditorFocused =
          activeElement?.tagName === "TEXTAREA" ||
          activeElement?.classList.contains("monaco-editor") ||
          activeElement?.closest(".monaco-editor")

        if (!isEditorFocused) {
          event.preventDefault()
          handleRun()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [pathname, engineDetails?.status, isLoadingEngineDetails, handleRun])

  const replaceParameters = (
    template: string,
    params: ParameterValue
  ): string => {
    let result = template
    Object.entries(params).forEach(([key, value]) => {
      result = result.replace(new RegExp(`:${key}\\b`, "g"), String(value))
      result = result.replace(
        new RegExp(`\\$params\\.${key}\\b`, "g"),
        String(value)
      )
    })
    return result
  }

  const currentEditorMode = editorMode || EditorMode.PLAIN
  // Selecting a saved query should only replace the editor content (not lock the UI)
  const isReadOnly = false

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border bg-background-base px-3 py-2 md:px-6 md:py-4 flex flex-row items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-sm md:text-xl font-semibold text-foreground">
            ShapedQL Playground
          </h1>
          <p className="hidden md:block text-xs md:text-sm text-foreground-muted mt-1">
            Explore ShapedQL syntax with a live editor and query examples.{" "}
            <a
              href="https://docs.shaped.ai/docs/v2/query_reference/shapedql"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-brand-purple hover:underline inline-flex items-center gap-1"
              onClick={() =>
                trackEvent("playground_documentation_clicked", {
                  source: "header_link",
                })
              }
            >
              Read the docs
              <ArrowUpRight className="size-3" />
            </a>
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1 md:gap-2">
          {mounted && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-7 w-7 md:h-8 md:w-8 shrink-0 rounded-lg cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="size-3 md:size-4 text-foreground" />
              ) : (
                <Moon className="size-3 md:size-4 text-foreground" />
              )}
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => startTour(true)}
            className="h-7 w-7 md:h-8 md:w-8 shrink-0 rounded-lg cursor-pointer"
            aria-label="Start guided tour"
          >
            <HelpCircle className="size-3 md:size-4 text-foreground" />
          </Button>
          <Button
            asChild
            className="hidden md:flex h-auto shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-border-active bg-background-accent px-2 py-2 text-xs font-medium text-accent-brand-off-white hover:border-border-active hover:bg-accent-active"
            variant="default"
          >
            <Link
              href="https://console.shaped.ai/register?utm_source=playground&utm_medium=product&utm_campaign=shapedql&utm_content=register_cta"
              target="_blank"
              onClick={() =>
                trackEvent("playground_register_clicked", {
                  source: "desktop_header",
                })
              }
            >
              Load your own dataset
            </Link>
          </Button>
        </div>
      </div>

      {isLoadingEngineDetails ? (
        <div className="flex min-h-0 flex-1 items-center justify-center bg-background-solid">
          <Loader2
            className="size-4 animate-spin text-foreground"
            strokeWidth={1.25}
          />
        </div>
      ) : engineDetails?.status == ModelStatus.ERROR ? (
        <div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-sm font-bold text-foreground">Engine</span>
            <EngineSelector
              selectedEngine={engine}
              onEngineChange={handleEngineChange}
            />
          </div>
          <div className="mx-4 mt-4 flex flex-col overflow-hidden rounded-md border border-border">
            <div className="flex items-center justify-between border-b border-border bg-background-base p-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg border border-accent-brand-red p-1.5">
                    <TriangleAlert
                      className="size-4 shrink-0 text-accent-brand-red"
                      strokeWidth={1.5}
                    />
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    Engine Error
                  </span>
                </div>
              </div>
              <a
                href="https://docs.shaped.ai/docs/v2/guides/errors"
                target="_blank"
                className="flex items-center gap-1 rounded-lg border border-border bg-background-primary px-3 py-1.5 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] hover:bg-background-secondary"
              >
                <span className="text-xs font-medium text-foreground">
                  Common Errors
                </span>
                <ArrowUpRight
                  className="size-4 shrink-0 text-accent-brand-purple"
                  strokeWidth={1.25}
                />
              </a>
            </div>
            <div className="p-4">
              <p className="text-sm text-foreground">
                {(engineDetails as any)?.error_message ||
                  "An error occurred with this engine."}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <ResizablePanelGroup
            {...({ direction: isMobile ? "vertical" : "horizontal" } as any)}
            className="flex-1 h-full w-full"
          >
            <ResizablePanel
              defaultSize={60}
              minSize={20}
              maxSize={80}
              className="bg-background-solid"
            >
              <div className="flex h-full flex-col bg-background-solid pt-2 pb-0">
                <div className="shrink-0">
                  <QueryControls
                    engineDetails={
                      (engineDetails ?? undefined) as ModelDetails | undefined
                    }
                    selectedEngine={engine ?? ""}
                    onEngineChange={handleEngineChange}
                    selectedQueryId={savedQueryId}
                    onSavedQuerySelect={handleSavedQuerySelect}
                    onRun={handleRun}
                    isExecuting={isExecuting}
                  />

                  {/* {!selectedSavedQueryObject && (
                  <EditorModeSelector
                    mode={currentEditorMode}
                    onChange={handleEditorModeChange}
                  />
                )} */}
                </div>

                {!engine ? (
                  <div className="flex flex-1 items-center justify-center">
                    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-background-base p-6">
                      <BrainCircuit className="size-10 text-accent-brand-purple" />
                      <h2 className="text-sm font-semibold text-foreground">
                        No engines avalable to ingest data
                      </h2>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
                    {(engineDetails?.status == ModelStatus.ACTIVE ||
                      engineDetails?.status == ModelStatus.IDLE) && (
                      <>
                        {shouldShowParametersPane ? (
                          <ResizablePanelGroup
                            direction="vertical"
                            className="flex-1 h-full w-full"
                          >
                            <ResizablePanel
                              defaultSize={70}
                              minSize={30}
                              maxSize={85}
                              className="overflow-hidden"
                              data-tour="sql-editor"
                            >
                              <div className="h-full overflow-hidden rounded-lg bg-background-solid">
                                <QueryEditor
                                  value={content}
                                  onChange={handleContentChange}
                                  mode={currentEditorMode}
                                  readOnly={isReadOnly}
                                  onRun={handleRunWithConditions}
                                />
                              </div>
                            </ResizablePanel>

                            <ResizableHandle />

                            <ResizablePanel
                              defaultSize={30}
                              minSize={15}
                              maxSize={70}
                              className="overflow-y-auto"
                            >
                              <QueryParametersEditor
                                parameters={displayParameters}
                                values={parameterValues}
                                onChange={handleParameterValuesChange}
                                onRun={handleRun}
                                isExecuting={isExecuting}
                                engineDetails={
                                  (engineDetails ?? undefined) as
                                    | ModelDetails
                                    | undefined
                                }
                              />
                            </ResizablePanel>
                          </ResizablePanelGroup>
                        ) : (
                          <div data-tour="sql-editor" className="flex-1">
                            <div className="h-full overflow-hidden rounded-lg bg-background-solid">
                              <QueryEditor
                                value={content}
                                onChange={handleContentChange}
                                mode={currentEditorMode}
                                readOnly={isReadOnly}
                                onRun={handleRunWithConditions}
                              />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    {((engineDetails?.status != ModelStatus.ACTIVE &&
                      engineDetails?.status != ModelStatus.IDLE) ||
                      !engine) && (
                      <div className="flex flex-1 flex-col items-center justify-center p-4">
                        <ShapedLogo className="size-10 mb-4" />
                        <p className="text-sm font-medium text-foreground">
                          Your engine is scheduling and will be ready to query
                          soon.
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          Please check again in a little bit.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel
              defaultSize={50}
              minSize={20}
              maxSize={80}
              className="h-full overflow-y-auto"
              data-tour="results-pane"
            >
              {engineDetails?.status == ModelStatus.ACTIVE ||
              engineDetails?.status == ModelStatus.IDLE ||
              showDocumentation ? (
                <div className="h-full rounded-lg bg-background-solid">
                  <QueryResults
                    results={results || null}
                    isExecuting={isExecuting}
                    error={error}
                    rawResponse={rawResponse}
                    previewMode={previewMode}
                    onPreviewModeChange={handlePreviewModeChange}
                    engineDetails={
                      (engineDetails ?? undefined) as ModelDetails | undefined
                    }
                    engineName={engine ?? ""}
                    apiLatency={apiExplanation?.total_execution_time_ms}
                    showDocumentation={showDocumentation}
                    savedQueryId={savedQueryId}
                  />
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center bg-background-solid p-4">
                  <ShapedLogo className="size-10 mb-4" />
                  <p className="text-sm font-medium text-foreground">
                    Your engine is scheduling and will be ready to query soon.
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    Please check again in a little bit.
                  </p>
                </div>
              )}
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      )}

      {/* Floating "Add your own data" button for mobile */}
      {isMobile && (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
          <Button
            asChild
            className="flex w-full h-auto cursor-pointer items-center justify-center gap-2 rounded-xl border border-border-active bg-background-accent px-4 py-3 text-sm font-medium text-accent-brand-off-white shadow-lg hover:border-border-active hover:bg-accent-active"
            variant="default"
          >
            <Link
              href="https://console.shaped.ai/register?utm_source=playground&utm_medium=product&utm_campaign=shapedql&utm_content=register_cta"
              target="_blank"
              onClick={() =>
                trackEvent("playground_register_clicked", {
                  source: "mobile_floating",
                })
              }
            >
              Add your own data
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>
      )}
      {mounted && (
        <QueryOnboardingOverlay
          steps={tourSteps}
          currentStepIndex={tourStepIndex}
          isOpen={isTourOpen}
          onNext={nextTourStep}
          onPrev={prevTourStep}
          onSkip={skipTour}
          onClose={closeTour}
        />
      )}
    </div>
  )
}
