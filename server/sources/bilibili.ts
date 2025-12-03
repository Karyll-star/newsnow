interface WapRes {
  code: number
  exp_str: string
  list: {
    hot_id: number
    keyword: string
    show_name: string
    score: number
    word_type: number
    goto_type: number
    goto_value: string
    icon: string
    live_id: any[]
    call_reason: number
    heat_layer: string
    pos: number
    id: number
    status: string
    name_type: string
    resource_id: number
    set_gray: number
    card_values: any[]
    heat_score: number
    stat_datas: {
      etime: string
      stime: string
      is_commercial: string
    }
  }[]
  top_list: any[]
  hotword_egg_info: string
  seid: string
  timestamp: number
  total_count: number
}

// Interface for Bilibili Hot Video response
interface HotVideoRes {
  code: number
  message: string
  ttl: number
  data: {
    list: {
      aid: number
      videos: number
      tid: number
      tname: string
      copyright: number
      pic: string
      title: string
      pubdate: number
      ctime: number
      desc: string
      state: number
      duration: number
      owner: {
        mid: number
        name: string
        face: string
      }
      stat: {
        view: number
        danmaku: number
        reply: number
        favorite: number
        coin: number
        share: number
        now_rank: number
        his_rank: number
        like: number
        dislike: number
      }
      dynamic: string
      cid: number
      dimension: {
        width: number
        height: number
        rotate: number
      }
      short_link: string
      short_link_v2: string
      bvid: string
      rcmd_reason: {
        content: string
        corner_mark: number
      }
    }[]
  }
}

const hotSearch = defineSource(async () => {
  const url = "https://s.search.bilibili.com/main/hotword?limit=30"
  try {
    const res: WapRes = await myFetch(url, {
      headers: {
        Referer: "https://www.bilibili.com/",
      },
    })

    if (!res) {
      throw new Error("Bilibili hot search response is empty")
    }

    if (res.code !== 0) {
      throw new Error(`Bilibili hot search error code: ${res.code}`)
    }

    if (!res.list) {
      // Sometimes list might be empty or null if no hotwords, but usually there are.
      // Returning empty array is safer than crashing.
      return []
    }

    return res.list.map(k => ({
      id: k.keyword,
      title: k.show_name,
      url: `https://search.bilibili.com/all?keyword=${encodeURIComponent(k.keyword)}`,
      extra: {
        icon: k.icon && proxyPicture(k.icon),
      },
    }))
  } catch (e) {
    console.error("Error in bilibili hotSearch:", e)
    throw e
  }
})

const hotVideo = defineSource(async () => {
  const url = "https://api.bilibili.com/x/web-interface/popular"
  try {
    const res: HotVideoRes = await myFetch(url, {
      headers: {
        Referer: "https://www.bilibili.com/",
      },
    })

    if (!res) throw new Error("Bilibili hot video response is empty")

    if (res.code !== 0) {
      throw new Error(`Bilibili hot video error: ${res.message}`)
    }

    return (res.data?.list || []).map(video => ({
      id: video.bvid,
      title: video.title,
      url: `https://www.bilibili.com/video/${video.bvid}`,
      pubDate: video.pubdate * 1000,
      extra: {
        info: `${video.owner.name} · ${formatNumber(video.stat.view)}观看 · ${formatNumber(video.stat.like)}点赞`,
        hover: video.desc,
        icon: proxyPicture(video.pic),
      },
    }))
  } catch (e) {
    console.error("Error in bilibili hotVideo:", e)
    throw e
  }
})

const ranking = defineSource(async () => {
  const url = "https://api.bilibili.com/x/web-interface/ranking/v2"
  try {
    const res: HotVideoRes = await myFetch(url, {
      headers: {
        Referer: "https://www.bilibili.com/",
      },
    })

    if (!res) throw new Error("Bilibili ranking response is empty")

    if (res.code !== 0) {
      throw new Error(`Bilibili ranking error: ${res.message}`)
    }

    return (res.data?.list || []).map(video => ({
      id: video.bvid,
      title: video.title,
      url: `https://www.bilibili.com/video/${video.bvid}`,
      pubDate: video.pubdate * 1000,
      extra: {
        info: `${video.owner.name} · ${formatNumber(video.stat.view)}观看 · ${formatNumber(video.stat.like)}点赞`,
        hover: video.desc,
        icon: proxyPicture(video.pic),
      },
    }))
  } catch (e) {
    console.error("Error in bilibili ranking:", e)
    throw e
  }
})

function formatNumber(num: number): string {
  if (num >= 10000) {
    return `${Math.floor(num / 10000)}w+`
  }
  return num.toString()
}

export default defineSource({
  "bilibili": hotSearch,
  "bilibili-hot-search": hotSearch,
  "bilibili-hot-video": hotVideo,
  "bilibili-ranking": ranking,
})
