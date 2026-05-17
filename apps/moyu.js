import { getMoyuImage } from "../model/dataSource.js"

export class HuitianMoyu extends plugin {
  constructor() {
    super({
      name: "回天日报-摸鱼日历",
      priority: 500,
      rule: [{ reg: "^#?摸鱼日历$", fnc: "moyu" }],
    })
  }

  async moyu(e) {
    try {
      await e.reply(await getMoyuImage())
    } catch (err) {
      logger.error(`[Huitian-daily] moyu: ${err.stack || err.message}`)
      await e.reply("摸鱼日历生成失败 QAQ")
    }
    return true
  }
}
