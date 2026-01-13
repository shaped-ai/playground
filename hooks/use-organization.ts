"use client"

import { useEffect, useState } from "react"

import type { Organization } from "@/types"
import {
  getDemoOrganizationInfo,
  getLoggedInUserOrganizationInfo,
  getOrganizationInfo,
} from "@/utils/organization-info"

export function useOrganization(isDemoModel: boolean = false, isLoggedInOrganization: boolean = false) {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    let isMounted = true

    const fetchOrganization = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const org = isLoggedInOrganization
          ? await getLoggedInUserOrganizationInfo()
          : isDemoModel
          ? await getDemoOrganizationInfo()
          : await getOrganizationInfo()

        if (isMounted) {
          setOrganization(org)
        }
      } catch (err) {
        if (isMounted) {
          setError(err)
          setOrganization(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchOrganization()

    return () => {
      isMounted = false
    }
  }, [isDemoModel])

  return { organization, isLoading, error }
}


