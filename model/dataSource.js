import fs from "node:fs"
import { api } from "./api.js"
import { render, cachePath } from "./render.js"
import { get as cfg } from "./config.js"
import {
  WeekDay, MoyuData, getZodiac, numToCn,
  MAIN_CHINA_CITIES, HistoryEventType,
} from "./constants.js"

const FAIL = {
  hitokoto: "如果不能忠于自己的心，胜负又有什么价值呢？ ---【塔希里亚故事集】",
  fest:     [["获取节日信息失败 QAQ", 0]],
  bili:     [["获取B站热点失败 QAQ", null]],
  six:      ["获取60秒读世界失败 QAQ"],
  it:       ["获取IT资讯失败 QAQ"],
  anime:    [["获取动漫资讯失败 QAQ", null]],
}

function fmtDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function safe(promise) {
  return promise.then(v => ({ ok: true, v })).catch(e => ({ ok: false, e }))
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

/**
 * 拉取并整形单个模块；拿不到可用数据时按配置重试（兜底）。
 * @param label  日志名称
 * @param fn     async，返回"整形后可用值"或 null（视为不可用，触发重试）
 * @param retry  额外重试次数
 * @param delay  每次重试前的等待毫秒
 * @returns 可用值，或全部失败后返回 null
 */
async function fetchModule(label, fn, retry = 0, delay = 0) {
  for (let i = 0; i <= retry; i++) {
    try {
      const v = await fn()
      if (v != null) return v
      logger.warn(`[Huitian-daily] ${label} 返回空数据${i < retry ? "，稍后重试" : ""}`)
    } catch (e) {
      logger.warn(`[Huitian-daily] ${label} 拉取失败: ${e.message}${i < retry ? "，稍后重试" : ""}`)
    }
    if (i < retry) await sleep(delay)
  }
  return null
}

function pickHitokotoText(j) {
  if (!j) return null
  const who = j.from_who || ""
  const src = j.from ? `【${j.from}】` : ""
  return `${j.hitokoto} ---${who}${src}`
}

/* ---------------- 单功能图 ---------------- */

export async function getHitokotoText() {
  try {
    const j = await api.getHitokoto()
    return pickHitokotoText(j) || FAIL.hitokoto
  } catch (e) {
    logger.warn(`[Huitian-daily] getHitokoto: ${e.message}`)
    return FAIL.hitokoto
  }
}

export async function get60sImage() {
  const j = await api.get60s()
  const url = j?.data?.image
  if (!url) throw new Error("60s API 返回缺少 image 字段")
  return segment.image(url)
}

export async function getMoyuImage() {
  const now = new Date()
  const file = cachePath("moyu", now)
  const fishIndex = Math.floor(Math.random() * 100) + 1
  const ctx = {
    top_gif_url: MoyuData.topGifUrl,
    year_month_text: `${now.getFullYear()}年${now.getMonth() + 1}月`,
    week_text: `星期${WeekDay.nameCn(jsWeekday(now))}`,
    day_num: now.getDate(),
    is_weekend: jsWeekday(now) >= 5,
    weekend_num: Math.max(0, 5 - jsWeekday(now)),
    greeting_text:
      `${MoyuData.greeting(now.getHours())}，摸鱼人！工作再忙一定不要忘记休息哦！起身去茶水间，去厕所走走，钱是老板的但命是自己的，祝愿摸鱼人愉快的渡过每一天...\``,
    fortune_text: MoyuData.randomFortune(),
    fish_index: fishIndex,
    fish_level_text: MoyuData.moyuLevel(fishIndex),
    zodiac: getZodiac(now.getMonth() + 1, now.getDate()),
    zodiac_quote: MoyuData.randomZodiacQuote(),
    fish_img_url: MoyuData.randomFishImg(),
    salary_lines: MoyuData.salaryLines(now),
    footer_quote: await getHitokotoText(),
  }
  return render("moyu", ctx, {
    cacheFile: file,
    pageGotoParams: { waitUntil: "networkidle2", timeout: 30000 },
  })
}

export async function getHistoryImage() {
  const today = new Date()
  const file = cachePath("history", today)
  const data = await api.getTodayInHistory()
  if (!data?.items) throw new Error("today-in-history 返回缺少 items")
  const items = [...data.items].sort((a, b) => {
    const ay = /^\d+$/.test(a.year) ? Number(a.year) : 0
    const by = /^\d+$/.test(b.year) ? Number(b.year) : 0
    return ay - by
  }).map(it => {
    const t = HistoryEventType[it.event_type] || HistoryEventType.event
    return { ...it, _label: t.label, _color: t.color, _emoji: t.emoji }
  })
  const ctx = {
    month: String(data.month).padStart(2, "0"),
    day: String(data.day).padStart(2, "0"),
    weekday_cn: WeekDay.nameCn(jsWeekday(today)),
    items,
  }
  return render("history", ctx, { cacheFile: file })
}

export async function getEpicImage() {
  const today = new Date()
  const file = cachePath("epic", today)
  const j = await api.getEpicFree()
  const games = j?.data || []
  if (!games.length) throw new Error("epic API 返回空")
  const ctx = {
    games: games.map(g => ({
      ...g,
      _desc_lines: (g.description || "").split(/\r?\n/).slice(0, 6),
    })),
    today: fmtDate(today),
  }
  return render("epic", ctx, { cacheFile: file })
}

export async function getOilImage(region) {
  const list = region ? [region] : MAIN_CHINA_CITIES
  const results = await Promise.all(list.map(c => safe(api.getFuelPrice(c))))
  const ok = results.filter(r => r.ok && r.v).map(r => r.v)
  if (!ok.length) return "获取油价信息失败 QAQ"

  const trend = ok[0].trend
  let tip = "暂无趋势数据"
  if (trend) {
    tip = trend.description
    tip += trend.direction === "上调"
      ? "，大家相互转告油价又涨了。"
      : "，大家赶紧加满油。"
  }

  const columnsSet = new Set()
  const rows = ok.map(d => {
    const row = { 地区: d.region }
    for (const item of d.items || []) {
      row[item.name] = String(item.price)
      columnsSet.add(item.name)
    }
    return row
  })
  const columns = ["地区", ...Array.from(columnsSet)]
  return render("oil", { columns, rows, tip, updated: ok[0].updated || "" })
}

/* ---------------- 番剧 ---------------- */

function jsWeekday(d) { /* Mon=0 .. Sun=6, 对齐 Python */
  const w = d.getDay()
  return w === 0 ? 6 : w - 1
}

function chooseAnimeImage(it) {
  const im = it.images
  if (!im) return ""
  return im.common || im.grid || im.small || im.medium || im.large || ""
}

function shapeAnimeItem(it) {
  return {
    name: it.name_cn || it.name || "",
    image: chooseAnimeImage(it),
    score: it.rating?.score ? Number(it.rating.score).toFixed(1) : null,
    total: it.rating?.total ?? null,
    doing: it.collection?.doing ?? null,
    airDate: it.air_date || "",
  }
}

function shapeWeekday(day, idx, todayIdx) {
  return {
    weekdayCn: WeekDay.nameCn(idx),
    color: WeekDay.color(idx),
    isToday: idx === todayIdx,
    items: (day.items || []).map(shapeAnimeItem),
  }
}

export async function getTodayBangumi() {
  const schedule = await api.getAnime()
  const todayIdx = jsWeekday(new Date())
  const day = schedule[todayIdx]
  if (!day) throw new Error("bgm.tv 返回数据格式异常")
  const saying = await getHitokotoText()
  return render("bangumi", {
    mode: "today",
    saying,
    today: fmtDate(),
    days: [shapeWeekday(day, todayIdx, todayIdx)],
  })
}

export async function getWeekBangumi() {
  const schedule = await api.getAnime()
  const todayIdx = jsWeekday(new Date())
  // schedule 是按周一→周日返回 7 条；保持源顺序
  const days = schedule.map((d, i) => shapeWeekday(d, i, todayIdx))
  const saying = await getHitokotoText()
  return render("bangumi", {
    mode: "week",
    saying,
    today: fmtDate(),
    days,
  })
}

/* ---------------- 主日报 ---------------- */

export async function getReportImage({ useCache = true, status } = {}) {
  const now = new Date()
  const file = cachePath("huitian_daily", now)

  // 命中当天完整缓存（只有全部模块成功才会写盘）直接返回，省去重复拉取
  if (useCache && fs.existsSync(file)) {
    if (status) status.missing = []
    return segment.image(fs.readFileSync(file))
  }

  // 兜底重试参数：拉不到/拉空时对单模块重试
  const rc = cfg("report")
  const retry = rc.fetch_retry ?? 2
  const delay = rc.fetch_retry_delay_ms ?? 3000

  // 摸鱼 API 在源代码里是同步等待的（不走 allSettled）；这里保持一致优先尝试
  let currentHoliday = ""
  let nextHoliday = []
  let dataFestival = null
  let monthCn = `${numToCn(now.getMonth() + 1)}月`
  let dayCn   = `${numToCn(now.getDate())}日`

  const moyuD = await fetchModule("摸鱼日历", async () => {
    const moyu = await api.getMoyu()
    return moyu?.data ?? null
  }, retry, delay)

  if (moyuD) {
    const d = moyuD
    monthCn = d.date.lunar.monthCN
    dayCn   = d.date.lunar.dayCN
    if (d.currentHoliday) {
      currentHoliday = `【${d.currentHoliday.name}】假期进行中`
    } else if (d.today.isWorkday) {
      currentHoliday = d.today.isWeekend
        ? "悲报: 今天周末要调休上班，但也要坚持摸鱼"
        : "工作日：低调摸鱼，注意老板"
    } else if (d.today.isWeekend) {
      currentHoliday = "太好了！今天是周末，可以愉快摸鱼！"
    } else if (d.today.isHoliday) {
      currentHoliday = `节假日：${d.today.holidayName}，尽情摸鱼吧！`
    }
    dataFestival = [
      ["周末", d.countdown.toWeekEnd],
      ["周五", d.countdown.toFriday],
      [d.nextHoliday.name, d.nextHoliday.until],
    ]
    nextHoliday = [
      `下个带薪摸鱼日【${d.nextHoliday.name}】`,
      `开始时间：${d.nextHoliday.date}`,
      `可摸时长：${d.nextHoliday.duration}天`,
      `是否调休：${
        d.nextHoliday.workdays?.length ? d.nextHoliday.workdays.join("，") : "无需调休，爽"
      }`,
    ]
  }
  const moyuOk = !!moyuD

  // 各模块并发拉取，单模块失败/拉空自动重试（兜底核心）
  const [hitokoto, biliShaped, sixShaped, itShaped, animeShaped] = await Promise.all([
    fetchModule("一言", async () => pickHitokotoText(await api.getHitokoto()), retry, delay),
    fetchModule("B站热点", async () => {
      const v = await api.getBili()
      return Array.isArray(v?.list) ? v.list.slice(0, 11).map(i => [i.show_name, i.icon]) : null
    }, retry, delay),
    fetchModule("60秒读世界", async () => {
      const v = await api.get60s()
      const news = v?.data?.news || []
      return news.length ? news.slice(0, 11) : null
    }, retry, delay),
    fetchModule("IT资讯", async () => {
      const v = await api.getIT()
      return v?.length ? v : null
    }, retry, delay),
    fetchModule("动漫资讯", async () => {
      const v = await api.getAnime()
      if (!Array.isArray(v)) return null
      const day = v[jsWeekday(now)]
      if (!day?.items?.length) return null
      return day.items.slice(0, 8).map(d => [d.name_cn || d.name, chooseAnimeImage(d)])
    }, retry, delay),
  ])

  // 检测缺失模块，供推送层决定是否整体重生成
  const missing = []
  if (!moyuOk)      missing.push("摸鱼日历")
  if (!hitokoto)    missing.push("一言")
  if (!biliShaped)  missing.push("B站热点")
  if (!sixShaped)   missing.push("60秒读世界")
  if (!itShaped)    missing.push("IT资讯")
  if (!animeShaped) missing.push("动漫资讯")
  if (status) status.missing = missing

  const ctx = {
    data: {
      current_holiday: currentHoliday,
      next_holiday: nextHoliday,
      data_festival: dataFestival || FAIL.fest,
      data_hitokoto: hitokoto || FAIL.hitokoto,
      data_bili:    biliShaped  || FAIL.bili,
      data_six:     sixShaped   || FAIL.six,
      data_anime:   animeShaped || FAIL.anime,
      data_it:      itShaped    || FAIL.it,
      week: WeekDay.nameCn(jsWeekday(now)),
      date: fmtDate(now),
      zh_date: `${monthCn}${dayCn}`,
      full_show: true,
    },
  }

  const allOk = missing.length === 0
  return render("huitian_daily", ctx, {
    cacheFile: useCache && allOk ? file : undefined,
    pageGotoParams: { waitUntil: "networkidle2", timeout: 30000 },
  })
}
