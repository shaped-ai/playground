"use client"

/**
 * Toast types for compatibility
 * Note: The toast component is deprecated in favor of sonner.
 * This file provides type definitions that may be referenced by other components.
 */

export type ToastActionElement = React.ReactElement

export interface ToastProps {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  variant?: "default" | "destructive"
  duration?: number
}

export type Toast = ToastProps

// Re-export sonner toast function for compatibility
export { toast } from "sonner"
