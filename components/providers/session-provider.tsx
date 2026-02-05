"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react"

const REGISTRATION_QUERY_THRESHOLD = 3

interface SessionContextType {
  queryCount: number
  incrementQueryCount: () => void
  showRegistrationModal: boolean
  setShowRegistrationModal: (show: boolean) => void
}

const SessionContext = createContext<SessionContextType | null>(null)

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider")
  }
  return context
}

interface SessionProviderProps {
  children: ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [queryCount, setQueryCount] = useState(0)
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)

  const incrementQueryCount = useCallback(() => {
    setQueryCount((prev) => {
      const next = prev + 1
      if (next >= REGISTRATION_QUERY_THRESHOLD) {
        setTimeout(() => {
          setShowRegistrationModal(true)
        }, 4000)
      }
      return next
    })
  }, [])

  return (
    <SessionContext.Provider
      value={{
        queryCount,
        incrementQueryCount,
        showRegistrationModal,
        setShowRegistrationModal,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}
