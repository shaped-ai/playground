"use client"

import { useRef, useEffect } from "react"
import Editor, { type OnMount } from "@monaco-editor/react"
import { useTheme } from "next-themes"
import { registerYAMLCompletionProvider } from "@/lib/utils/yaml-autocomplete"

interface YamlMonacoEditorProps {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  onRun?: () => void
}

export function YamlMonacoEditor({
  value,
  onChange,
  readOnly = false,
  onRun,
}: YamlMonacoEditorProps) {
  const { theme } = useTheme()
  const editorRef = useRef<any>(null)
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const completionProviderRef = useRef<ReturnType<
    typeof registerYAMLCompletionProvider
  > | null>(null)
  const MonacoYamlEditorComponent = Editor as unknown as React.FC<any>
  const onRunRef = useRef(onRun)

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

  const handleEditorDidMount: OnMount = async (editor, monaco) => {
    editorRef.current = editor

    try {
      await Promise.all([
        // @ts-ignore - dynamic import may not have types
        import("monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution"),
        // @ts-ignore - dynamic import may not have types
        import("monaco-editor/esm/vs/language/json/monaco.contribution"), // required dependencies for YAML tokens
      ])
    } catch (error) {
      // Silently fail if language contributions can't be loaded
    }

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
          "editor.background": "#F9FAFB",
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
          "editor.background": "#1E1E1E",
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
        },
      })

      // Note: Don't call monaco.editor.setTheme() here as it affects all Monaco instances globally
      // Each editor uses its own theme via the theme prop on the Editor component
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
      minimap: { enabled: false },
      fontSize: 14,
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
      readOnly,
      suggest: {
        showKeywords: !readOnly,
        showSnippets: !readOnly,
        showProperties: !readOnly,
        showValues: !readOnly,
        showEnums: !readOnly,
        showConstants: !readOnly,
        showFunctions: !readOnly,
        showFields: !readOnly,
        filterGraceful: true,
        snippetsPreventQuickSuggestions: false,
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
      acceptSuggestionOnEnter: readOnly ? "off" : "on",
      parameterHints: { enabled: !readOnly },
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

  useEffect(() => {
    return () => {
      if (completionProviderRef.current) {
        completionProviderRef.current.dispose()
        completionProviderRef.current = null
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
    <div className={`h-full w-full ${readOnly ? "bg-muted/30" : ""}`}>
      <MonacoYamlEditorComponent
        height="100%"
        language="yaml"
        value={value}
        onChange={(newValue: string | undefined) => onChange(newValue || "")}
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
