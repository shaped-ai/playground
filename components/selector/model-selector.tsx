"use client"

import React, { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  getDemoOrganizationInfo,
  getOrganizationInfo,
} from "@/utils/organization-info"
import axios from "axios"
import moment from "moment"
import { usePathname, useSearchParams } from "next/navigation"
import { AccountType } from "@/types/enums"
import { ComboSearchbox } from "./combo-search-box"
import { useRouter } from "next/navigation"
import { PLAYGROUND_VIEWER_EMAIL, SHAPED_PLAYGROUND_URL } from "@/lib/constants"
// @ts-ignore - posthog-js/react may not be installed
let usePostHog: any = () => null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  usePostHog = require("posthog-js/react").usePostHog
} catch {
  // posthog not installed
}
import { cn } from "@/lib/utils"

interface ModelSelectorProps extends React.HTMLAttributes<HTMLDivElement> {
  modelName: string
  accountType: AccountType
  currentUserEmail: string
  setModelName?: React.Dispatch<React.SetStateAction<string>>
}
export function ModelSelector({
  modelName,
  accountType,
  currentUserEmail,
  setModelName,
  className,
}: ModelSelectorProps) {
  const [baseUrl, setBaseUrl] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [demoApiKey, setDemoApiKey] = useState("")
  const [allModels, setAllModels] = useState<any>([])
  const searchParams = useSearchParams()
  const posthog = usePostHog()
  const path = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin)
    }
  }, [])

  useEffect(() => {
    getOrganizationInfo()
      .then((org) => setApiKey(org.apiKey))
      .catch((error) => console.error("Error while fetching api key"))
    getDemoOrganizationInfo()
      .then((demoOrg) => setDemoApiKey(demoOrg.apiKey))
      .catch((error) => console.error("Error while fetching demo api key"))
  }, [])

  const getPlaygroundModels = async () => {
    const demoModelList = await posthog.getFeatureFlagPayload("demoModelList")
    return demoModelList as any[]
  }

  const { data: playgroundDemoModels } = useQuery({
    queryKey: ["playgroundDemoModels"],
    queryFn: getPlaygroundModels,
    enabled:
      currentUserEmail == PLAYGROUND_VIEWER_EMAIL ||
      accountType == AccountType.TRIAL ||
      accountType == AccountType.DEMO ||
      baseUrl.includes(SHAPED_PLAYGROUND_URL),
    select: (res) => res,
  })

  const getModels = async () => {
    const headers = { "x-api-key": `${apiKey}` }
    return await axios(`/api/models`, {
      headers: headers,
    })
  }
  const { data: models } = useQuery({
    queryKey: ["Models", apiKey],
    queryFn: getModels,
    enabled: !!apiKey,
    select: (resp) =>
      resp?.data.data.models.toSorted(
        (a: any, b: any) =>
          moment(b.created_at.replace(" UTC", "")).unix() -
          moment(a.created_at.replace(" UTC", "")).unix()
      ),
  })

  const getDemoModels = async () => {
    const headers = { "x-api-key": `${demoApiKey}` }
    return await axios(`/api/models`, {
      headers: headers,
    })
  }
  const { data: demoModels } = useQuery({
    queryKey: ["Demo Models", demoApiKey],
    queryFn: getDemoModels,
    enabled: !!demoApiKey && accountType == AccountType.ADMIN,
    select: (resp: any) =>
      resp?.data.data.models.toSorted(
        (a: any, b: any) =>
          moment(b.created_at.replace(" UTC", "")).unix() -
          moment(a.created_at.replace(" UTC", "")).unix()
      ),
  })

  useEffect(() => {
    if (
      playgroundDemoModels &&
      (baseUrl.includes(SHAPED_PLAYGROUND_URL) || models?.length == 0)
    ) {
      const demoItems = playgroundDemoModels?.map((element) => {
        return {
          label: element.alias,
          searchValues: [element.name, element.alias],
        }
      })
      setAllModels(demoItems)
    } else {
      const modelsLabels =
        models?.map((element: any) => {
          return {
            label: element.model_name,
            searchValues: [element.model_name],
          }
        }) || []
      const demoModelsLabels =
        demoModels?.map((element: any) => {
          return {
            label: element.model_name + " (Demo",
            searchValues: [element.model_name + " (Demo"],
          }
        }) || []

      setAllModels([...modelsLabels, ...demoModelsLabels])
    }
  }, [models, demoModels, apiKey, demoApiKey, playgroundDemoModels])

  const handleModelSelect = (selectedModel: string) => {
    const endStr = " (Demo)"
    const isDemoModel = selectedModel.endsWith(endStr)
    const actualModelName = isDemoModel
      ? selectedModel.slice(0, -endStr.length)
      : (playgroundDemoModels?.find((model) => model.alias == selectedModel)
          ?.name ?? selectedModel)

    setModelName?.(actualModelName)
    const pathElements = path?.split("/")
    const lastPath = pathElements?.pop()
    pathElements?.pop()
    // pathElements?.push(actualModelName     pathElements?.push(lastPath!)
    const newPath = pathElements?.join("/") as string
    let newQueryParams =
      isDemoModel ||
      baseUrl.includes(SHAPED_PLAYGROUND_URL) ||
      models?.length == 0
        ? "isDemoModel=true&"
        : ""

    if (searchParams) {
      for (const [key, value] of searchParams) {
        if (key != "isDemoModel") {
          newQueryParams += key + "=" + value + "&"
        }
      }
    }

    // if (!newQueryParams.includes("modelName")) {
    //   newQueryParams += "modelName" + "=" + actualModelName + "&" || ""
    // }

    // router.push(`${newPath}?${newQueryParams}`)
  }

  const isDemoModel = !!searchParams?.get("isDemoModel")
  const currentModelName =
    isDemoModel &&
    accountType == AccountType.ADMIN &&
    !baseUrl.includes(SHAPED_PLAYGROUND_URL)
      ? `${modelName} (Demo)`
      : (playgroundDemoModels?.find((model) => model.name == modelName)
          ?.alias ?? modelName)

  return (
    <ComboSearchbox
      name="model"
      items={
        allModels.length > 0
          ? allModels
          : [
              {
                label: currentModelName,
                searchValues: [currentModelName],
              },
            ]
      }
      onItemSelect={handleModelSelect}
      selectedValue={currentModelName}
      disabled={false}
      canDeselect={false}
      className={cn("max-w-96 max-h-96", className)}
    />
  )
}
