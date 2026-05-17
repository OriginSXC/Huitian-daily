import fs from "node:fs"

const files = fs.readdirSync("./plugins/Huitian-daily/apps").filter(f => f.endsWith(".js"))

let ret = files.map(f => import(`./apps/${f}`))
ret = await Promise.allSettled(ret)

const apps = {}
for (let i = 0; i < files.length; i++) {
  const name = files[i].replace(".js", "")
  if (ret[i].status !== "fulfilled") {
    logger.error(`[Huitian-daily] 载入插件错误：${logger.red(name)}`)
    logger.error(ret[i].reason)
    continue
  }
  apps[name] = ret[i].value[Object.keys(ret[i].value)[0]]
}

logger.info("------------------------")
logger.info("回天日报 (Huitian-daily) v1.0.0 已加载")
logger.info("------------------------")

export { apps }
