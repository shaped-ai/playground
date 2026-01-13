"use client"

import { useRef, useEffect, useState } from "react"
import Editor, { type OnMount } from "@monaco-editor/react"

interface MonacoCodeEditorProps {
  initialDoc: string
  language?: "python" | "javascript" | "shell" | "json"
  backgroundColor?: string
  themeName?: string
}

export default function MonacoCodeEditor({
  initialDoc,
  language = "python",
  backgroundColor = "#0f0f0f",
  themeName = "code-editor-dark",
}: MonacoCodeEditorProps) {
  const MonacoEditorComponent = Editor as unknown as React.FC<any>
  const editorRef = useRef<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Add padding styles for editor content and ensure black background
  useEffect(() => {
    const style = document.createElement("style")
    style.textContent = `
      .monaco-code-editor-wrapper .monaco-editor .view-lines {
        padding-left: 16px !important;
        padding-right: 16px !important;
      }
      .monaco-code-editor-wrapper .monaco-editor .current-line {
        padding-left: 16px !important;
        padding-right: 16px !important;
      }
      .monaco-code-editor-wrapper .monaco-editor {
        background-color: ${backgroundColor} !important;
      }
      .monaco-code-editor-wrapper .monaco-editor .monaco-editor-background {
        background-color: ${backgroundColor} !important;
      }
      .monaco-code-editor-wrapper .monaco-editor .margin {
        background-color: ${backgroundColor} !important;
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [backgroundColor])

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
    editorRef.current = editor

    try {
      // Define dark theme for code editor (similar to CodeMirror's dark theme)
      monaco.editor.defineTheme("code-editor-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "keyword", foreground: "C586C0" },
          { token: "string", foreground: "CE9178" },
          { token: "number", foreground: "B5CEA8" },
          { token: "comment", foreground: "6A9955", fontStyle: "italic" },
          { token: "type", foreground: "4EC9B0" },
          { token: "class", foreground: "4EC9B0" },
          { token: "function", foreground: "DCDCAA" },
        ],
        colors: {
          "editor.background": backgroundColor,
          "editor.foreground": "#D4D4D4",
          "editor.lineHighlightBackground": "#2A2D2E",
          "editor.lineHighlightBorder": "#2A2D2E",
          "editor.selectionBackground": "#9A9A9A99",
          "editor.inactiveSelectionBackground": "#3A3D41",
          "editorCursor.foreground": "#FFFFFF",
          "editorWhitespace.foreground": "#3B3A32",
          "editorLineNumber.foreground": "#858585",
          "editorLineNumber.activeForeground": "#C6C6C6",
        },
      })

      // Define light theme (if needed
      monaco.editor.defineTheme("code-editor-light", {
        base: "vs",
        inherit: true,
        rules: [
          { token: "keyword", foreground: "0000FF" },
          { token: "string", foreground: "A31515" },
          { token: "number", foreground: "098658" },
          { token: "comment", foreground: "008000", fontStyle: "italic" },
          { token: "type", foreground: "267F99" },
          { token: "class", foreground: "267F99" },
          { token: "function", foreground: "795E26" },
        ],
        colors: {
          "editor.background": "#FFFFFF",
          "editor.foreground": "#000000",
          "editor.lineHighlightBackground": "#F0F0F0",
          "editor.lineHighlightBorder": "#F0F0F0",
          "editor.selectionBackground": "#ADD6FF80",
          "editor.inactiveSelectionBackground": "#E5EBF1",
          "editorCursor.foreground": "#000000",
          "editorWhitespace.foreground": "#BFBFBF",
          "editorLineNumber.foreground": "#858585",
          "editorLineNumber.activeForeground": "#000000",
        },
      })

      // Don't set theme globally - each editor instance uses its own theme via the theme prop
      // This prevents affecting other Monaco editor instances
    } catch (error) {
      // Silently fail
    }

    // Set theme on this editor instance
    editor.updateOptions({
      theme: themeName,
      minimap: { enabled: false },
      fontSize: 12,
      lineHeight: 20,
      lineNumbers: "off",
      glyphMargin: false,
      folding: false,
      lineDecorationsWidth: 0,
      renderLineHighlight: "none",
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
        horizontal: "auto",
        useShadows: false,
        verticalHasArrows: false,
        horizontalHasArrows: false,
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
        alwaysConsumeMouseWheel: false,
      },
      overviewRulerLanes: 0,
      overviewRulerBorder: false,
    })
  }

  // Theme is handled via the theme prop on MonacoEditorComponent
  // No need to set theme globally or update it here

  // Map language prop to Monaco language
  const getMonacoLanguage = () => {
    switch (language) {
      case "python":
        return "python"
      case "javascript":
        return "javascript"
      case "shell":
        return "shell"
      case "json":
        return "json"
      default:
        return "python"
    }
  }

  if (!mounted) {
    return (
      <div
        className="flex h-full items-center justify-center"
        style={{ backgroundColor }}
      >
        <span className="text-sm text-gray-400">Loading editor...</span>
      </div>
    )
  }

  return (
    <div
      className="monaco-code-editor-wrapper w-full"
      style={{ backgroundColor }}
    >
      <MonacoEditorComponent
        height="320px"
        language={getMonacoLanguage()}
        value={initialDoc}
        onMount={handleEditorDidMount}
        theme={themeName}
        options={{
          readOnly: true,
          automaticLayout: true,
        }}
        loading={
          <div
            className="flex h-[320px] items-center justify-center"
            style={{ backgroundColor }}
          >
            <span className="text-sm text-gray-400">Loading editor...</span>
          </div>
        }
      />
    </div>
  )
}
