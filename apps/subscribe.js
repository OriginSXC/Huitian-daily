import {
  subscribe, unsubscribe, subscribeAll, unsubscribeAll, statusOf, CHANNEL_KEYS,
} from "../model/config.js"

const CN = { report: "回天日报", moyu: "摸鱼日历", bangumi: "今日番剧" }

function canManage(e) {
  if (e.isMaster) return true
  const m = e.member || {}
  return Boolean(m.is_admin || m.is_owner)
}

function parseChannel(msg) {
  const m = msg.match(/^#?日报推送(开启|关闭|状态)(?:\s*(.+))?$/)
  if (!m) return null
  const [, action, rest] = m
  let channel = "all"
  if (rest) {
    const r = rest.trim()
    if (r === "日报" || r === "回天日报") channel = "report"
    else if (r === "摸鱼" || r === "摸鱼日历") channel = "moyu"
    else if (r === "番剧" || r === "今日番剧") channel = "bangumi"
    else channel = r
  }
  return { action, channel }
}

export class HuitianSubscribe extends plugin {
  constructor() {
    super({
      name: "回天日报-推送订阅",
      priority: 500,
      rule: [
        { reg: "^#?日报推送(开启|关闭|状态)(.*)$", fnc: "manage" },
      ],
    })
  }

  async manage(e) {
    if (!e.isGroup) return e.reply("请在群里使用此指令")
    const parsed = parseChannel(e.msg)
    if (!parsed) return false

    if (parsed.action !== "状态" && !canManage(e)) {
      return e.reply("仅群主/管理员/主人可以管理推送")
    }

    const { action, channel } = parsed
    const isAll = channel === "all"
    const channels = isAll ? CHANNEL_KEYS : [channel]
    if (!isAll && !CHANNEL_KEYS.includes(channel)) {
      return e.reply(`未知频道：${channel}\n支持：日报 / 摸鱼 / 番剧；不填 = 全部`)
    }

    if (action === "状态") {
      const s = statusOf(e.group_id)
      const lines = CHANNEL_KEYS.map(c => `${CN[c]}：${s[c] ? "✅ 已开启" : "❌ 未开启"}`)
      return e.reply(`本群推送状态:\n${lines.join("\n")}`)
    }

    const fn = action === "开启" ? subscribe : unsubscribe
    const verb = action === "开启" ? "已加入" : "已移出"
    const changed = []
    const skipped = []
    for (const c of channels) {
      const ok = isAll ? fn(c, e.group_id) : fn(c, e.group_id)
      void ok
      // 二次查询，构造响应
      const after = statusOf(e.group_id)[c]
      const want  = action === "开启"
      if (after === want) changed.push(CN[c])
      else skipped.push(CN[c])
    }

    const target = isAll ? "全部推送" : CN[channel]
    let msg = `本群${verb}${target}推送列表`
    if (skipped.length && skipped.length === channels.length) {
      msg = `本群${target}推送${action === "开启" ? "已在列表中" : "未开启"}`
    }
    return e.reply(msg)
  }
}
