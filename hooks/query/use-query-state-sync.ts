"use client"

import { useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  encodeQueryState,
  decodeQueryState,
  type QueryPageState,
} from "@/lib/utils/query-state"

export function useQueryStateSync(
  getCurrentState: () => QueryPageState,
  applyState: (state: QueryPageState) => void,
  enabled = true,
) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasLoadedFromUrl = useRef(false)
  const applyStateRef = useRef(applyState)

  // Keep applyState ref up to date
  useEffect(() => {
    applyStateRef.current = applyState
  }, [applyState])

  useEffect(() => {
    if (!enabled) return
    if (hasLoadedFromUrl.current) return // Only load once on mount

    const encoded = searchParams?.get("q")
    if (encoded) {
      const state = decodeQueryState(encoded)
      if (state) {
        console.log("[v0] Loading query state from URL:", state)
        hasLoadedFromUrl.current = true
        applyStateRef.current(state)
      }
    }
  }, []) // Only run once on mount

  const syncToUrl = useCallback(
    (state: QueryPageState) => {
      if (!enabled) return

      const encoded = encodeQueryState(state)
      const url = new URL(window.location.href)
      url.searchParams.set("q", encoded)

      window.history.replaceState({}, "", url.toString())
    },
    [enabled],
  )

  const pushStateToHistory = useCallback(
    (state: QueryPageState) => {
      if (!enabled) return

      const encoded = encodeQueryState(state)
      const url = new URL(window.location.href)
      url.searchParams.set("q", encoded)

      window.history.pushState({ queryState: state }, "", url.toString())
    },
    [enabled],
  )

  useEffect(() => {
    if (!enabled) return

    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.queryState) {
        console.log(
          "[v0] Restoring state from browser history:",
          event.state.queryState,
        )
        applyStateRef.current(event.state.queryState)
      } else {
        const encoded = new URLSearchParams(window.location.search).get("q")
        if (encoded) {
          const state = decodeQueryState(encoded)
          if (state) {
            applyStateRef.current(state)
          }
        }
      }
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [enabled]) // Only depend on enabled, use ref for applyState

  return { syncToUrl, pushStateToHistory }
}

