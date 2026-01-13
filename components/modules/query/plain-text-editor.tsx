"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"

interface PlainTextEditorProps {
  value: string
  onChange: (value: string) => void
}

export function PlainTextEditor({ value, onChange }: PlainTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLPreElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  const highlightSyntax = (code: string): string => {
    // YAML syntax highlighting
    const highlighted = code
      // Comments
      .replace(/(#.*)/g, '<span class="token-comment">$1</span>')
      // Strings (double quotes)
      .replace(/("(?:[^"\\]|\\.)*")/g, '<span class="token-string">$1</span>')
      // Strings (single quotes)
      .replace(/('(?:[^'\\]|\\.)*')/g, '<span class="token-string">$1</span>')
      // Numbers
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="token-number">$1</span>')
      // Booleans
      .replace(
        /\b(true|false|null|yes|no)\b/gi,
        '<span class="token-boolean">$1</span>'
      )
      // Keys (words followed by colon)
      .replace(
        /^(\s*)([a-zA-Z_][\w-]*?)(\s*):/gm,
        '$1<span class="token-key">$2</span>$3:'
      )

    return highlighted
  }

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement
    setScrollTop(target.scrollTop)
    setScrollLeft(target.scrollLeft)
  }

  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollTop = scrollTop
      highlightRef.current.scrollLeft = scrollLeft
    }
  }, [scrollTop, scrollLeft])

  const lineCount = value.split("\n").length
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1)

  return (
    <div className="bg-background relative h-full w-full overflow-hidden font-mono text-sm">
      <div className="flex h-full">
        {/* Line numbers */}
        <div className="bg-muted/30 shrink-0 select-none border-r border-border px-2 py-3 text-right text-muted-foreground">
          {lineNumbers.map((num) => (
            <div key={num} className="leading-6">
              {num}
            </div>
          ))}
        </div>

        {/* Editor area */}
        <div className="relative flex-1 overflow-hidden">
          {/* Highlighted code overlay */}
          <pre
            ref={highlightRef}
            className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words px-3 py-3 leading-6"
            aria-hidden="true"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <code
              dangerouslySetInnerHTML={{
                __html: highlightSyntax(value || ""),
              }}
            />
          </pre>

          {/* Textarea for input */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            className="selection:bg-primary/20 relative h-full w-full resize-none overflow-auto whitespace-pre-wrap break-words bg-transparent px-3 py-3 leading-6 text-transparent caret-foreground outline-none"
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>
      </div>
    </div>
  )
}
