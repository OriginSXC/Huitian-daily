import { getOilImage } from "../model/dataSource.js"

export class HuitianOil extends plugin {
  constructor() {
    super({
      name: "回天日报-油价",
      priority: 500,
      rule: [{ reg: "^#?(.*)今日油价$", fnc: "oil" }],
    })
  }

  async oil(e) {
    const m = e.msg?.match(/^#?(.*)今日油价$/)
    const region = m?.[1]?.trim() || undefined
    try {
      const img = await getOilImage(region)
      await e.reply(img)
    } catch (err) {
      logger.error(`[Huitian-daily] oil: ${err.stack || err.message}`)
      await e.reply("获取油价信息失败 QAQ")
    }
    return true
  }
}
