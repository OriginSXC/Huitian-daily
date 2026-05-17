import path from "node:path"
import { render } from "../model/render.js"

const PLUGIN_ROOT = path.resolve("./plugins/Huitian-daily")
const PAIMON_URL = `file://${path.join(PLUGIN_ROOT, "resources/huitian_daily/res/image/paimon.jpg")}`

const SECTIONS = [
  {
    title: "📷 图文生成",
    color: "#5b6ec9",
    items: [
      { cmd: "回天日报",        desc: "今日完整日报：摸鱼/B站/新番/60s/IT/一言（首次较慢，缓存到当日）" },
      { cmd: "60s早报",         desc: "直接转发官方早报海报" },
      { cmd: "今日番剧",        desc: "Bangumi 当日放送列表" },
      { cmd: "每日番剧 / 本周番剧 / 每周番剧", desc: "一周番剧总览（4×7 网格）" },
      { cmd: "摸鱼日历",        desc: "今日摸鱼指数海报" },
      { cmd: "历史上的今天",    desc: "时间线 + 卡片：出生/事件/逝世" },
      { cmd: "epic免费游戏",    desc: "Epic 当前及即将到来的免费游戏" },
      { cmd: "<地区>今日油价",  desc: "如「上海今日油价」；不带地区给主要省市" },
    ],
  },
  {
    title: "💬 文本指令",
    color: "#10b981",
    items: [
      { cmd: "每日一言",        desc: "随机一条 hitokoto" },
      { cmd: "日报帮助",        desc: "查看本帮助" },
    ],
  },
  {
    title: "🔔 推送订阅（群主/管理员/主人）",
    color: "#f59e0b",
    items: [
      { cmd: "日报推送开启",          desc: "本群订阅全部三类自动推送" },
      { cmd: "日报推送开启 日报/摸鱼/番剧", desc: "只订阅指定单项" },
      { cmd: "日报推送关闭 [日报|摸鱼|番剧]", desc: "退订；不带参数 = 退订全部" },
      { cmd: "日报推送状态",          desc: "查看本群三项订阅状态" },
    ],
  },
]

const SCHEDULE = [
  "08:40（±50s）回天日报",
  "10:00（±50s）摸鱼日历",
  "00:05 今日番剧",
  "03:00（周日）清理 bangumi / epic 缓存",
]

export class HuitianHelp extends plugin {
  constructor() {
    super({
      name: "回天日报-帮助",
      priority: 500,
      rule: [{ reg: "^#?日报帮助$", fnc: "help" }],
    })
  }

  async help(e) {
    try {
      const img = await render("help", {
        version: "1.0.0",
        author: "回天一梦",
        paimon_src: PAIMON_URL,
        sections: SECTIONS,
        schedule_lines: SCHEDULE,
      })
      if (img) { await e.reply(img); return true }
    } catch (err) {
      logger.warn(`[Huitian-daily] help 图片渲染失败，回退文字: ${err.message}`)
    }
    // fallback：纯文本
    const lines = ["🗞️ 回天日报 指令清单（# 前缀可选）"]
    for (const s of SECTIONS) {
      lines.push("", s.title)
      for (const it of s.items) lines.push(`· ${it.cmd}  —  ${it.desc}`)
    }
    lines.push("", "定时任务：", ...SCHEDULE.map(s => "· " + s))
    await e.reply(lines.join("\n"))
    return true
  }
}
