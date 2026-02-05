"use client"

import { useRef, useEffect, useState } from "react"
import Editor, { type OnMount } from "@monaco-editor/react"
import { useTheme } from "next-themes"
import { Card } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface JsonParametersEditorProps {
  value: string
  onChange: (value: string) => void
  height?: string
}

export function JsonParametersEditor({
  value,
  onChange,
  height = "250px",
}: JsonParametersEditorProps) {
  const { theme } = useTheme()
  const editorRef = useRef<any>(null)
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const MonacoEditorComponent = Editor as unknown as React.FC<any>
  const [jsonError, setJsonError] = useState<string | null>(null)

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

  // Validate JSON on value change
  useEffect(() => {
    if (!value || value.trim() === "") {
      setJsonError(null)
      return
    }

    try {
      JSON.parse(value)
      setJsonError(null)
    } catch (error: any) {
      setJsonError(error.message || "Invalid JSON")
    }
  }, [value])

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor

    try {
      // Define JSON editor themes matching the SQL editor style
      monaco.editor.defineTheme("json-custom-light", {
        base: "vs",
        inherit: true,
        rules: [
          { token: "string", foreground: "A31515" },
          { token: "number", foreground: "098658" },
          { token: "keyword", foreground: "0000FF" },
          { token: "operator", foreground: "000000" },
          { token: "delimiter", foreground: "000000" },
        ],
        colors: {
          "editor.background": "#F9F7FD",
          "editor.foreground": "#000000",
          "editor.lineHighlightBackground": "#F0F0F0",
          "editor.selectionBackground": "#ADD6FF80",
          "editorCursor.foreground": "#000000",
          "editorLineNumber.foreground": "#858585",
          "editorLineNumber.activeForeground": "#000000",
          "editorSuggestWidget.background": "#FFFFFF",
          "editorSuggestWidget.border": "#C8C8C8",
          "editorSuggestWidget.foreground": "#000000",
          "editorSuggestWidget.selectedBackground": "#0066BF",
          "editorSuggestWidget.selectedForeground": "#FFFFFF",
          "editorSuggestWidget.highlightForeground": "#0066BF",
        },
      })

      monaco.editor.defineTheme("json-custom-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "string", foreground: "CE9178" },
          { token: "number", foreground: "B5CEA8" },
          { token: "keyword", foreground: "569CD6" },
          { token: "operator", foreground: "D4D4D4" },
          { token: "delimiter", foreground: "D4D4D4" },
        ],
        colors: {
          "editor.background": "#1A1A1A",
          "editor.foreground": "#D4D4D4",
          "editor.lineHighlightBackground": "#2A2D2E",
          "editor.selectionBackground": "#9A9A9A99",
          "editorCursor.foreground": "#FFFFFF",
          "editorLineNumber.foreground": "#858585",
          "editorLineNumber.activeForeground": "#C6C6C6",
          "editorSuggestWidget.background": "#252526",
          "editorSuggestWidget.border": "#454545",
          "editorSuggestWidget.foreground": "#CCCCCC",
          "editorSuggestWidget.selectedBackground": "#094771",
          "editorSuggestWidget.selectedForeground": "#FFFFFF",
          "editorSuggestWidget.highlightForeground": "#0097FB",
        },
      })
    } catch (error) {
      // Silently fail
    }

    // Disable Monaco's built-in JSON validation to allow any input
    try {
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: false,
        allowComments: true,
        schemas: [],
        enableSchemaRequest: false,
      })
    } catch (error) {
      // Silently fail if this API is not available
    }

    const editorOptions: any = {
      minimap: { enabled: false },
      fontSize: 13,
      lineNumbers: "on",
      glyphMargin: false,
      folding: true,
      lineDecorationsWidth: 10,
      lineNumbersMinChars: 3,
      renderLineHighlight: "all",
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: "on",
      wrappingIndent: "indent",
      readOnly: false,
      acceptSuggestionOnEnter: "off",
      parameterHints: { enabled: false },
      quickSuggestions: {
        other: true,
        comments: false,
        strings: true,
      },
      suggestOnTriggerCharacters: true,
      formatOnPaste: false, // Disable auto-format to allow invalid JSON
      formatOnType: false,
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

  // Calculate theme name based on current theme
  const themeName = theme === "dark" ? "json-custom-dark" : "json-custom-light"

  return (
    <Card className="mt-2 p-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Query Parameters (JSON)</h3>
        </div>
        {jsonError && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{jsonError}</span>
          </div>
        )}
        <div className="rounded-md border border-border overflow-hidden">
          <MonacoEditorComponent
            height={height}
            language="json"
            value={value || "{}"}
            onChange={(newValue: string | undefined) => {
              onChange(newValue || "{}")
            }}
            onMount={handleEditorDidMount}
            theme={themeName}
            options={{
              selectOnLineNumbers: true,
              roundedSelection: false,
              readOnly: false,
              automaticLayout: false,
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Enter parameters as JSON. Example: {"{"}"user_id": "123", "limit": 10
          {"}"}
        </p>
      </div>
    </Card>
  )
}
