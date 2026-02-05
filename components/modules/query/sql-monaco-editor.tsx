"use client"

import { useRef, useEffect, useState } from "react"
import Editor, { type OnMount } from "@monaco-editor/react"
import { useTheme } from "next-themes"
import { useIsMobile } from "@/hooks/shared/use-media-query"
import { useIsInIframe } from "@/hooks/shared/use-is-in-iframe"
import {
  SQL_KEYWORDS,
  SQL_FUNCTIONS,
  SQL_TABLES,
} from "@/lib/schema/sql-schema"

interface SqlMonacoEditorProps {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  onRun?: () => void
}

export function SqlMonacoEditor({
  value,
  onChange,
  readOnly = false,
  onRun,
}: SqlMonacoEditorProps) {
  const { resolvedTheme, theme } = useTheme()
  const isMobile = useIsMobile()
  const isInIframe = useIsInIframe()
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<any>(null)
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const MonacoSqlEditorComponent = Editor as unknown as React.FC<any>
  const onRunRef = useRef(onRun)
  const [mounted, setMounted] = useState(false)
  const prevThemeRef = useRef<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Keep onRun ref updated
  useEffect(() => {
    onRunRef.current = onRun
  }, [onRun])
  useEffect(() => {
    const errorHandler = (e: ErrorEvent) => {
      if (
        e.message ===
          "ResizeObserver loop completed with undelivered notifications." ||
        e.message === "ResizeObserver loop limit exceeded" ||
        e.message === "Script error."
      ) {
        e.stopImmediatePropagation()
        e.preventDefault()
        return false
      }
    }

    window.addEventListener("error", errorHandler, true)
    return () => window.removeEventListener("error", errorHandler, true)
  }, [])

  // Helper to get theme synchronously with fallbacks
  // This must work on initial render before next-themes hydrates
  const getCurrentTheme = () => {
    // When in iframe, read from URL - it's the source of truth (docs passes ?theme=dark|light)
    if (isInIframe && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const themeParam = params.get("theme")
      if (themeParam === "dark" || themeParam === "light") return themeParam
    }
    // First try the theme from useTheme hook (works after hydration)
    if (theme === "dark" || theme === "light") {
      return theme
    }
    // Fallback: check localStorage directly (next-themes stores it as "theme")
    // This is critical for initial render before next-themes hydrates
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme")
      if (stored === "dark" || stored === "light") {
        return stored
      }
    }
    // Final fallback: check if dark class is on html element
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark")
        ? "dark"
        : "light"
    }
    return "light" // Default to light since defaultTheme is "light"
  }

  // beforeMount callback - set theme BEFORE editor is created
  // This is critical to prevent Monaco from initializing with default light theme
  const handleBeforeMount = (monaco: any) => {
    try {
      // Define themes first
      // Define custom SQL themes
      monaco.editor.defineTheme("sql-custom-light", {
        base: "vs",
        inherit: true,
        rules: [
          { token: "keyword", foreground: "0000FF", fontStyle: "bold" },
          { token: "string", foreground: "A31515" },
          { token: "number", foreground: "098658" },
          { token: "comment", foreground: "008000", fontStyle: "italic" },
          { token: "operator", foreground: "000000" },
          { token: "delimiter", foreground: "000000" },
        ],
        colors: {
          "editor.background": "#FFFFFF",
          "editor.foreground": "#000000",
          "editor.lineHighlightBackground": "#F0F0F0",
          "editor.selectionBackground": "#ADD6FF80",
          "editorCursor.foreground": "#000000",
          "editorLineNumber.foreground": "#858585",
          "editorLineNumber.activeForeground": "#000000",
        },
      })

      monaco.editor.defineTheme("sql-custom-light-readonly", {
        base: "vs",
        inherit: true,
        rules: [
          { token: "keyword", foreground: "0000FF", fontStyle: "bold" },
          { token: "string", foreground: "A31515" },
          { token: "number", foreground: "098658" },
          { token: "comment", foreground: "008000", fontStyle: "italic" },
          { token: "operator", foreground: "000000" },
          { token: "delimiter", foreground: "000000" },
        ],
        colors: {
          "editor.background": "#F9FAFB",
          "editor.foreground": "#000000",
          "editor.lineHighlightBackground": "#E5E7EB",
          "editor.selectionBackground": "#ADD6FF80",
          "editorCursor.foreground": "#000000",
          "editorLineNumber.foreground": "#858585",
          "editorLineNumber.activeForeground": "#000000",
        },
      })

      monaco.editor.defineTheme("sql-custom-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "keyword", foreground: "569CD6", fontStyle: "bold" },
          { token: "string", foreground: "CE9178" },
          { token: "number", foreground: "B5CEA8" },
          { token: "comment", foreground: "6A9955", fontStyle: "italic" },
          { token: "operator", foreground: "D4D4D4" },
          { token: "delimiter", foreground: "D4D4D4" },
        ],
        colors: {
          "editor.background": "#1E1E1E",
          "editor.foreground": "#D4D4D4",
          "editor.lineHighlightBackground": "#2A2D2E",
          "editor.selectionBackground": "#9A9A9A99",
          "editorCursor.foreground": "#FFFFFF",
          "editorLineNumber.foreground": "#858585",
          "editorLineNumber.activeForeground": "#C6C6C6",
        },
      })

      monaco.editor.defineTheme("sql-custom-dark-readonly", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "keyword", foreground: "569CD6", fontStyle: "bold" },
          { token: "string", foreground: "CE9178" },
          { token: "number", foreground: "B5CEA8" },
          { token: "comment", foreground: "6A9955", fontStyle: "italic" },
          { token: "operator", foreground: "D4D4D4" },
          { token: "delimiter", foreground: "D4D4D4" },
        ],
        colors: {
          "editor.background": "#0f0f0f",
          "editor.foreground": "#D4D4D4",
          "editor.lineHighlightBackground": "#1A1A1A",
          "editor.selectionBackground": "#9A9A9A99",
          "editorCursor.foreground": "#FFFFFF",
          "editorLineNumber.foreground": "#858585",
          "editorLineNumber.activeForeground": "#C6C6C6",
        },
      })

      // Set the theme immediately after defining themes
      // This is critical to prevent Monaco from initializing with default light theme
      const currentTheme = getCurrentTheme()
      const initialThemeName = readOnly
        ? currentTheme === "dark"
          ? "sql-custom-dark-readonly"
          : "sql-custom-light-readonly"
        : currentTheme === "dark"
          ? "sql-custom-dark"
          : "sql-custom-light"

      monaco.editor.setTheme(initialThemeName)
    } catch (error) {
      // Silently fail
    }
  }

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // Set data attribute for CSS selector
    try {
      const container = editor.getContainerDomNode()
      if (container) {
        container.setAttribute("data-editor-type", "sql")
      }
    } catch (error) {
      // Silently fail
    }

    try {
      // Themes are already defined in beforeMount, so we don't need to redefine them here
      // Just ensure the theme is set correctly as a safety measure
      const currentTheme = getCurrentTheme()
      const initialThemeName = readOnly
        ? currentTheme === "dark"
          ? "sql-custom-dark-readonly"
          : "sql-custom-light-readonly"
        : currentTheme === "dark"
          ? "sql-custom-dark"
          : "sql-custom-light"

      monaco.editor.setTheme(initialThemeName)
    } catch (error) {
      // Silently fail
    }

    try {
      monaco.languages.registerCompletionItemProvider("sql", {
        provideCompletionItems: (model: any, position: any) => {
          const word = model.getWordUntilPosition(position)
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          }

          const suggestions: any[] = []

          SQL_KEYWORDS.forEach((keyword) => {
            suggestions.push({
              label: keyword,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: keyword,
              range: range,
              documentation: `SQL keyword: ${keyword}`,
            })
          })

          SQL_FUNCTIONS.forEach((func) => {
            suggestions.push({
              label: func,
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: `${func}()`,
              range: range,
              documentation: `SQL function: ${func}`,
            })
          })

          Object.entries(SQL_TABLES).forEach(([tableName, tableInfo]) => {
            suggestions.push({
              label: tableName,
              kind: monaco.languages.CompletionItemKind.Class,
              insertText: tableName,
              range: range,
              documentation: tableInfo.description,
            })

            tableInfo.columns.forEach((column) => {
              suggestions.push({
                label: `${tableName}.${column}`,
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: column,
                range: range,
                documentation: `Column in ${tableName} table`,
              })
            })
          })

          return { suggestions }
        },
      })
    } catch (error) {
      // Silently fail
    }

    try {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
        editor.trigger("keyboard", "editor.action.triggerSuggest", {})
      })
    } catch (error) {
      // Silently fail
    }

    // Add Ctrl+Enter / Command+Enter to run query
    try {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        if (onRunRef.current) {
          onRunRef.current()
        }
      })
    } catch (error) {
      // Silently fail
    }

    const editorOptions: any = {
      minimap: { enabled: isMobile },
      fontSize: isMobile ? 16 : 14,
      lineNumbers: "on",
      glyphMargin: false,
      folding: true,
      lineDecorationsWidth: isMobile ? 5 : 10,
      lineNumbersMinChars: isMobile ? 2 : 3,
      renderLineHighlight: "all",
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: "on",
      wrappingIndent: "indent",
      readOnly,
      scrollbar: {
        vertical: isMobile ? "visible" : "auto",
        verticalScrollbarSize: isMobile ? 16 : 12,
        horizontal: isMobile ? "visible" : "auto",
        horizontalScrollbarSize: isMobile ? 16 : 12,
        useShadows: true,
        alwaysConsumeMouseWheel: isMobile,
      },
      // suggest: {
      //   showKeywords: !readOnly,
      //   showSnippets: !readOnly,
      //   showProperties: !readOnly,
      //   showValues: !readOnly,
      //   showEnums: !readOnly,
      //   showConstants: !readOnly,
      //   showFunctions: !readOnly,
      //   showFields: !readOnly,
      //   filterGraceful: true,
      //   snippetsPreventQuickSuggestions: false,
      // },
      // quickSuggestions: readOnly
      //   ? false
      //   : {
      //       other: true,
      //       comments: false,
      //       strings: true,
      //     },
      // suggestOnTriggerCharacters: !readOnly,
      // acceptSuggestionOnCommitCharacter: !readOnly,
      acceptSuggestionOnEnter: "off",
      // acceptSuggestionOnEnter: readOnly ? "off" : "on",
      // parameterHints: { enabled: !readOnly },
      parameterHints: { enabled: false },
      // Disable all suggestions
      quickSuggestions: false,
      suggestOnTriggerCharacters: false,
      wordBasedSuggestions: false,
      // Disable suggestion widget
      suggest: {
        showKeywords: false,
        showSnippets: false,
        showProperties: false,
        showValues: false,
        showEnums: false,
        showConstants: false,
        showFunctions: false,
        showFields: false,
        showClasses: false,
        showVariables: false,
        showInterfaces: false,
        showModules: false,
        showStructs: false,
        showEvents: false,
        showOperators: false,
        showUnits: false,
        showColors: false,
        showFiles: false,
        showReferences: false,
        showFolders: false,
        showTypeParameters: false,
        showIssues: false,
        showUsers: false,
        showText: false,
      },
    }

    editor.updateOptions(editorOptions)

    try {
      const resizeObserver = new ResizeObserver(() => {
        if (resizeTimeoutRef.current) {
          clearTimeout(resizeTimeoutRef.current)
        }
        resizeTimeoutRef.current = setTimeout(() => {
          requestAnimationFrame(() => {
            try {
              editor.layout()
            } catch (error) {
              // Silently fail
            }
          })
        }, 100)
      })

      const container = editor.getContainerDomNode()
      if (container) {
        resizeObserver.observe(container)
      }

      return () => {
        resizeObserver.disconnect()
        if (resizeTimeoutRef.current) {
          clearTimeout(resizeTimeoutRef.current)
        }
      }
    } catch (error) {
      // Silently fail
    }
  }

  // Helper function to define a theme (used for initial setup and dynamic updates)
  const defineThemeIfNeeded = (
    monaco: any,
    themeName: string,
    isDark: boolean,
    isReadOnly: boolean
  ) => {
    if (isReadOnly) {
      if (isDark) {
        monaco.editor.defineTheme(themeName, {
          base: "vs-dark",
          inherit: true,
          rules: [
            { token: "keyword", foreground: "569CD6", fontStyle: "bold" },
            { token: "string", foreground: "CE9178" },
            { token: "number", foreground: "B5CEA8" },
            { token: "comment", foreground: "6A9955", fontStyle: "italic" },
            { token: "operator", foreground: "D4D4D4" },
            { token: "delimiter", foreground: "D4D4D4" },
          ],
          colors: {
            "editor.background": "#0f0f0f",
            "editor.foreground": "#D4D4D4",
            "editor.lineHighlightBackground": "#1A1A1A",
            "editor.selectionBackground": "#9A9A9A99",
            "editorCursor.foreground": "#FFFFFF",
            "editorLineNumber.foreground": "#858585",
            "editorLineNumber.activeForeground": "#C6C6C6",
          },
        })
      } else {
        monaco.editor.defineTheme(themeName, {
          base: "vs",
          inherit: true,
          rules: [
            { token: "keyword", foreground: "0000FF", fontStyle: "bold" },
            { token: "string", foreground: "A31515" },
            { token: "number", foreground: "098658" },
            { token: "comment", foreground: "008000", fontStyle: "italic" },
            { token: "operator", foreground: "000000" },
            { token: "delimiter", foreground: "000000" },
          ],
          colors: {
            "editor.background": "#F9FAFB",
            "editor.foreground": "#000000",
            "editor.lineHighlightBackground": "#E5E7EB",
            "editor.selectionBackground": "#ADD6FF80",
            "editorCursor.foreground": "#000000",
            "editorLineNumber.foreground": "#858585",
            "editorLineNumber.activeForeground": "#000000",
          },
        })
      }
    } else {
      if (isDark) {
        monaco.editor.defineTheme(themeName, {
          base: "vs-dark",
          inherit: true,
          rules: [
            { token: "keyword", foreground: "569CD6", fontStyle: "bold" },
            { token: "string", foreground: "CE9178" },
            { token: "number", foreground: "B5CEA8" },
            { token: "comment", foreground: "6A9955", fontStyle: "italic" },
            { token: "operator", foreground: "D4D4D4" },
            { token: "delimiter", foreground: "D4D4D4" },
          ],
          colors: {
            "editor.background": "#1E1E1E",
            "editor.foreground": "#D4D4D4",
            "editor.lineHighlightBackground": "#2A2D2E",
            "editor.selectionBackground": "#9A9A9A99",
            "editorCursor.foreground": "#FFFFFF",
            "editorLineNumber.foreground": "#858585",
            "editorLineNumber.activeForeground": "#C6C6C6",
          },
        })
      } else {
        monaco.editor.defineTheme(themeName, {
          base: "vs",
          inherit: true,
          rules: [
            { token: "keyword", foreground: "0000FF", fontStyle: "bold" },
            { token: "string", foreground: "A31515" },
            { token: "number", foreground: "098658" },
            { token: "comment", foreground: "008000", fontStyle: "italic" },
            { token: "operator", foreground: "000000" },
            { token: "delimiter", foreground: "000000" },
          ],
          colors: {
            "editor.background": "#FFFFFF",
            "editor.foreground": "#000000",
            "editor.lineHighlightBackground": "#F0F0F0",
            "editor.selectionBackground": "#ADD6FF80",
            "editorCursor.foreground": "#000000",
            "editorLineNumber.foreground": "#858585",
            "editorLineNumber.activeForeground": "#000000",
          },
        })
      }
    }
  }

  // Calculate theme name - this must be synchronous and not depend on mounted state
  // so Monaco gets the correct theme prop from the start
  const currentTheme = getCurrentTheme()
  const themeName = readOnly
    ? currentTheme === "dark"
      ? "sql-custom-dark-readonly"
      : "sql-custom-light-readonly"
    : currentTheme === "dark"
      ? "sql-custom-dark"
      : "sql-custom-light"

  // Get background color for CSS override
  const backgroundColor = readOnly
    ? currentTheme === "dark"
      ? "#0f0f0f"
      : "#F9FAFB"
    : currentTheme === "dark"
      ? "#1E1E1E"
      : "#FFFFFF"

  // CSS override workaround for Monaco background bug
  // Inject styles that override the background color with !important
  useEffect(() => {
    if (!mounted) return

    const styleId = `monaco-sql-editor-theme-override`
    let styleElement = document.getElementById(styleId) as HTMLStyleElement

    if (!styleElement) {
      styleElement = document.createElement("style")
      styleElement.id = styleId
      document.head.appendChild(styleElement)
    }

    // Update style content with current background color
    styleElement.textContent = `
      .monaco-editor[data-editor-type="sql"] {
        background-color: ${backgroundColor} !important;
      }
      .monaco-editor[data-editor-type="sql"] .monaco-editor-background {
        background-color: ${backgroundColor} !important;
      }
      .monaco-editor[data-editor-type="sql"] .margin {
        background-color: ${backgroundColor} !important;
      }
      .monaco-editor[data-editor-type="sql"] .monaco-scrollable-element {
        background-color: ${backgroundColor} !important;
      }
      ${
        isMobile
          ? `
        .monaco-editor[data-editor-type="sql"] .monaco-scrollable-element > .scrollbar {
          opacity: 1 !important;
          visibility: visible !important;
        }
        .monaco-editor[data-editor-type="sql"] .monaco-scrollable-element > .scrollbar > .slider {
          opacity: 1 !important;
          visibility: visible !important;
        }
        .monaco-editor[data-editor-type="sql"] .monaco-scrollable-element > .scrollbar:hover {
          opacity: 1 !important;
        }
      `
          : ""
      }
    `
  }, [themeName, backgroundColor, mounted, readOnly, isMobile])

  // Manually update Monaco editor theme when it changes (e.g., iframe reload with new theme param)
  // This ensures theme updates even when key doesn't change due to timing
  useEffect(() => {
    if (editorRef.current && monacoRef.current && mounted) {
      const currentTheme = getCurrentTheme()
      const currentThemeName = readOnly
        ? currentTheme === "dark"
          ? "sql-custom-dark-readonly"
          : "sql-custom-light-readonly"
        : currentTheme === "dark"
          ? "sql-custom-dark"
          : "sql-custom-light"

      if (prevThemeRef.current !== currentThemeName) {
        try {
          defineThemeIfNeeded(
            monacoRef.current,
            currentThemeName,
            currentTheme === "dark",
            readOnly
          )
          monacoRef.current.editor.setTheme(currentThemeName)
          prevThemeRef.current = currentThemeName
        } catch (error) {
          // Silently fail
        }
      }
    }
  }, [theme, resolvedTheme, mounted, readOnly, isInIframe])

  return (
    <div className={`h-full w-full ${readOnly ? "bg-muted/30" : ""}`}>
      <MonacoSqlEditorComponent
        key={`sql-editor-${themeName}`}
        height="100%"
        language="sql"
        value={value}
        onChange={(newValue: string | undefined) => onChange(newValue || "")}
        beforeMount={handleBeforeMount}
        onMount={handleEditorDidMount}
        theme={themeName}
        options={{
          selectOnLineNumbers: true,
          roundedSelection: false,
          readOnly,
          // cursorStyle: "line",
          automaticLayout: false,
        }}
      />
    </div>
  )
}
