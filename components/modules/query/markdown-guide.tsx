"use client"

import { useState, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Loader2 } from "lucide-react"

export function MarkdownGuide() {
  const [content, setContent] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch("/playground-guide.md")
      .then((res) => res.text())
      .then((text) => {
        setContent(text)
        setIsLoading(false)
      })
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background-solid">
        <Loader2 className="h-8 w-8 animate-spin text-accent-brand-purple" />
      </div>
    )
  }

  return (
    <div className="h-full w-full overflow-auto bg-background-solid">
      <div className="markdown-guide mx-auto max-w-4xl p-8">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="mb-6 border-b border-border pb-4 text-4xl text-foreground">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="mb-4 mt-8 text-2xl text-foreground">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="mb-3 mt-6 text-xl text-foreground">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="mb-4 leading-7 text-foreground">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="mb-4 ml-6 list-disc space-y-2 text-foreground">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="mb-4 ml-6 list-decimal space-y-2 text-foreground">
                {children}
              </ol>
            ),
            li: ({ children }) => <li className="leading-7">{children}</li>,
            code: ({ className, children }) => {
              const isBlock = className?.includes?.("language-")
              return isBlock ? (
                <code className="font-mono text-sm text-foreground">
                  {children}
                </code>
              ) : (
                <code className="rounded bg-background-primary px-1.5 py-0.5 font-mono text-sm text-foreground">
                  {children}
                </code>
              )
            },
            pre: ({ children }) => (
              <pre className="mb-4 overflow-x-auto rounded-lg bg-background-primary p-4 font-mono text-sm text-foreground">
                {children}
              </pre>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                className="text-accent-brand-purple underline-offset-4 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  )
}
