import { NextRequest, NextResponse } from "next/server"
import axios from "axios"
import { getApiBaseUrl } from "@/lib/utils"

const SHAPED_API_KEY = process.env.SHAPED_API_KEY ?? ""

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { engine, query, language, parameters } = body ?? {}
    const headers = {
      "x-api-key": SHAPED_API_KEY,
      "Content-Type": "application/json",
    }

    let resp: any = null
    console.log("inside execute query", engine, query, language, parameters)

    // Build request body with parameters if provided
    const requestBody: any = {
      query,
      parameters,
      return_metadata: true,
      return_explanation: true,
    }

    resp = await axios.post(
      `${getApiBaseUrl()}/engines/${engine}/query`,
      requestBody,
      { headers: headers }
    )

    return NextResponse.json(resp.data, { status: resp.status })
  } catch (error: any) {
    // If axios error, return the error response
    if (error.response) {
      return NextResponse.json(error.response.data, {
        status: error.response.status,
      })
    }
    // Otherwise, return a generic error
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
