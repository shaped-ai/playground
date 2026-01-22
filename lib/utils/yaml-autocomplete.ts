import type * as Monaco from "monaco-editor"
import { QUERY_YAML_SCHEMA } from "@/lib/schema/yaml-schema"

function getYAMLPath(content: string, position: Monaco.Position): string[] {
  const lines = content.split("\n")
  const path: string[] = []
  const indentStack: Array<{ indent: number; key: string }> = []

  for (let i = 0; i < position.lineNumber && i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith("#")) continue

    // Calculate indentation
    const indent = line.length - line.trimStart().length

    // Pop stack if we're at a lower indentation level
    while (
      indentStack.length > 0 &&
      indentStack[indentStack.length - 1].indent >= indent
    ) {
      indentStack.pop()
    }

    // Extract key from line
    const keyMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*):/)
    if (keyMatch) {
      const key = keyMatch[1]
      indentStack.push({ indent, key })
    }
  }

  return indentStack.map((item) => item.key)
}

function getSchemaAtPath(schema: any, path: string[]): any {
  let current = schema

  for (const segment of path) {
    if (current.properties && current.properties[segment]) {
      current = current.properties[segment]
    } else if (current.patternProperties) {
      // Handle dynamic keys
      const patterns = Object.keys(current.patternProperties)
      if (patterns.length > 0) {
        current = current.patternProperties[patterns[0]]
      } else {
        return null
      }
    } else if (current.items) {
      current = current.items
    } else {
      return null
    }
  }

  return current
}

export function getYAMLCompletions(
  content: string,
  position: Monaco.Position,
  monaco: typeof Monaco
): Monaco.languages.CompletionItem[] {
  const path = getYAMLPath(content, position)
  const schemaContext = getSchemaAtPath(QUERY_YAML_SCHEMA, path)

  if (!schemaContext) {
    return []
  }

  const completions: Monaco.languages.CompletionItem[] = []
  const line = content.split("\n")[position.lineNumber - 1] || ""
  const beforeCursor = line.substring(0, position.column - 1)

  // Check if we're completing a value (after colon)
  const isValueCompletion = beforeCursor.includes(":")

  if (isValueCompletion) {
    // Suggest enum values if available
    if (schemaContext.enum && Array.isArray(schemaContext.enum)) {
      schemaContext.enum.forEach((value: string) => {
        completions.push({
          label: value,
          kind: monaco.languages.CompletionItemKind.EnumMember,
          insertText: `"${value}"`,
          documentation: schemaContext.description || `Value: ${value}`,
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          },
        })
      })
    }

    // Suggest type values
    if (path[path.length - 1] === "type" && schemaContext.type) {
      const types = Array.isArray(schemaContext.type)
        ? schemaContext.type
        : [schemaContext.type]
      types.forEach((type: string) => {
        if (!schemaContext.enum || !schemaContext.enum.includes(type)) {
          completions.push({
            label: type,
            kind: monaco.languages.CompletionItemKind.TypeParameter,
            insertText: `"${type}"`,
            documentation: `Type: ${type}`,
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            },
          })
        }
      })
    }

    // Boolean suggestions
    if (schemaContext.type === "boolean") {
      ;["true", "false"].forEach((value) => {
        completions.push({
          label: value,
          kind: monaco.languages.CompletionItemKind.Constant,
          insertText: value,
          documentation: `Boolean value: ${value}`,
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          },
        })
      })
    }
  } else {
    // Suggest property keys
    if (schemaContext.properties) {
      Object.entries(schemaContext.properties).forEach(
        ([key, value]: [string, any]) => {
          completions.push({
            label: key,
            kind: monaco.languages.CompletionItemKind.Property,
            insertText: `${key}: `,
            documentation: value.description || `Property: ${key}`,
            detail: value.type ? `Type: ${value.type}` : undefined,
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            },
          })
        }
      )
    }

    // Suggest common query names for queries object
    if (path[path.length - 1] === "queries") {
      const queryNames = [
        "similar_users_content",
        "search_items",
        "recommend_products",
        "find_documents",
      ]
      queryNames.forEach((name) => {
        completions.push({
          label: name,
          kind: monaco.languages.CompletionItemKind.Field,
          insertText: `${name}:\n  `,
          documentation: `Query name: ${name}`,
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          },
        })
      })
    }
  }

  return completions
}

export function registerYAMLCompletionProvider(
  monaco: typeof Monaco
): Monaco.IDisposable {
  return monaco.languages.registerCompletionItemProvider("yaml", {
    triggerCharacters: [":", " ", "\n"],
    provideCompletionItems: (model, position) => {
      const content = model.getValue()
      const suggestions = getYAMLCompletions(content, position, monaco)

      return {
        suggestions,
      }
    },
  })
}
