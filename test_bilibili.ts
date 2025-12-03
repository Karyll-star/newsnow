import process from "node:process"
import { $fetch } from "ofetch"
import { ProxyAgent } from "undici"

const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY
const dispatcher = proxy ? new ProxyAgent(proxy) : undefined

const myFetch = $fetch.create({
  headers: {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  },
  timeout: 10000,
  retry: 3,
  dispatcher,
})

async function testHotSearch() {
  console.log("Testing Hot Search...")
  const url = "https://s.search.bilibili.com/main/hotword?limit=30"
  try {
    const res: any = await myFetch(url)
    console.log("Hot Search Response Code:", res.code)
    if (res.list && res.list.length > 0) {
      console.log("Hot Search First Item:", res.list[0].show_name)
    } else {
      console.log("Hot Search Empty List or Unexpected Structure", JSON.stringify(res, null, 2))
    }
  } catch (e) {
    console.error("Hot Search Error:", e)
  }
}

async function testHotVideo() {
  console.log("Testing Hot Video...")
  const url = "https://api.bilibili.com/x/web-interface/popular"
  try {
    const res: any = await myFetch(url)
    console.log("Hot Video Response Code:", res.code)
    if (res.data && res.data.list && res.data.list.length > 0) {
      console.log("Hot Video First Item:", res.data.list[0].title)
    } else {
      console.log("Hot Video Empty List or Unexpected Structure")
    }
  } catch (e) {
    console.error("Hot Video Error:", e)
  }
}

async function testRanking() {
  console.log("Testing Ranking...")
  // Try to get cookie first
  let cookie = ""
  try {
    const homeRes = await $fetch.raw("https://www.bilibili.com/", {
      dispatcher,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      },
    })
    const setCookie = homeRes.headers.getSetCookie()
    if (setCookie) {
      cookie = setCookie.join("; ")
      console.log("Got Cookie:", `${cookie.substring(0, 50)}...`)
    }
  } catch (e) {
    console.error("Failed to get cookie:", e)
  }

  const url = "https://api.bilibili.com/x/web-interface/ranking/v2"
  try {
    const res: any = await myFetch(url, {
      headers: {
        Cookie: cookie,
      },
    })
    console.log("Ranking Response Code:", res.code)
    if (res.data && res.data.list && res.data.list.length > 0) {
      console.log("Ranking First Item:", res.data.list[0].title)
    } else {
      console.log("Ranking Empty List or Unexpected Structure")
    }
  } catch (e) {
    console.error("Ranking Error:", e)
  }
}

async function run() {
  await testHotSearch()
  await testHotVideo()
  await testRanking()
}

run()
