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
  Loader2,
  TriangleAlert,
} from "lucide-react"
import ShapedLogo from "@/components/logo/shaped-logo"
import { AccountUpgradeModal } from "@/components/modals/account-upgrade-modal"
import { TRIAL_CREDIT_LIMIT, DEMO_ENGINES } from "@/lib/constants"
import { DEFAULT_SQL_QUERY } from "@/lib/constants/query.constants"

export function QueryPageContent({}: {}) {
  const pathname = usePathname()
  
  // Direct state variables instead of tab-based state
  const [content, setContent] = useState<string>(DEFAULT_SQL_QUERY)
  const [engine, setEngine] = useState<string>("")
  const [editorMode, setEditorMode] = useState<EditorMode>(EditorMode.SQL)
  const [language, setLanguage] = useState<"yaml" | "sql">("sql")
  const [savedQueryId, setSavedQueryId] = useState<string | undefined>(undefined)
  const [parameterValues, setParameterValues] = useState<ParameterValue>({})
  const [previewMode, setPreviewMode] = useState<ResultViewMode>(ResultViewMode.RAW_TABLE)
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
  }, [content, language, editorMode, engine, savedQueryId, parameterValues, previewMode])

  const applyState = useCallback(
    (state: QueryPageState) => {
      setContent(state.content || DEFAULT_SQL_QUERY)
      setLanguage(state.language || "sql")
      setEditorMode(state.editorMode || EditorMode.SQL)
      setEngine(state.engine ?? "")
      setSavedQueryId(state.savedQueryId)
      setParameterValues(state.parameterValues || {})
      setPreviewMode(state.previewMode || ResultViewMode.RAW_TABLE)

      if (state.savedQueryId || state.parameterValues || state.previewMode) {
        setPendingRestoration({
          savedQueryId: state.savedQueryId,
          parameterValues: state.parameterValues,
          previewMode: state.previewMode,
        })
      }

      setIsInitialized(true)
    },
    []
  )

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
      setParameterValues({})

      if (isInitialized) {
        setTimeout(() => {
          const state = getCurrentState()
          pushToHistory(state)
        }, 100)
      }
    },
    [isInitialized, getCurrentState, pushToHistory]
  )

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
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
    
    // Match $query, $parameters.query, $params.key patterns
    const dollarPattern = /\$(?:parameters?\.)?(\w+)/g
    const dollarMatches = content.matchAll(dollarPattern)
    for (const match of dollarMatches) {
      if (match[1]) {
        parameters.add(match[1])
      }
    }
    
    // Match :key patterns (colon prefix)
    const colonPattern = /:(\w+)\b/g
    const colonMatches = content.matchAll(colonPattern)
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
    if (query) {
      query.parameters.forEach((param) => {
        // Use value if present, otherwise fall back to defaultValue
        if (param.value !== undefined) {
          nextParameterValues[param.name] = param.value
        } else if (param.defaultValue !== undefined) {
          nextParameterValues[param.name] = param.defaultValue
        }
      })
    }

    if (
      savedQueryId === nextSavedQueryId &&
      parameterValuesEqual(parameterValues, nextParameterValues)
    ) {
      return
    }

    // Update state with saved query ID, parameters, and immediately update editor content
    setSavedQueryId(nextSavedQueryId ?? undefined)
    setParameterValues(nextParameterValues)
    setContent(query?.template ?? content ?? "")
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

  const handleParameterValuesChange = useCallback(
    (values: ParameterValue) => {
      setParameterValues(values)
    },
    []
  )

  const handleRun = () => {
    const startTime = performance.now()

    // On first run (when results is null), default to Masonry preview mode
    if (results === null) {
      setPreviewMode(ResultViewMode.PREVIEW_MASONRY)
    }

    setIsExecuting(true)
    executeQuery(
      {
        engine: engine ?? "",
        query:
          language === "yaml"
            ? YAML.parse(content ?? "")
            : content ?? "",
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
            console.log("[DEBUG] Raw results after check:", { results: resultsArray })
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
            console.log("[DEBUG] Normalized results (regular query):", normalizedResults)
            console.log("[DEBUG] Normalized results data length:", normalizedResults.data?.length)
            setResults(normalizedResults)
            setIsExecuting(false)

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
      <div className="shrink-0 border-b border-border bg-background-base px-6 py-4">
        <h1 className="text-xl font-semibold text-foreground">
          ShapedQL Playground
        </h1>
        <p className="text-sm text-foreground-muted">
          
          <a
            href="https://docs.shaped.ai/docs/v2/query_reference/shapedql"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-brand-purple hover:underline inline-flex items-center gap-1"
          >
            Read the docs
            <ArrowUpRight className="size-3" />
          </a>
        </p>
      </div>

      {isLoadingEngineDetails ? (
        <div
          className="flex min-h-0 flex-1 items-center justify-center bg-background-solid"
        >
          <Loader2
            className="size-4 animate-spin text-foreground"
            strokeWidth={1.25}
          />
        </div>
      ) : engineDetails?.status == ModelStatus.ERROR ? (
        <div>
          <div className="flex shrink-0 items-center gap-2 px-3 py-1.5">
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
                {(engineDetails as any)?.error_message || "An error occurred with this engine."}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <ResizablePanelGroup
            {...({ direction: "horizontal" } as any)}
            className="flex-1 h-full w-full"
          >
            <ResizablePanel
              defaultSize={50}
              minSize={20}
              maxSize={80}
              className="bg-background-solid"
            >
              <div className="flex h-full flex-col bg-background-solid px-4 py-2">
                <div className="shrink-0">
                  <QueryControls
                    engineDetails={(engineDetails ?? undefined) as ModelDetails | undefined}
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
                  <div className="flex min-h-0 flex-1 flex-col ">
                    {(engineDetails?.status == ModelStatus.ACTIVE ||
                      engineDetails?.status == ModelStatus.IDLE) && (
                      <div
                        className={
                          shouldShowParametersPane
                            ? "h-[400px] shrink-0"
                            : "min-h-0 flex-1"
                        }
                      >
                        <QueryEditor
                          value={content}
                          onChange={handleContentChange}
                          mode={currentEditorMode}
                          readOnly={isReadOnly}
                          onRun={handleRunWithConditions}
                        />
                      </div>
                    )}
                    {((engineDetails?.status != ModelStatus.ACTIVE &&
                      engineDetails?.status != ModelStatus.IDLE) ||
                      !engine) && (
                      <div className="flex flex-1 flex-col items-center justify-center p-4">
                        <ShapedLogo className="size-10 mb-4" />
                        <p className="text-sm font-medium text-foreground">
                          Your engine is scheduling and will be ready to
                          query soon.
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          Please check again in a little bit.
                        </p>
                      </div>
                    )}

                    {shouldShowParametersPane && (
                      <div className="shrink-0">
                        <QueryParametersEditor
                          parameters={
                            selectedSavedQueryObject &&
                            selectedSavedQueryObject.parameters.length > 0
                              ? selectedSavedQueryObject.parameters
                              : detectedParameters.map((name) => ({
                                  name,
                                  type: "string" as const,
                                  required: false,
                                }))
                          }
                          values={parameterValues}
                          onChange={handleParameterValuesChange}
                          onRun={handleRun}
                          isExecuting={isExecuting}
                          engineDetails={(engineDetails ?? undefined) as ModelDetails | undefined}
                        />
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
            >
              {engineDetails?.status == ModelStatus.ACTIVE ||
              engineDetails?.status == ModelStatus.IDLE ? (
                <QueryResults
                  results={results || null}
                  isExecuting={isExecuting}
                  error={error}
                  previewMode={previewMode}
                  onPreviewModeChange={handlePreviewModeChange}
                  engineDetails={(engineDetails ?? undefined) as ModelDetails | undefined}
                  engineName={engine ?? ""}
                  apiLatency={apiExplanation?.total_execution_time_ms}
                  showDocumentation={showDocumentation}
                />
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
    </div>
  )
}
