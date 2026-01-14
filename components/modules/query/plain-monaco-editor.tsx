"use client"

import { useRef, useEffect, useState } from "react"
import Editor, { type OnMount } from "@monaco-editor/react"
import { useTheme } from "next-themes"
import YAML from "yaml"
import { registerYAMLCompletionProvider } from "@/lib/utils/yaml-autocomplete"

interface PlainMonacoEditorProps {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  onRun?: () => void
}

export function PlainMonacoEditor({
  value,
  onChange,
  readOnly = false,
  onRun,
}: PlainMonacoEditorProps) {
  const MonacoEditorComponent = Editor as unknown as React.FC<any>
  const { theme } = useTheme()
  const editorRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const completionProviderRef = useRef<any>(null)
  const onRunRef = useRef(onRun)

  // Keep onRun ref updated
  useEffect(() => {
    onRunRef.current = onRun
  }, [onRun])
  useEffect(() => {
    if (value) {
      try {
        YAML.parse(value)
      } catch (error) {
        console.log("YAML parse error:", error)
      }
    }
  }, [value])

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

    // Suppress ResizeObserver errors in console
    const resizeObserverLoopErr = (e: ErrorEvent) => {
      const resizeObserverErrDiv = document.getElementById(
        "webpack-dev-server-client-overlay-div"
      )
      const resizeObserverErr = document.getElementById(
        "webpack-dev-server-client-overlay"
      )
      if (resizeObserverErr) {
        resizeObserverErr.style.display = "none"
      }
      if (resizeObserverErrDiv) {
        resizeObserverErrDiv.style.display = "none"
      }
    }

    window.addEventListener("error", errorHandler, true)
    window.addEventListener("error", resizeObserverLoopErr)

    return () => {
      window.removeEventListener("error", errorHandler, true)
      window.removeEventListener("error", resizeObserverLoopErr)
    }
  }, [])

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    setIsLoading(false)
    editorRef.current = editor

    try {
      if (!completionProviderRef.current) {
        completionProviderRef.current = registerYAMLCompletionProvider(
          monaco as typeof import("monaco-editor")
        )
      }

      monaco.editor.defineTheme("yaml-custom-light", {
        base: "vs",
        inherit: true,
        rules: [
          { token: "key", foreground: "7C3AED", fontStyle: "bold" },
          { token: "string", foreground: "059669" },
          { token: "number", foreground: "EA580C" },
          { token: "type", foreground: "7C3AED" },
          { token: "comment", foreground: "6B7280", fontStyle: "italic" },
        ],
        colors: {
          "editor.background": "#FFFFFF",
          "editor.lineHighlightBorder": "#00000000",
        },
      })

      monaco.editor.defineTheme("yaml-custom-light-readonly", {
        base: "vs",
        inherit: true,
        rules: [
          { token: "key", foreground: "7C3AED", fontStyle: "bold" },
          { token: "string", foreground: "059669" },
          { token: "number", foreground: "EA580C" },
          { token: "type", foreground: "7C3AED" },
          { token: "comment", foreground: "6B7280", fontStyle: "italic" },
        ],
        colors: {
          "editor.background": "#FFFFFF",
          "editor.lineHighlightBorder": "#00000000",
        },
      })

      monaco.editor.defineTheme("yaml-custom-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "key", foreground: "A78BFA", fontStyle: "bold" },
          { token: "string", foreground: "34D399" },
          { token: "number", foreground: "FB923C" },
          { token: "type", foreground: "A78BFA" },
          { token: "comment", foreground: "9CA3AF", fontStyle: "italic" },
        ],
        colors: {
          "editor.background": "#0f0f0f",
          "editor.lineHighlightBorder": "#00000000",
        },
      })

      monaco.editor.defineTheme("yaml-custom-dark-readonly", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "key", foreground: "A78BFA", fontStyle: "bold" },
          { token: "string", foreground: "34D399" },
          { token: "number", foreground: "FB923C" },
          { token: "type", foreground: "A78BFA" },
          { token: "comment", foreground: "9CA3AF", fontStyle: "italic" },
        ],
        colors: {
          "editor.background": "#0f0f0f",
          "editor.lineHighlightBorder": "#00000000",
        },
      })

      // Note: Don't call monaco.editor.setTheme() here as it affects all Monaco instances globally
      // Each editor uses its own theme via the theme prop on the Editor component
    } catch (error) {
      // Silently fail
    }

    editor.updateOptions({
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: "on",
      glyphMargin: false,
      folding: true,
      lineDecorationsWidth: 10,
      lineNumbersMinChars: 3,
      renderLineHighlight: "all",
      scrollBeyondLastLine: false,
      tabSize: 2,
      wordWrap: "on",
      wrappingIndent: "indent",
      readOnly,
      automaticLayout: true,
      suggest: {
        // enabled: !readOnly,
        showProperties: true,
        showKeywords: true,
        showValues: true,
      },
      quickSuggestions: readOnly
        ? false
        : {
            other: true,
            comments: false,
            strings: true,
          },
      suggestOnTriggerCharacters: !readOnly,
      acceptSuggestionOnCommitCharacter: !readOnly,
      parameterHints: { enabled: false },
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
      editor.trigger("keyboard", "editor.action.triggerSuggest", {})
    })

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
  }

  useEffect(() => {
    return () => {
      if (completionProviderRef.current) {
        completionProviderRef.current.dispose()
      }
    }
  }, [])

  // Calculate theme name based on current theme and readOnly state
  const themeName = readOnly
    ? theme === "dark"
      ? "yaml-custom-dark-readonly"
      : "yaml-custom-light-readonly"
    : theme === "dark"
    ? "yaml-custom-dark"
    : "yaml-custom-light"

  return (
    <div className="relative h-full w-full">
      <MonacoEditorComponent
        height="100%"
        language="yaml"
        value={value}
        onChange={(newValue: string | undefined) => onChange(newValue || "")}
        onMount={handleEditorDidMount}
        theme={themeName}
        loading={
          <div className="flex h-full items-center justify-center">
            Loading Monaco Editor...
          </div>
        }
        options={{
          selectOnLineNumbers: true,
          roundedSelection: false,
          readOnly,
          automaticLayout: true,
        }}
      />
    </div>
  )
}
