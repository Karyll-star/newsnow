import process from "node:process"
import { $fetch } from "ofetch"
import { ProxyAgent } from "undici"

const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY
const dispatcher = proxy ? new ProxyAgent(proxy) : undefined

export const myFetch = $fetch.create({
  headers: {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  },
  timeout: 10000,
  retry: 3,
  dispatcher,
})
