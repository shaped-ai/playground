"use client"
import { EditorMode } from "@/lib/types/query.types"
import { PlainMonacoEditor } from "./plain-monaco-editor"
import { SqlMonacoEditor } from "./sql-monaco-editor"
import { YamlMonacoEditor } from "./yaml-monaco-editor"

interface QueryEditorProps {
  value: string
  onChange: (value: string) => void
  mode: EditorMode
  readOnly?: boolean
  onRun?: () => void
}

export function QueryEditor({
  value,
  onChange,
  mode,
  readOnly = false,
  onRun,
}: QueryEditorProps) {
  if (mode === EditorMode.PLAIN) {
    return (
      <PlainMonacoEditor
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        onRun={onRun}
      />
    )
  }

  if (mode === EditorMode.YAML) {
    return (
      <YamlMonacoEditor
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        onRun={onRun}
      />
    )
  }

  if (mode === EditorMode.SQL) {
    return (
      <SqlMonacoEditor
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        onRun={onRun}
      />
    )
  }

  return null
}
