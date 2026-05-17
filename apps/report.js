import { getReportImage, get60sImage } from "../model/dataSource.js"
import { get as cfg } from "../model/config.js"

export class HuitianReport extends plugin {
  constructor() {
    super({
      name: "回天日报",
      priority: 500,
      rule: [
        { reg: "^#?回天日报$", fnc: "report" },
        { reg: "^#?60s早报$",  fnc: "today60s" },
      ],
    })
  }

  async report(e) {
    if (cfg("command").require_at_bot_in_group && e.isGroup && !e.atBot) return false
    try {
      const img = await getReportImage()
      if (!img) return e.reply("生成日报失败 QAQ")
      await e.reply(img)
    } catch (err) {
      logger.error(`[Huitian-daily] report 失败: ${err.stack || err.message}`)
      await e.reply("wuwuwu~出了点问题")
    }
    return true
  }

  async today60s(e) {
    try {
      const img = await get60sImage()
      await e.reply(img)
    } catch (err) {
      logger.error(`[Huitian-daily] 60s 失败: ${err.stack || err.message}`)
      await e.reply("60秒读世界获取失败 QAQ")
    }
    return true
  }
}
