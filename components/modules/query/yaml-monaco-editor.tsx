"use client"

import { useRef, useEffect, useState } from "react"
import Editor, { type OnMount } from "@monaco-editor/react"
import { useTheme } from "next-themes"
import { registerYAMLCompletionProvider } from "@/lib/utils/yaml-autocomplete"
import { useIsMobile } from "@/hooks/shared/use-media-query"
import { useIsInIframe } from "@/hooks/shared/use-is-in-iframe"

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
  const { theme, resolvedTheme } = useTheme()
  const isMobile = useIsMobile()
  const isInIframe = useIsInIframe()
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<any>(null)
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const completionProviderRef = useRef<ReturnType<
    typeof registerYAMLCompletionProvider
  > | null>(null)
  const MonacoYamlEditorComponent = Editor as unknown as React.FC<any>
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

  const handleEditorDidMount: OnMount = async (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // Set data attribute for CSS selector
    try {
      const container = editor.getContainerDomNode()
      if (container) {
        container.setAttribute("data-editor-type", "yaml")
      }
    } catch (error) {
      // Silently fail
    }
    monacoRef.current = monaco

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
          "editor.background": "#F9F7FD",
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
          "editor.background": "#F9F7FD",
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
          "editor.background": "#1A1A1A",
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
          "editor.background": "#1A1A1A",
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
      scrollbar: {
        vertical: isMobile ? "visible" : "auto",
        verticalScrollbarSize: isMobile ? 16 : 12,
        horizontal: isMobile ? "visible" : "auto",
        horizontalScrollbarSize: isMobile ? 16 : 12,
        useShadows: true,
        alwaysConsumeMouseWheel: isMobile,
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

  useEffect(() => {
    return () => {
      if (completionProviderRef.current) {
        completionProviderRef.current.dispose()
        completionProviderRef.current = null
      }
    }
  }, [])

  // Helper function to define a theme (used for dynamic updates)
  // WORKAROUND: Redefining theme forces Monaco to re-apply all colors including background
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
            { token: "key", foreground: "A78BFA", fontStyle: "bold" },
            { token: "string", foreground: "34D399" },
            { token: "number", foreground: "FB923C" },
            { token: "type", foreground: "A78BFA" },
            { token: "comment", foreground: "9CA3AF", fontStyle: "italic" },
          ],
          colors: {
            "editor.background": "#1A1A1A",
          },
        })
      } else {
        monaco.editor.defineTheme(themeName, {
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
            "editor.background": "#F9F7FD",
          },
        })
      }
    } else {
      if (isDark) {
        monaco.editor.defineTheme(themeName, {
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
            "editor.background": "#1A1A1A",
          },
        })
      } else {
        monaco.editor.defineTheme(themeName, {
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
            "editor.background": "#F9F7FD",
          },
        })
      }
    }
  }

  // Manually update Monaco editor theme when it changes
  // This handles theme changes after initial mount (e.g., user toggles theme, iframe with forcedTheme)
  // WORKAROUND: Multiple approaches to force background color update (Monaco bug)
  useEffect(() => {
    if (editorRef.current && monacoRef.current && mounted) {
      // When in iframe, read from URL - it's the source of truth (docs passes ?theme=dark|light)
      let currentTheme: string
      if (isInIframe && typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search)
        const themeParam = params.get("theme")
        currentTheme =
          themeParam === "dark" || themeParam === "light"
            ? themeParam
            : resolvedTheme || theme || "light"
      } else {
        currentTheme = resolvedTheme || theme || "light"
      }
      const isDark = currentTheme === "dark"
      const currentThemeName = readOnly
        ? isDark
          ? "yaml-custom-dark-readonly"
          : "yaml-custom-light-readonly"
        : isDark
          ? "yaml-custom-dark"
          : "yaml-custom-light"

      // Only update if theme actually changed
      if (prevThemeRef.current !== currentThemeName) {
        try {
          // WORKAROUND 1: Redefine the theme to force Monaco to re-apply all colors
          defineThemeIfNeeded(
            monacoRef.current,
            currentThemeName,
            isDark,
            readOnly
          )

          // WORKAROUND 2: Set the theme
          monacoRef.current.editor.setTheme(currentThemeName)

          // WORKAROUND 3: Manually update DOM styles after a brief delay to ensure theme is applied
          // Get the background color from the theme definition
          const backgroundColor = readOnly
            ? isDark
              ? "#1A1A1A"
              : "#F9F7FD"
            : isDark
              ? "#1A1A1A"
              : "#F9F7FD"

          // Use requestAnimationFrame to ensure DOM is ready
          requestAnimationFrame(() => {
            if (editorRef.current) {
              try {
                // Get the editor container and background elements
                const container = editorRef.current.getContainerDomNode()
                const background = container?.querySelector(
                  ".monaco-editor-background"
                )

                // Manually set background color on container and background elements
                if (container) {
                  container.style.backgroundColor = backgroundColor
                }
                if (background) {
                  ;(background as HTMLElement).style.backgroundColor =
                    backgroundColor
                }

                // Also update CSS variable if it exists
                if (container) {
                  container.style.setProperty(
                    "--vscode-editor-background",
                    backgroundColor
                  )
                }
              } catch (error) {
                // Silently fail if DOM update fails
              }
            }
          })

          prevThemeRef.current = currentThemeName
        } catch (error) {
          // Silently fail if theme update fails
        }
      }
    }
  }, [theme, resolvedTheme, mounted, readOnly, isInIframe])

  // Force scrollbar to always be visible on mobile
  useEffect(() => {
    if (!mounted || !isMobile) return

    const styleId = `monaco-yaml-editor-scrollbar-mobile`
    let styleElement = document.getElementById(styleId) as HTMLStyleElement

    if (!styleElement) {
      styleElement = document.createElement("style")
      styleElement.id = styleId
      document.head.appendChild(styleElement)
    }

    styleElement.textContent = `
      .monaco-editor .monaco-scrollable-element > .scrollbar {
        opacity: 1 !important;
        visibility: visible !important;
      }
      .monaco-editor .monaco-scrollable-element > .scrollbar > .slider {
        opacity: 1 !important;
        visibility: visible !important;
      }
    `

    return () => {
      if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement)
      }
    }
  }, [mounted, isMobile])

  // Calculate theme name based on current theme and readOnly state
  // When in iframe, read from URL - it's the source of truth (docs passes ?theme=dark|light)
  const getThemeForKey = () => {
    if (isInIframe && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const themeParam = params.get("theme")
      if (themeParam === "dark" || themeParam === "light") return themeParam
    }
    return theme || resolvedTheme || "light"
  }
  const themeName = readOnly
    ? getThemeForKey() === "dark"
      ? "yaml-custom-dark-readonly"
      : "yaml-custom-light-readonly"
    : getThemeForKey() === "dark"
      ? "yaml-custom-dark"
      : "yaml-custom-light"

  return (
    <div className={`h-full w-full ${readOnly ? "bg-muted/30" : ""}`}>
      <MonacoYamlEditorComponent
        key={`yaml-editor-${themeName}`}
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
