import { getEpicImage } from "../model/dataSource.js"

export class HuitianEpic extends plugin {
  constructor() {
    super({
      name: "回天日报-Epic",
      priority: 500,
      rule: [{ reg: "^#?epic免费游戏$", fnc: "epic" }],
    })
  }

  async epic(e) {
    try {
      await e.reply(await getEpicImage())
    } catch (err) {
      logger.error(`[Huitian-daily] epic: ${err.stack || err.message}`)
      await e.reply("Epic 免费游戏获取失败 QAQ")
    }
    return true
  }
}
