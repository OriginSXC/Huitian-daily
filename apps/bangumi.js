import { getTodayBangumi, getWeekBangumi } from "../model/dataSource.js"

export class HuitianBangumi extends plugin {
  constructor() {
    super({
      name: "回天日报-番剧",
      priority: 500,
      rule: [
        { reg: "^#?今日番剧$", fnc: "today" },
        { reg: "^#?(每日|本周|每周)番剧$", fnc: "week" },
      ],
    })
  }

  async today(e) {
    try {
      await e.reply(await getTodayBangumi())
    } catch (err) {
      logger.error(`[Huitian-daily] today bangumi: ${err.stack || err.message}`)
      await e.reply("番剧获取失败 QAQ")
    }
    return true
  }

  async week(e) {
    try {
      await e.reply(await getWeekBangumi())
    } catch (err) {
      logger.error(`[Huitian-daily] week bangumi: ${err.stack || err.message}`)
      await e.reply("番剧获取失败 QAQ")
    }
    return true
  }
}
