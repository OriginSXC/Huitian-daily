import { getHitokotoText } from "../model/dataSource.js"

export class HuitianHitokoto extends plugin {
  constructor() {
    super({
      name: "回天日报-一言",
      priority: 500,
      rule: [{ reg: "^#?每日一言$", fnc: "hitokoto" }],
    })
  }

  async hitokoto(e) {
    await e.reply(await getHitokotoText())
    return true
  }
}
