import { parseCookie } from "@/lib/utils"
import axios from "axios"

const instance = axios.create()

instance.interceptors.request.use(
  (config) => {
    const assumedUserEmail = parseCookie("AssumedUserEmail")
    if (assumedUserEmail) {
      config.headers["x-assumed-user-email"] = assumedUserEmail.trim()
    }

    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.has("isDemoModel") || searchParams.has("isDemoDataset")) {
      if (!config.params) {
        config.params = {}
      }
      config.params.isDemo = true
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export default instance
