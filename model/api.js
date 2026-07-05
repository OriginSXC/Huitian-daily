import fetch from "node-fetch"
import { OtherApi } from "./constants.js"
import { get as cfg } from "./config.js"

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

// bgm.tv 要求非浏览器客户端用「应用名/版本 (项目主页)」标识 UA，并会封禁浏览器/请求库默认 UA。
// https://github.com/bangumi/api 见 README 的 User-Agent 约定。
const BGM_UA = "OriginSXC/Huitian-daily/1.0.0 (https://github.com/OriginSXC/Huitian-daily)"

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

// AniList 兜底用：airingAt 是绝对秒级时间戳，统一按 CST(UTC+8) 折算“放送在星期几/哪天”
const CST_OFFSET = 8 * 3600
function cstParts(sec) {
  const d = new Date((sec + CST_OFFSET) * 1000)
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), w: d.getUTCDay() }
}
function weekdayMon0(sec) { const w = cstParts(sec).w; return w === 0 ? 6 : w - 1 } // 周一=0..周日=6
function ymdFromSec(sec) { const p = cstParts(sec); return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}` }

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
  /**
   * 抓取远程图片并转成 base64 data URI，失败/超时返回空串。
   * 渲染前用它把外链图内联进模板，避免 Chromium 穿代理实时加载外链图
   * 导致 networkidle 一直不触发、goto 超时（整张日报作废）。
   * 非 http(s) 值原样返回（本地路径/已是 data URI 时不动它）。
   */
  async fetchImageDataURI(url, timeout) {
    if (typeof url !== "string" || !/^https?:\/\//i.test(url)) {
      return typeof url === "string" ? url : ""
    }
    const ctl = new AbortController()
    const timer = setTimeout(() => ctl.abort(), timeout ?? apiCfg().image_timeout_ms ?? 8_000)
    try {
      const res = await fetch(url, {
        signal: ctl.signal,
        headers: { "User-Agent": UA, Referer: "https://www.bilibili.com/" },
      })
      if (!res.ok) return ""
      const ct = (res.headers.get("content-type") || "image/png").split(";")[0].trim()
      const buf = Buffer.from(await res.arrayBuffer())
      return `data:${ct};base64,${buf.toString("base64")}`
    } catch {
      return ""
    } finally {
      clearTimeout(timer)
    }
  },
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
  /** Bangumi 番剧日程（bgm.tv 用合规应用 UA，浏览器 UA 会被禁；今日 502 是其源站故障非 UA 问题） */
  async getAnime() {
    return getJson(OtherApi.anime, { headers: { "User-Agent": BGM_UA } })
  },

  /**
   * AniList 番剧兜底：拉本周放送，整形成与 bgm calendar 同构的 7 元素数组（周一=0..周日=6），
   * 每个元素 { items: [{ name_cn, name, images, rating, collection, air_date }] }，
   * 让下游 shapeAnimeItem / 日报动漫模块无需改动即可复用。
   * bgm 不同的是：AniList 无“在看人数”，评分为 0-100（这里折算 0-10），中文名仅国产番有（日番为日文原名）。
   */
  async getAnimeAniList() {
    const query = `query ($page:Int,$start:Int,$end:Int){
      Page(page:$page, perPage:50){
        pageInfo{ hasNextPage }
        airingSchedules(airingAt_greater:$start, airingAt_lesser:$end, sort:TIME){
          airingAt
          media{ title{ native romaji english } coverImage{ large medium } averageScore format }
        }
      }
    }`
    const nowSec = Math.floor(Date.now() / 1000)
    // 以 CST 今天 00:00 为起点，覆盖未来 7 天（含今天）
    const start = Math.floor((nowSec + CST_OFFSET) / 86400) * 86400 - CST_OFFSET
    const end = start + 7 * 86400
    const week = Array.from({ length: 7 }, () => ({ items: [] }))
    const seen = new Set()
    for (let page = 1; page <= 6; page++) {
      const j = await getJson(OtherApi.anilist, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": BGM_UA },
        body: JSON.stringify({ query, variables: { page, start, end } }),
      })
      const arr = j?.data?.Page?.airingSchedules || []
      for (const a of arr) {
        const m = a.media || {}
        if (m.format === "MUSIC") continue
        const name = m.title?.native || m.title?.romaji || m.title?.english || ""
        if (!name) continue
        const wd = weekdayMon0(a.airingAt)
        const key = `${wd}|${name}`
        if (seen.has(key)) continue // 同一番同一天去重（补番/多集）
        seen.add(key)
        week[wd].items.push({
          name_cn: null,
          name,
          images: { common: m.coverImage?.large || m.coverImage?.medium || "" },
          rating: { score: m.averageScore ? m.averageScore / 10 : null, total: null },
          collection: { doing: null },
          air_date: ymdFromSec(a.airingAt),
        })
      }
      if (!j?.data?.Page?.pageInfo?.hasNextPage) break
    }
    return week
  },

  /**
   * 番剧日程（带兜底）：bgm 官方 → AniList → null。
   * @returns { schedule: 7元素数组|null, source: "bgm"|"anilist"|null }
   */
  async getAnimeSchedule() {
    try {
      const v = await this.getAnime()
      if (Array.isArray(v) && v.length) return { schedule: v, source: "bgm" }
      logger.warn("[Huitian-daily] bgm 番剧返回空，转 AniList 兜底")
    } catch (e) {
      logger.warn(`[Huitian-daily] bgm 番剧失败(${e.message})，转 AniList 兜底`)
    }
    try {
      const v = await this.getAnimeAniList()
      if (Array.isArray(v) && v.some(d => d.items.length)) return { schedule: v, source: "anilist" }
      logger.warn("[Huitian-daily] AniList 兜底返回空")
    } catch (e) {
      logger.warn(`[Huitian-daily] AniList 兜底也失败: ${e.message}`)
    }
    return { schedule: null, source: null }
  },
}
