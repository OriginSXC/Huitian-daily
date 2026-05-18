import { getReportImage, getMoyuImage, getTodayBangumi } from "../model/dataSource.js"
import { get as cfg } from "../model/config.js"
import { clearCache } from "../model/render.js"

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function broadcast(payload, groups, tag) {
  if (!payload || !groups?.length) return
  for (const gid of groups) {
    try {
      await Bot.pickGroup(Number(gid) || gid).sendMsg(payload)
      logger.info(`[Huitian-daily] ${tag} -> ${gid} OK`)
      await sleep(800)
    } catch (err) {
      logger.error(`[Huitian-daily] ${tag} -> ${gid} 失败: ${err.message}`)
    }
  }
}

export class HuitianPush extends plugin {
  constructor() {
    super({
      name: "回天日报-定时推送",
      priority: 500,
      rule: [],
    })
    this.task = this.#makeTasks()
  }

  // 读取定时配置；如果用户没启用就不注册 cron
  // 注意：fnc 必须是函数而不是方法名字符串，Yunzai 的 loader 会直接调用 i.fnc()
  #makeTasks() {
    const tasks = []
    const report = cfg("report")
    if (report.isAutoPush !== false && report.cron) {
      tasks.push({ cron: report.cron, name: "回天日报-日报推送",     fnc: () => this.dailyReport() })
    }
    const moyu = cfg("moyu")
    if (moyu.isAutoPush !== false && moyu.cron) {
      tasks.push({ cron: moyu.cron,   name: "回天日报-摸鱼日历推送", fnc: () => this.dailyMoyu() })
    }
    const bgm = cfg("bangumi")
    if (bgm.isAutoPush !== false && bgm.cron) {
      tasks.push({ cron: bgm.cron,    name: "回天日报-今日番剧推送", fnc: () => this.dailyBangumi() })
    }
    const cleanup = cfg("cleanup")
    if (cleanup.enable !== false && cleanup.cron) {
      tasks.push({ cron: cleanup.cron, name: "回天日报-定期清缓存",  fnc: () => this.scheduledClean() })
    }
    return tasks
  }

  async dailyReport() {
    try {
      const c = cfg("report")
      if (c.jitter > 0) await sleep(Math.random() * c.jitter * 1000)
      const img = await getReportImage()
      await broadcast(img, c.groupList || [], "回天日报")
    } catch (err) { logger.error(`[Huitian-daily] dailyReport: ${err.message}`) }
  }

  async dailyMoyu() {
    try {
      const c = cfg("moyu")
      if (c.jitter > 0) await sleep(Math.random() * c.jitter * 1000)
      const img = await getMoyuImage()
      await broadcast(img, c.groupList || [], "摸鱼日历")
    } catch (err) { logger.error(`[Huitian-daily] dailyMoyu: ${err.message}`) }
  }

  async dailyBangumi() {
    try {
      const c = cfg("bangumi")
      if (c.jitter > 0) await sleep(Math.random() * c.jitter * 1000)
      const img = await getTodayBangumi()
      await broadcast(img, c.groupList || [], "今日番剧")
    } catch (err) { logger.error(`[Huitian-daily] dailyBangumi: ${err.message}`) }
  }

  async scheduledClean() {
    const c = cfg("cleanup")
    const targets = c.targets || ["bangumi", "epic"]
    const stats = {}
    for (const t of targets) stats[t] = clearCache(t)
    logger.info(`[Huitian-daily] 清缓存: ${JSON.stringify(stats)}`)
  }
}
