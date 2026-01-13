"use client"
import { Organization } from "@/types"
import axios from "./axios-interceptor"

export async function getOrganizationInfo(
  updateCache: boolean = false
): Promise<Organization> {
  return {
    apiKey: process.env.SHAPED_API_KEY ?? ''
  }
}

export async function getLoggedInUserOrganizationInfo(): Promise<Organization> {
  let organization: any = sessionStorage.getItem("LoggedInOrganizationInfo")
  if (!organization) {
    let resp = await axios.get(`/api/organization/logged-in-user`)

    organization = resp.data.data
    sessionStorage.setItem(
      "LoggedInOrganizationInfo",
      JSON.stringify(organization)
    )
  } else organization = JSON.parse(organization)

  return organization
}

export async function getDemoOrganizationInfo(): Promise<Organization> {
  let organization: any = sessionStorage.getItem("DemoOrganizationInfo")
  if (!organization) {
    let resp = await axios.get(`/api/organization/demo`)

    organization = resp.data.data
    sessionStorage.setItem("DemoOrganizationInfo", JSON.stringify(organization))
  } else organization = JSON.parse(organization)

  return organization
}
