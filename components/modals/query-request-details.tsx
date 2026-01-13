"use client"

import * as React from "react"
import { SecureTextComponent } from "@/components/ui/secure-text"
import { Selector } from "@/components/selector/selector"
import { cn, getApiBaseUrl } from "@/lib/utils"
import { ModelDetails, Organization } from "@/types"
import { getOrganizationInfo } from "@/utils/organization-info"
import * as Dialog from "@radix-ui/react-dialog"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import CopyTextIcon from "@/components/ui/copy-text-icon"
import MonacoCodeEditor from "@/components/editor/monaco-code-editor"
import {
  getRankAPIConfigFromConfig,
  getRankApiMethodFromConfig,
  getRankApiUriFromConfig,
} from "@/utils/rank-utils"
import {
  ArrowUpRight,
  BookOpenText,
  CircleHelp,
  FileCode2,
  Lock,
  SquareDashedBottomCode,
  X,
} from "lucide-react"
import CloseModalButton from "@/components/ui/close-modal-button"
import { EditorMode, QueryTab } from "@/lib/types/query.types"
import {
  ItemRecommendationTab,
  UserRecommendationTab,
  QueryTab as QueryTabEnum,
} from "@/types/enums"

export interface QueryRequestDetailsProps
  extends React.HTMLAttributes<HTMLDivElement> {
  activeTab: QueryTab
  currentQueryTab: QueryTabEnum
  currentRankTab: UserRecommendationTab | ItemRecommendationTab
  modelDetails: ModelDetails
  configuration: Record<string, any>
  queryStep: number | string
  isReadOnly?: boolean
}

const getCLICodeSnippet = (
  method: string,
  modelName: string,
  config: Record<string, any> | string
): string => {
  // Handle string config (query content) by wrapping it in an object
  const configObj = typeof config === "string" ? { query: config } : config

  const params = JSON.stringify(configObj, null, 2)

  // Escape single quotes for shell: replace ' with '\''
  // This allows the JSON to be safely embedded in single quotes
  const escapedParams = params.replace(/'/g, "'\\''")

  const cliScript =
    `shaped query --engine-name ${modelName} --query '${escapedParams}'`.trim()

  return cliScript
}

const getCurlCodeSnippet = (
  apiKey: string,
  uri: string,
  method: string,
  config: Record<string, any> | string
): string => {
  const queryParams =
    method.toUpperCase() === "GET" &&
    typeof config === "object" &&
    Object.keys(config).length > 0
      ? `?${new URLSearchParams(config).toString()}`
      : ""

  // Always create a proper JSON object to ensure proper escaping
  const jsonPayload =
    typeof config === "string"
      ? JSON.stringify({ query: config, return_metadata: true })
      : JSON.stringify(config)

  // Escape single quotes for shell: replace ' with '\''
  // This allows the JSON to be safely embedded in single quotes
  const escapedJson = jsonPayload.replace(/'/g, "'\\''")

  // Build curl command with multi-line format, but data on single line
  const curlCommand = `curl -X ${method.toUpperCase()} "${uri}${queryParams}" \\\n  -H "x-api-key: ${apiKey}" \\\n  -H "Content-Type: application/json" \\\n  --data '${escapedJson}'`

  return curlCommand
}

const getPythonCodeSnippet = (
  apiKey: string,
  uri: string,
  method: string,
  config: Record<string, any>
): string => {
  const correctedConfig = JSON.stringify(config, null, 4)

  const dataSnippet =
    method.toUpperCase() === "POST"
      ? `json=requestConfig`
      : `params=requestConfig`

  const pythonScript = `
import requests
import json

# API details
url = "${uri}"
headers = {
    "x-api-key": "${apiKey}",
    "Content-Type": "application/json"
}

# Request config
requestConfig = ${correctedConfig}

try:
    # API request
    response = requests.${method.toLowerCase()}(
        url, 
        headers=headers, 
        ${dataSnippet}
    )

    # Handle response
    if response.status_code == 200:
        print("Response:", json.dumps(response.json(), indent=4))
    else:
        print("Error:", response.status_code, response.text 
except requests.exceptions.RequestException as e:
    print("An error occurred:", e 
    `

  return pythonScript
}

const getNodeCodeSnippet = (
  apiKey: string,
  uri: string,
  method: string,
  config: Record<string, any>
): string => {
  const requestConfig = JSON.stringify(config, null, 2)
  const dataSnippet =
    method.toUpperCase() === "POST"
      ? `data: requestConfig,`
      : `params: requestConfig,`

  const nodeScript = `
  const axios = require("axios");
  
  const apiKey = "${apiKey}";
  const uri = "${uri}";
  const requestConfig = ${requestConfig};
  
  axios.${method.toLowerCase()}(uri, {
      ${dataSnippet}
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    })
    .then((response => {
      console.log("Response:", response.data);
    })
    .catch((error => {
      console.error("Error:", error.response?.data || error.message);
    });
  `

  return nodeScript
}

const getMonacoThemeConfig = (
  editorMode: EditorMode,
  theme: string | undefined,
  readOnly: boolean
) => {
  const isDark = theme === "dark"
  const isSql = editorMode === EditorMode.SQL
  const themePrefix = isSql ? "sql" : "yaml"
  const themeVariant = readOnly ? "-readonly" : ""
  const themeName = `${themePrefix}-custom-${isDark ? "dark" : "light"}${themeVariant}`
  const backgroundColor = isDark
    ? readOnly
      ? "#0f0f0f"
      : "#1E1E1E"
    : readOnly
    ? editorMode === EditorMode.PLAIN
      ? "#FFFFFF"
      : "#F9FAFB"
    : "#FFFFFF"

  return { themeName, backgroundColor }
}

export function QueryRequestDetails({
  activeTab,
  currentQueryTab,
  currentRankTab,
  modelDetails,
  configuration,
  className,
  queryStep,
  isReadOnly = false,
}: QueryRequestDetailsProps) {
  const [requestType, setRequestType] = useState("cURL")
  const [organization, setOrganization] = useState<Organization>(
    {} as Organization
  )
  const { theme } = useTheme()
  console.log("activeTab", activeTab)
  const editorMode = activeTab?.editorMode ?? EditorMode.PLAIN
  const { themeName, backgroundColor } = getMonacoThemeConfig(
    editorMode,
    theme,
    isReadOnly
  )

  const getCodeSnippet = (requestType: string) => {
    const codeSnippet =
      requestType == "cURL"
        ? getCurlCodeSnippet(
            "<apiKey>",
            `${getApiBaseUrl()}/v2/engines/${activeTab?.engine}/query`,
            "POST",
            { query: activeTab?.content, return_metadata: true }
          )
        : requestType == "CLI"
        ? getCLICodeSnippet("POST", `${activeTab?.engine}`, {
            query: activeTab?.content,
          })
        : requestType == "Python"
        ? getPythonCodeSnippet(
            "<apiKey>",
            getRankApiUriFromConfig(
              configuration,
              currentQueryTab,
              currentRankTab,
              modelDetails.model_uri,
              queryStep
            ),
            getRankApiMethodFromConfig(
              configuration,
              currentQueryTab,
              currentRankTab
            ),
            getRankAPIConfigFromConfig(
              configuration,
              currentQueryTab,
              currentRankTab,
              modelDetails,
              queryStep
            )
          )
        : getNodeCodeSnippet(
            "<apiKey>",
            getRankApiUriFromConfig(
              configuration,
              currentQueryTab,
              currentRankTab,
              modelDetails.model_uri,
              queryStep
            ),
            getRankApiMethodFromConfig(
              configuration,
              currentQueryTab,
              currentRankTab
            ),
            getRankAPIConfigFromConfig(
              configuration,
              currentQueryTab,
              currentRankTab,
              modelDetails,
              queryStep
            )
          )
    return codeSnippet
  }

  const getCodeSnippetCopyContent = (requestType: string) => {
    const getCopyContent =
      requestType == "cURL"
        ? getCurlCodeSnippet(
            organization.apiKey,
            `${getApiBaseUrl()}/v2/engines/${activeTab?.engine}/query`,
            "POST",
            { query: activeTab?.content, return_metadata: true }
          )
        : requestType == "CLI"
        ? getCLICodeSnippet("POST", `${activeTab?.engine}`, {
            query: activeTab?.content,
          })
        : requestType == "Python"
        ? getPythonCodeSnippet(
            organization.apiKey,
            getRankApiUriFromConfig(
              configuration,
              currentQueryTab,
              currentRankTab,
              modelDetails.model_uri,
              queryStep
            ),
            getRankApiMethodFromConfig(
              configuration,
              currentQueryTab,
              currentRankTab
            ),
            getRankAPIConfigFromConfig(
              configuration,
              currentQueryTab,
              currentRankTab,
              modelDetails,
              queryStep
            )
          )
        : getNodeCodeSnippet(
            organization.apiKey,
            getRankApiUriFromConfig(
              configuration,
              currentQueryTab,
              currentRankTab,
              modelDetails.model_uri,
              queryStep
            ),
            getRankApiMethodFromConfig(
              configuration,
              currentQueryTab,
              currentRankTab
            ),
            getRankAPIConfigFromConfig(
              configuration,
              currentQueryTab,
              currentRankTab,
              modelDetails,
              queryStep
            )
          )
    return getCopyContent
  }

  useEffect(() => {
    async function getOrganization() {
      try {
        const organization = await getOrganizationInfo()
        if (!organization) {
          return
        }
        setOrganization(organization)
      } catch (error) {
        console.error("Error occurred while fetching the API key : ", error)
      }
    }
    getOrganization()
  }, [])

  return (
    <Dialog.Root>
      <div className="flex w-full justify-between">
        <Dialog.Trigger asChild>
          <button
            className={cn(
              "flex items-center gap-1 border border-border bg-background-primary px-4 py-2 text-xs font-medium text-accent-brand-purple shadow-sm hover:bg-background-secondary",
              className
            )}
          >
            <SquareDashedBottomCode
              className="size-5 shrink-0 text-accent-brand-purple "
              strokeWidth={1.25}
            />
            <span>Request Details</span>
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="data-[state=open]:animate-overlay-show z-9998 fixed inset-0 bg-gray-700/70" />
          <Dialog.Content className="data-[state=open]:animate-content-show z-9999 fixed left-[50%] top-[50%] max-h-[80vh] w-[40%] translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-[6px] border border-border bg-background-primary shadow-lg focus:outline-none">
            <div className="flex flex-col">
              <div className="flex items-center justify-between rounded-t-[8px] border-b border-border bg-background-base p-4">
                <div className="flex items-center gap-2">
                  <Dialog.Close asChild>
                    <CloseModalButton />
                  </Dialog.Close>
                  <h1 className="text-xl font-bold text-foreground">
                    Request Details
                  </h1>
                </div>
                <div className="flex items-center gap-6">
                  <Link
                    href={
                      "https://docs.shaped.ai/docs/v2/query_reference/shapedql/?hide-nav=true"
                    }
                    target="_blank"
                    className="flex flex-col items-center gap-1"
                  >
                    <BookOpenText
                      className="size-5 text-accent-brand-purple"
                      strokeWidth={1.25}
                    />
                    <span className="text-xs font-normal text-foreground">
                      Docs
                    </span>
                  </Link>
                  <Link
                    href={"https://docs.shaped.ai/docs/v2/support/contact"}
                    target="_blank"
                    className="flex flex-col items-center gap-1"
                  >
                    <CircleHelp
                      className="size-5 text-accent-brand-purple"
                      strokeWidth={1.25}
                    />
                    <span className="text-xs font-normal text-foreground">
                      Support
                    </span>
                  </Link>
                </div>
              </div>

              <div className="bg-background-primary p-6">
                <h2 className="mb-2 text-lg font-bold text-foreground">
                  API Key
                </h2>
                <div className="mb-3 flex items-center gap-2 rounded border bg-background-base px-3 py-2.5">
                  <Lock className="size-4 text-foreground" strokeWidth={2} />
                  <SecureTextComponent
                    secureText={organization?.apiKey}
                    className="flex-1 truncate"
                  />
                </div>

                <h2 className="mb-2 text-lg font-bold text-foreground">URI</h2>
                <div className="mb-4 flex items-center gap-2 rounded border bg-background-base px-3 py-2.5">
                  <div className="flex-1 truncate text-sm font-normal text-foreground">
                    {`${getApiBaseUrl()}/v2/engines/${activeTab?.engine}/query`}
                  </div>
                  <CopyTextIcon
                    text={`${getApiBaseUrl()}/v2/engines/${activeTab?.engine}/query`}
                  />
                </div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-lg font-bold text-foreground">
                    Method
                  </span>
                  <Link
                    href={"https://docs.shaped.ai/docs/api/v2"}
                    target="_blank"
                    className="flex items-center gap-2"
                  >
                    <span className="text-xs font-normal text-foreground">
                      Learn more about the Shaped API
                    </span>
                    <ArrowUpRight
                      className="size-5 text-accent-brand-purple"
                      strokeWidth={1.25}
                    />
                  </Link>
                </div>

                <div className="dark rounded bg-background-solid p-4">
                  <div className="flex items-center justify-between text-foreground">
                    <Selector
                      onValueChange={(value) => setRequestType(value)}
                      items={["cURL", "CLI"]}
                      placeholder={requestType}
                      className="border border-border text-sm text-foreground focus:outline-none"
                    />
                    <CopyTextIcon
                      text={getCodeSnippetCopyContent(requestType)}
                    />
                  </div>

                  <MonacoCodeEditor
                    key={`${requestType}-${activeTab?.id}-${activeTab?.engine}`}
                    initialDoc={getCodeSnippet(requestType)}
                    language={
                      requestType == "Python"
                        ? "python"
                        : requestType == "Node"
                        ? "javascript"
                        : requestType == "cURL" || requestType == "CLI"
                        ? "shell"
                        : "python"
                    }
                    themeName={themeName}
                    backgroundColor={backgroundColor}
                  />
                </div>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </div>
    </Dialog.Root>
  )
}
