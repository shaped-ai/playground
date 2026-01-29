import { useState, useCallback, useMemo } from "react"

export type TourStep = {
  id: string
  targetId: "sql-editor" | "run-button" | "results-pane" | "query-examples"
  title: string
  body: string
  hint?: string
}

export function useOnboardingTour(isMobile: boolean) {
  const steps: TourStep[] = useMemo(() => {
    const commonSteps: TourStep[] = [
      {
        id: "sql-editor",
        targetId: "sql-editor",
        title: "Write your queries here",
        body: "This is where you write ShapedQL queries. Start from the example, or type your own to explore the Movielens demo dataset.",
      },
      {
        id: "run-button",
        targetId: "run-button",
        title: "Run your query and see results",
        body: "When you're ready, run your query to see how your parameters shape the results.",
        hint: "You can also press Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux) to run quickly.",
      },
    ]

    if (isMobile) {
      return commonSteps
    }

    return [
      ...commonSteps,
      // Commented out last 2 steps - can be re-enabled later if needed
      // {
      //   id: "results-pane",
      //   targetId: "results-pane",
      //   title: "Explore your results",
      //   body:
      //     "Query results appear here. Switch between views, sort, and scan the data to understand what your query is returning.",
      // },
      {
        id: "query-examples",
        targetId: "query-examples",
        title: "Jump-start with examples",
        body: "Use these saved queries to explore common patterns and ShapedQL syntax without starting from scratch.",
      },
    ]
  }, [isMobile])

  const [isOpen, setIsOpen] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  const startTour = useCallback(
    (fromStart: boolean = true) => {
      if (!steps.length) return
      if (fromStart) setCurrentStepIndex(0)
      setIsOpen(true)
    },
    [steps.length]
  )

  const closeTour = useCallback(() => {
    setIsOpen(false)
  }, [])

  const skipTour = useCallback(() => {
    setIsOpen(false)
  }, [])

  const nextStep = useCallback(() => {
    setCurrentStepIndex((prev) => {
      const next = prev + 1
      if (next >= steps.length) {
        setIsOpen(false)
        return prev
      }
      return next
    })
  }, [steps.length])

  const prevStep = useCallback(() => {
    setCurrentStepIndex((prev) => (prev > 0 ? prev - 1 : prev))
  }, [])

  const currentStep = steps[currentStepIndex] ?? steps[0]

  return {
    steps,
    isOpen,
    currentStepIndex,
    currentStep,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    closeTour,
  }
}
