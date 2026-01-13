"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { useQueryTabs } from "@/hooks/query/use-query-tabs"
import { useExecuteQuery } from "@/hooks/query/use-execute-query"
import { useExecuteSavedQuery } from "@/hooks/query/use-execute-saved-query"
import { useSavedQueries } from "@/hooks/query/use-saved-queries"
import { useSavedQueryDetails } from "@/hooks/query/use-saved-query-details"
import { useQueryStateSync } from "@/hooks/query/use-query-state-sync"
import { QueryTabs } from "@/components/modules/query/query-tabs"
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
  type QueryTab,
} from "@/lib/types/query.types"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"
import type { QueryPageState, QueryTabState } from "@/lib/utils/query-state"
import { AccountType, ModelStatus } from "@/types/enums"
import { cn } from "@/lib/utils"
import YAML from "yaml"
import { getOrganizationInfo } from "@/utils/organization-info"
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
import { useOrganization } from "@/hooks/use-organization"
import { AccountUpgradeModal } from "@/components/modals/account-upgrade-modal"
import { TRIAL_CREDIT_LIMIT } from "@/lib/constants"
import { DEFAULT_SQL_QUERY } from "@/lib/constants/query.constants"
import axios from "axios"

export function QueryPageContent({}: {}) {
  const pathname = usePathname()
  const {
    tabs,
    activeTabId,
    activeTab,
    addTab,
    closeTab,
    updateTab,
    renameTab,
    setActiveTabId,
    setTabs,
  } = useQueryTabs()

  const [isEditorVisible, setIsEditorVisible] = useState(true)
  const [isResultsVisible, setIsResultsVisible] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [pendingRestoration, setPendingRestoration] = useState<{
    savedQueryId?: string
    parameterValues?: ParameterValue
    previewMode?: ResultViewMode
  } | null>(null)

  const selectedEngine = useMemo(() => activeTab?.engine, [activeTab])
  const selectedSavedQuery = activeTab?.savedQueryId
  const parameterValues = activeTab?.parameterValues || {}
  const previewMode = activeTab?.previewMode || ResultViewMode.RAW_TABLE
  const [apiLatency, setApiLatency] = useState(0)
  const [resultsByTab, setResultsByTab] = useState<
    Record<string, QueryResult | null>
  >({})
  const [showDocumentation, setShowDocumentation] = useState(false)
  const [savedQueryParams, setSavedQueryParams] = useState<any>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [apiExplanation, setApiExplanation] = useState<any>(null)
  const { organization } = useOrganization()
  const { data: savedQueriesData, isLoading: isLoadingQueries } =
    useSavedQueries(selectedEngine)

  const selectedSavedQueryObject = selectedSavedQuery
    ? savedQueriesData?.queries?.find((q) => q.id === selectedSavedQuery) ||
      null
    : null

  // Fetch saved query details when a saved query is selected
  const { data: savedQueryDetails, isLoading: isLoadingQueryDetails } =
    useSavedQueryDetails(selectedEngine, selectedSavedQueryObject?.name)

  const {
    data: engineDetails,
    isLoading: isLoadingEngineDetails,
    isError,
    organizationError,
  } = useEngineDetails(selectedEngine, {
    isDemoModel: false,
  })

  useEffect(() => {
    const hasViewedDocs = localStorage.getItem("query-docs-viewed")
    if (!hasViewedDocs) {
      setShowDocumentation(true)
      localStorage.setItem("query-docs-viewed", "true")
    }
  }, [])

  // Update editor content when saved query details are fetched
  useEffect(() => {
    if (
      savedQueryDetails?.query &&
      selectedSavedQueryObject &&
      activeTab?.savedQueryId === selectedSavedQueryObject.id
    ) {
      updateTab(activeTabId, {
        content: savedQueryDetails.query,
      })
    }
  }, [
    savedQueryDetails,
    selectedSavedQueryObject,
    activeTab?.savedQueryId,
    activeTabId,
    updateTab,
  ])

  useEffect(() => {
    if (!pendingRestoration || !savedQueriesData?.queries || isLoadingQueries)
      return

    const updates: Partial<QueryTabState> = {}

    if (pendingRestoration.savedQueryId) {
      const query = savedQueriesData.queries.find(
        (q) => q.id === pendingRestoration.savedQueryId
      )
      if (query) {
        updates.savedQueryId = query.id
      }
    }

    if (pendingRestoration.parameterValues) {
      updates.parameterValues = pendingRestoration.parameterValues
    }

    if (pendingRestoration.previewMode) {
      updates.previewMode = pendingRestoration.previewMode
    }

    if (Object.keys(updates).length > 0) {
      updateTab(activeTabId, updates)
    }

    setPendingRestoration(null)
  }, [
    pendingRestoration,
    savedQueriesData,
    isLoadingQueries,
    activeTabId,
    updateTab,
  ])
  const { mutate: executeQuery, isPending, error } = useExecuteQuery()
  const { mutate: executeSavedQuery, error: savedQueryError } =
    useExecuteSavedQuery()

  const getCurrentState = useCallback((): QueryPageState => {
    return {
      tabs: tabs.map((tab) => ({
        id: tab.id,
        name: tab.name,
        content: tab.content,
        language: tab.language,
        editorMode: tab.editorMode,
        // Preserve engine value, default to empty string only if truly undefined/null
        engine: tab.engine ?? "",
        savedQueryId: tab.savedQueryId,
        parameterValues: tab.parameterValues,
        previewMode: tab.previewMode,
        // Results are NOT included in URL state - they remain in localStorage only
      })),
      activeTabId,
    }
  }, [tabs, activeTabId])

  const applyState = useCallback(
    (state: QueryPageState) => {
      // Try to get existing tabs from localStorage to preserve results
      let existingTabs: QueryTab[] = []
      try {
        const stored = localStorage.getItem("query-tabs")
        if (stored) {
          const parsed = JSON.parse(stored)
          existingTabs = parsed.tabs || []
        }
      } catch (error) {
        // Ignore localStorage errors
      }

      const restoredTabs = state.tabs.map((tabState) => {
        // Find matching existing tab by ID to preserve results from localStorage
        const existingTab = existingTabs.find((t) => t.id === tabState.id)

        return {
          id: tabState.id,
          name: tabState.name,
          content: tabState.content,
          language: tabState.language,
          editorMode: tabState.editorMode,
          // Preserve engine value from state, including empty strings
          engine: tabState.engine ?? "",
          savedQueryId: tabState.savedQueryId,
          parameterValues: tabState.parameterValues,
          previewMode: tabState.previewMode,
          // Preserve results from localStorage (not in URL state)
          results: existingTab?.results,
          isExecuting: false,
        }
      })

      setTabs(restoredTabs)
      setActiveTabId(state.activeTabId)

      const activeTabState = state.tabs.find((t) => t.id === state.activeTabId)
      if (
        activeTabState &&
        (activeTabState.savedQueryId ||
          activeTabState.parameterValues ||
          activeTabState.previewMode)
      ) {
        setPendingRestoration({
          savedQueryId: activeTabState.savedQueryId,
          parameterValues: activeTabState.parameterValues,
          previewMode: activeTabState.previewMode,
        })
      }

      setIsInitialized(true)
    },
    [setTabs, setActiveTabId, updateTab]
  )

  const { pushStateToHistory: pushToHistory } = useQueryStateSync(
    getCurrentState,
    applyState,
    true
  )

  const searchParams = useSearchParams()
  const hasProcessedEngineName = useRef(false)

  // Handle engineName query param - create a new tab with the specified engine
  // Only process if there's no 'q' param (which means URL state restoration)
  useEffect(() => {
    // Skip if we've already processed engineName or if URL state exists
    if (hasProcessedEngineName.current) return
    const hasUrlState = searchParams?.get("q")
    if (hasUrlState) return

    const engineName = searchParams?.get("engineName")
    if (engineName && tabs.length > 0 && isInitialized) {
      hasProcessedEngineName.current = true

      const newTabId = `engine-${engineName}-${Date.now()}`
      const newTab: QueryTab = {
        id: newTabId,
        name: `Query ${tabs.length + 1}`,
        content: DEFAULT_SQL_QUERY,
        language: "sql",
        editorMode: EditorMode.SQL,
        engine: engineName,
      }
      setTabs((prevTabs) => [...prevTabs, newTab])
      setActiveTabId(newTabId)

      // Clean up the engineName param from URL
      const url = new URL(window.location.href)
      url.searchParams.delete("engineName")
      window.history.replaceState({}, "", url.toString())
    }
  }, [searchParams, tabs, isInitialized, setTabs, setActiveTabId])

  useEffect(() => {
    setIsInitialized(true)
  }, [])

  const handleTabClick = useCallback(
    (tabId: string) => {
      setActiveTabId(tabId)
      if (isInitialized) {
        setTimeout(() => {
          const state = getCurrentState()
          pushToHistory(state)
        }, 100)
      }
    },
    [setActiveTabId, isInitialized, getCurrentState, pushToHistory]
  )

  const handleEngineChange = useCallback(
    (engine: string) => {
      updateTab(activeTabId, {
        engine,
        savedQueryId: undefined,
        parameterValues: {},
      })

      if (isInitialized) {
        setTimeout(() => {
          const state = getCurrentState()
          pushToHistory(state)
        }, 100)
      }
    },
    [activeTabId, updateTab, isInitialized, getCurrentState, pushToHistory]
  )

  useEffect(() => {
    const getSelectedSavedQueryDetails = async () => {
      if (activeTab?.savedQueryId && selectedEngine) {
        const savedQueryDetails = await axios.get(
          `/api/query/saved/query-details`,
          {
            headers: {
              "x-api-key": `${organization?.apiKey}`,
            },
            params: {
              engineName: selectedEngine,
              queryName: activeTab?.savedQueryId,
            },
          }
        )
        updateTab(activeTabId, { content: savedQueryDetails.data.query })
      }
    }
    getSelectedSavedQueryDetails()
  }, [activeTab?.savedQueryId, savedQueriesData?.queries, selectedEngine])

  const handleContentChange = (content: string) => {
    updateTab(activeTabId, { content })
  }

  const handleEditorModeChange = (mode: EditorMode) => {
    updateTab(activeTabId, { editorMode: mode })
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

  const handleSavedQuerySelect = (query: string | null) => {
    // const nextSavedQueryId = query?.id || null
    const nextSavedQueryId = query ?? null
    const nextParameterValues: ParameterValue = {}
    // if (query) {
    //   query.parameters.forEach((param) => {
    //     if (param.defaultValue !== undefined) {
    //       nextParameterValues[param.name] = param.defaultValue
    //     }
    //   })
    // }

    if (
      activeTab?.savedQueryId === nextSavedQueryId &&
      parameterValuesEqual(activeTab?.parameterValues, nextParameterValues)
    ) {
      return
    }

    updateTab(activeTabId, {
      savedQueryId: nextSavedQueryId ?? undefined,
      parameterValues: nextParameterValues,
    })
    setSavedQueryParams(nextParameterValues)
  }

  const handleToggleEditor = () => {
    setIsEditorVisible((prev) => !prev)
    if (!isEditorVisible) {
      setIsResultsVisible(true)
    }
  }

  const handleToggleResults = () => {
    setIsResultsVisible((prev) => !prev)
    if (!isResultsVisible) {
      setIsEditorVisible(true)
    }
  }

  const handlePreviewModeChange = useCallback(
    (mode: ResultViewMode) => {
      updateTab(activeTabId, { previewMode: mode })

      if (isInitialized) {
        setTimeout(() => {
          const state = getCurrentState()
          pushToHistory(state)
        }, 100)
      }
    },
    [activeTabId, updateTab, isInitialized, getCurrentState, pushToHistory]
  )

  const handleParameterValuesChange = useCallback(
    (values: ParameterValue) => {
      updateTab(activeTabId, { parameterValues: values })
      setSavedQueryParams(values)
    },

    [activeTabId, updateTab]
  )

  const handleRun = () => {
    if (!activeTab) return
    const startTime = performance.now()

    updateTab(activeTabId, { isExecuting: true })
    if (selectedSavedQueryObject?.name) {
      executeSavedQuery(
        {
          engineName: selectedEngine ?? "",
          queryName: selectedSavedQueryObject?.name ?? "",
          parameters: savedQueryParams,
        },
        {
          onSuccess: (results) => {
            console.log("[DEBUG] Saved query API response:", results)
            // Handle both wrapped { data: { results: [...] } } and unwrapped { results: [...] } structures
            const resultsArray = Array.isArray(results?.data?.results)
              ? results.data.results
              : Array.isArray(results?.results)
              ? results.results
              : []
            const rawResults = { results: resultsArray }
            const responseData = results?.data || results
            console.log("[DEBUG] Raw results after check:", rawResults)
            console.log("[DEBUG] Results array length:", resultsArray.length)

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
            console.log("[DEBUG] Normalized results (saved query):", normalizedResults)
            console.log("[DEBUG] Normalized results data length:", normalizedResults.data?.length)
            setResultsByTab((prev) => ({
              ...prev,
              [activeTabId]: normalizedResults,
            }))
            updateTab(activeTabId, {
              isExecuting: false,
            })

            if (isInitialized) {
              setTimeout(() => {
                const state = getCurrentState()
                pushToHistory(state)
              }, 100)
            }
          },
          onError: (error) => {
            updateTab(activeTabId, { isExecuting: false })
          },
        }
      )
    } else
      executeQuery(
        {
          engine: selectedEngine ?? "",
          query:
            activeTab.language == EditorMode.YAML
              ? YAML.parse(savedQueryDetails?.query ?? "")
              : activeTab?.content ?? "",
          parameters: parameterValues,
        },
        {
          onSuccess: (results) => {
            console.log("[DEBUG] Regular query API response:", results)
            // Handle both wrapped { data: { results: [...] } } and unwrapped { results: [...] } structures
            const resultsArray = Array.isArray(results?.data?.results)
              ? results.data.results
              : Array.isArray(results?.results)
              ? results.results
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
            setResultsByTab((prev) => ({
              ...prev,
              [activeTabId]: normalizedResults,
            }))
            updateTab(activeTabId, {
              isExecuting: false,
            })

            if (isInitialized) {
              setTimeout(() => {
                const state = getCurrentState()
                pushToHistory(state)
              }, 100)
            }
          },
          onError: (error) => {
            updateTab(activeTabId, { isExecuting: false })
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

  // Debug logging - must be before early return to follow Rules of Hooks
  useEffect(() => {
    const currentResults = resultsByTab[activeTabId] ?? null
    console.log("[DEBUG QueryPageContent] Active tab ID:", activeTabId)
    console.log("[DEBUG QueryPageContent] Results by tab:", resultsByTab)
    console.log("[DEBUG QueryPageContent] Current results:", currentResults)
    console.log("[DEBUG QueryPageContent] Results data:", currentResults?.data)
    console.log("[DEBUG QueryPageContent] Results data length:", currentResults?.data?.length)
  }, [activeTabId, resultsByTab])

  if (!activeTab) return null

  // Get results for the active tab
  const results = resultsByTab[activeTabId] ?? null

  const currentEditorMode = activeTab.editorMode || EditorMode.PLAIN
  const isReadOnly = selectedSavedQueryObject !== null
  // Use saved query details query if available, otherwise fall back to template or tab content
  const editorContent =
    selectedSavedQueryObject && savedQueryDetails?.query
      ? savedQueryDetails.query
      : selectedSavedQueryObject
      ? selectedSavedQueryObject.template
      : activeTab.content

  const isSplitView = isEditorVisible && isResultsVisible

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <QueryTabs
        tabs={tabs}
        activeTabId={activeTabId}
        onTabClick={handleTabClick}
        onTabClose={closeTab}
        onTabAdd={() => {
          addTab()
          setIsEditorVisible(true)
          setIsResultsVisible(true)
        }}
        onTabRename={renameTab}
        modelDetails={engineDetails}
        isReadOnly={isReadOnly}
      />

      {isLoadingEngineDetails ? (
        <div
          className="flex h-full items-center justify-center bg-background-solid"
          style={{ height: "calc(100vh - 65px)" }}
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
              selectedEngine={selectedEngine}
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
                {engineDetails?.error_message}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative min-h-0 flex-1 overflow-hidden">
          {isSplitView ? (
            <ResizablePanelGroup
              direction="horizontal"
              className="bg-red-600"
              style={{ height: "calc(100vh - 65px)" }}
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
                      engineDetails={engineDetails}
                      selectedEngine={selectedEngine ?? ""}
                      onEngineChange={handleEngineChange}
                      selectedQueryId={selectedSavedQuery}
                      onSavedQuerySelect={handleSavedQuerySelect}
                      onRun={handleRun}
                      isExecuting={activeTab.isExecuting}
                      showRunButton={!selectedSavedQueryObject}
                      savedQueries={savedQueriesData?.queries || []}
                      isLoadingQueries={isLoadingQueries}
                      isResultsVisible={isResultsVisible}
                      onToggleResults={handleToggleResults}
                    />

                    {/* {!selectedSavedQueryObject && (
                    <EditorModeSelector
                      mode={currentEditorMode}
                      onChange={handleEditorModeChange}
                    />
                  )} */}
                  </div>

                  {!selectedEngine ? (
                    <div
                      className="flex flex-1 items-center justify-center"
                      style={{ height: "calc(100vh - 55px)" }}
                    >
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
                            selectedSavedQueryObject &&
                            selectedSavedQueryObject.parameters.length > 0
                              ? "h-[400px] shrink-0"
                              : "min-h-0 flex-1"
                          }
                        >
                          <QueryEditor
                            value={editorContent}
                            onChange={handleContentChange}
                            mode={currentEditorMode}
                            readOnly={isReadOnly}
                            onRun={handleRunWithConditions}
                          />
                        </div>
                      )}
                      {((engineDetails?.status != ModelStatus.ACTIVE &&
                        engineDetails?.status != ModelStatus.IDLE &&
                        engineDetails?.status != ModelStatus.ERROR) ||
                        !selectedEngine) && (
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

                      {selectedSavedQueryObject &&
                        selectedSavedQueryObject.parameters.length > 0 && (
                          <div className="shrink-0">
                            <QueryParametersEditor
                              parameters={selectedSavedQueryObject.parameters}
                              values={parameterValues}
                              onChange={handleParameterValuesChange}
                              onRun={handleRun}
                              isExecuting={activeTab.isExecuting}
                              engineDetails={engineDetails}
                            />
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle className="border-0 bg-border" />

              {(results ||
                showDocumentation ||
                activeTab.isExecuting ||
                error ||
                savedQueryError) &&
                (engineDetails?.status == ModelStatus.ACTIVE ||
                  engineDetails?.status == ModelStatus.IDLE) && (
                  <ResizablePanel
                    defaultSize={50}
                    minSize={20}
                    maxSize={80}
                    className="h-full overflow-y-auto"
                  >
                    <QueryResults
                      results={results || null}
                      isExecuting={activeTab.isExecuting}
                      error={error || savedQueryError}
                      isEditorVisible={isEditorVisible}
                      onToggleEditor={handleToggleEditor}
                      previewMode={previewMode}
                      onPreviewModeChange={handlePreviewModeChange}
                      engineDetails={engineDetails}
                      engineName={selectedEngine ?? ""}
                      apiLatency={apiExplanation?.total_execution_time_ms}
                      showDocumentation={showDocumentation}
                    />
                  </ResizablePanel>
                )}
            </ResizablePanelGroup>
          ) : (
            <div className="relative h-full overflow-hidden">
              <div
                className={`bg-background absolute inset-0 transition-all duration-500 ease-in-out ${
                  isEditorVisible
                    ? "translate-x-0 opacity-100"
                    : "pointer-events-none -translate-x-full opacity-0"
                }`}
              >
                <div className="flex h-full flex-col bg-background-base">
                  <div className="shrink-0">
                    <QueryControls
                      selectedEngine={selectedEngine ?? ""}
                      onEngineChange={handleEngineChange}
                      selectedQueryId={selectedSavedQuery}
                      onSavedQuerySelect={handleSavedQuerySelect}
                      onRun={handleRun}
                      isExecuting={
                        activeTab.isExecuting || isLoadingEngineDetails
                      }
                      showRunButton={!selectedSavedQueryObject}
                      savedQueries={savedQueriesData?.queries || []}
                      isLoadingQueries={isLoadingQueries}
                      isResultsVisible={isResultsVisible}
                      onToggleResults={handleToggleResults}
                      engineDetails={engineDetails}
                    />

                    {/* {!selectedSavedQueryObject && (
                    <EditorModeSelector
                      mode={currentEditorMode}
                      onChange={handleEditorModeChange}
                    />
                  )} */}
                  </div>

                  <div className="flex min-h-0 flex-1 flex-col space-y-2 overflow-y-auto">
                    {selectedSavedQueryObject && (
                      <div className="bg-background-muted mb-2 shrink-0 border-b px-4 py-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          {selectedSavedQueryObject.name}
                          <span className="ml-2 text-xs">
                            (Read-only template)
                          </span>
                        </p>
                        {selectedSavedQueryObject.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {selectedSavedQueryObject.description}
                          </p>
                        )}
                      </div>
                    )}

                    <div
                      className={cn(
                        "",
                        selectedSavedQueryObject &&
                          selectedSavedQueryObject.parameters.length > 0
                          ? "h-[400px] shrink-0"
                          : "min-h-0 flex-1"
                      )}
                    >
                      <QueryEditor
                        value={editorContent}
                        onChange={handleContentChange}
                        mode={currentEditorMode}
                        readOnly={isReadOnly}
                        onRun={handleRunWithConditions}
                      />
                    </div>

                    {selectedSavedQueryObject &&
                      selectedSavedQueryObject.parameters.length > 0 && (
                        <div className="shrink-0 ">
                          <QueryParametersEditor
                            parameters={selectedSavedQueryObject.parameters}
                            values={parameterValues}
                            onChange={handleParameterValuesChange}
                            onRun={handleRun}
                            isExecuting={activeTab.isExecuting}
                            engineDetails={engineDetails}
                          />
                        </div>
                      )}
                  </div>
                </div>
              </div>

              <div
                className={`absolute inset-0 overflow-hidden transition-all duration-500 ease-in-out ${
                  isResultsVisible
                    ? "translate-x-0 opacity-100"
                    : "pointer-events-none translate-x-full opacity-0"
                }`}
              >
                <QueryResults
                  results={results || null}
                  apiLatency={apiExplanation?.total_execution_time_ms}
                  isExecuting={activeTab.isExecuting || isLoadingEngineDetails}
                  error={error || savedQueryError}
                  isEditorVisible={isEditorVisible}
                  onToggleEditor={handleToggleEditor}
                  previewMode={previewMode}
                  onPreviewModeChange={handlePreviewModeChange}
                  engineName={selectedEngine ?? ""}
                  engineDetails={engineDetails}
                  showDocumentation={showDocumentation}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
