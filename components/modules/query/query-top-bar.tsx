import { ModelSelector } from "@/components/selector/model-selector"

import React, { SetStateAction, Dispatch } from "react"
import { AccountType } from "@/types/enums"

interface QueryTopBarProps {
  selectedModel: string
  setSelectedModel: Dispatch<SetStateAction<string>>
  accountType: AccountType
  currentUserEmail: string
}
export const QueryTopBar = ({
  selectedModel,
  setSelectedModel,
  accountType,
  currentUserEmail,
}: QueryTopBarProps) => {
  return (
    <div className="flex items-center justify-between">
      <ModelSelector
        modelName={selectedModel}
        setModelName={setSelectedModel}
        accountType={accountType}
        currentUserEmail={currentUserEmail}
      />
    </div>
  )
}
