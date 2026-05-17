import { getHistoryImage } from "../model/dataSource.js"

export class HuitianHistory extends plugin {
  constructor() {
    super({
      name: "回天日报-历史上的今天",
      priority: 500,
      rule: [{ reg: "^#?历史上的今天$", fnc: "history" }],
    })
  }

  async history(e) {
    try {
      await e.reply(await getHistoryImage())
    } catch (err) {
      logger.error(`[Huitian-daily] history: ${err.stack || err.message}`)
      await e.reply("历史上的今天获取失败 QAQ")
    }
    return true
  }
}
