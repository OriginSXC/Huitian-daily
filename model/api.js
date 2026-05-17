import fetch from "node-fetch"
import { OtherApi } from "./constants.js"
import { get as cfg } from "./config.js"

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

function apiCfg() { return cfg("api") }

/** 按用户配置的 six_base 覆盖默认端点；缺省回退到内置 60s.viki.moe */
function SixAPI() {
  const base = (apiCfg().six_base || "https://60s.viki.moe").replace(/\/+$/, "")
  return {
    today60s:     `${base}/v2/60s`,
    moyu:         `${base}/v2/moyu`,
    fuelPrice:    `${base}/v2/fuel-price`,
    epic:         `${base}/v2/epic`,
    todayHistory: `${base}/v2/today-in-history`,
    bili:         `${base}/v2/bili`,
  }
}

async function getJson(url, opts = {}) {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), opts.timeout ?? apiCfg().timeout_ms ?? 15_000)
  try {
    const res = await fetch(url, { ...opts, signal: ctl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

async function getText(url, opts = {}) {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), opts.timeout ?? apiCfg().timeout_ms ?? 15_000)
  try {
    const res = await fetch(url, { ...opts, signal: ctl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
    return await res.text()
  } finally {
    clearTimeout(timer)
  }
}

export const api = {
  /** 60s 读世界 */
  async get60s()         { return getJson(SixAPI().today60s) },
  /** 摸鱼日历元数据（节假日/进度等） */
  async getMoyu()        { return getJson(SixAPI().moyu) },
  /** 油价 */
  async getFuelPrice(region = "昆山") {
    const u = `${SixAPI().fuelPrice}?region=${encodeURIComponent(region)}`
    const json = await getJson(u)
    return json?.data
  },
  /** Epic 免费游戏 */
  async getEpicFree()    { return getJson(SixAPI().epic) },
  /** 历史上的今天 */
  async getTodayInHistory() {
    const j = await getJson(SixAPI().todayHistory)
    return j?.data
  },
  /** 一言 */
  async getHitokoto()    { return getJson(OtherApi.hitokoto) },
  /** B 站热搜（直连官方接口，需 UA/Referer/Origin） */
  async getBili() {
    return getJson(OtherApi.biliHot, {
      headers: {
        "User-Agent": UA,
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "zh-CN,zh;q=0.9",
        Referer: "https://www.bilibili.com/",
        Origin: "https://www.bilibili.com",
      },
    })
  },
  /** IT 之家 RSS：返回前 11 条标题 */
  async getIT() {
    const xml = await getText(OtherApi.it)
    let titles = []
    try {
      const { load } = await import("cheerio")
      const $ = load(xml, { xmlMode: true })
      $("channel > item > title").each((_, el) => {
        const t = $(el).text().trim()
        if (t) titles.push(t)
      })
    } catch {
      const re = /<item>[\s\S]*?<title>([\s\S]*?)<\/title>/g
      let m
      while ((m = re.exec(xml))) {
        let t = m[1].trim()
        t = t.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "")
        if (t) titles.push(t)
      }
    }
    return titles.slice(0, 11)
  },
  /** Bangumi 番剧日程 */
  async getAnime() {
    return getJson(OtherApi.anime, { headers: { "User-Agent": UA } })
  },
}
