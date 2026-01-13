"use client"

import { useState, useEffect, useRef } from "react"
import { EditorMode, type QueryTab } from "@/lib/types/query.types"
import { DEFAULT_SQL_QUERY, DEFAULT_YAML_QUERY } from "@/lib/constants/query.constants"
import { getQueryStateFromUrl } from "@/lib/utils/query-state"
import { parseCookie } from "@/lib/utils"

const DEFAULT_STORAGE_KEY = "query-tabs"

function getStorageKey(): string {
  // Try sessionStorage first (more reliable in client components)
  const assumedUserEmail = 
    typeof window !== "undefined" 
      ? sessionStorage.getItem("AssumedUserEmail") || parseCookie("AssumedUserEmail")
      : null
  
  if (assumedUserEmail) {
    // Use the assumed user email to create a unique storage key
    return `query-tabs-${assumedUserEmail}`
  }
  
  // No assumed user, use default key
  return DEFAULT_STORAGE_KEY
}

export function useQueryTabs() {
  const [tabs, setTabs] = useState<QueryTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string>("")
  const isRestoringFromUrl = useRef(false)
  const storageKeyRef = useRef<string>(getStorageKey())

  useEffect(() => {
    // Update storage key if assumed user changes
    storageKeyRef.current = getStorageKey()
    
    // Check URL state first - if it exists, skip localStorage
    // URL state will be applied by use-query-state-sync hook
    const urlState = getQueryStateFromUrl()
    if (urlState && urlState.tabs && urlState.tabs.length > 0) {
      // URL state exists, skip localStorage - it will be handled by use-query-state-sync
      isRestoringFromUrl.current = true
      return
    }

    // No URL state, load from localStorage
    const stored = localStorage.getItem(storageKeyRef.current)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setTabs(parsed.tabs || [])
        setActiveTabId(parsed.activeTabId || "")
      } catch (error) {
        console.error("Failed to parse stored tabs:", error)
        createDefaultTab()
      }
    } else {
      createDefaultTab()
    }
  }, [])

  useEffect(() => {
    // Update storage key if assumed user changes
    storageKeyRef.current = getStorageKey()
    
    // Don't save to localStorage if we're restoring from URL
    if (isRestoringFromUrl.current) {
      // Reset the flag after a short delay to allow restoration to complete
      setTimeout(() => {
        isRestoringFromUrl.current = false
      }, 100)
      return
    }
    
    if (tabs.length > 0) {
      localStorage.setItem(storageKeyRef.current, JSON.stringify({ tabs, activeTabId }))
    }
  }, [tabs, activeTabId])

  const createDefaultTab = () => {
    const newTab: QueryTab = {
      id: `tab-${Date.now()}`,
      name: "Query 1",
      content: DEFAULT_SQL_QUERY,
      language: "sql",
      editorMode: EditorMode.SQL,
    }
    setTabs([newTab])
    setActiveTabId(newTab.id)
  }

  const addTab = () => {
    const newTab: QueryTab = {
      id: `tab-${Date.now()}`,
      name: `Query ${tabs.length + 1}`,
      content: DEFAULT_SQL_QUERY,
      language: "sql",
      editorMode: EditorMode.SQL,
    }
    setTabs([...tabs, newTab])
    setActiveTabId(newTab.id)
  }

  const closeTab = (tabId: string) => {
    const newTabs = tabs.filter((t) => t.id !== tabId)
    setTabs(newTabs)

    if (activeTabId === tabId && newTabs.length > 0) {
      setActiveTabId(newTabs[0].id)
    } else if (newTabs.length === 0) {
      createDefaultTab()
    }
  }

  const shallowEqual = (a: QueryTab, b: QueryTab) => {
    for (const key in a) {
      if (a[key as keyof QueryTab] !== b[key as keyof QueryTab]) {
        return false
      }
    }
    for (const key in b) {
      if (!(key in a)) {
        return false
      }
    }
    return true
  }

  const updateTab = (tabId: string, updates: Partial<QueryTab>) => {
    setTabs((prevTabs) => {
      let hasChanged = false
      const nextTabs = prevTabs.map((tab) => {
        if (tab.id !== tabId) {
          return tab
        }
        const nextTab = { ...tab, ...updates }
        if (shallowEqual(tab, nextTab)) {
          return tab
        }
        hasChanged = true
        return nextTab
      })

      if (!hasChanged) {
        return prevTabs
      }

      return nextTabs
    })
  }

  const renameTab = (tabId: string, newName: string) => {
    updateTab(tabId, { name: newName })
  }

  return {
    tabs,
    activeTabId,
    activeTab: tabs.find((t) => t.id === activeTabId),
    addTab,
    closeTab,
    updateTab,
    renameTab,
    setActiveTabId,
    setTabs,
  }
}

