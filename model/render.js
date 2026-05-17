import fs from "node:fs"
import path from "node:path"
import puppeteer from "../../../lib/puppeteer/puppeteer.js"

const PLUGIN_ROOT = path.resolve("./plugins/Huitian-daily")
const RES = path.join(PLUGIN_ROOT, "resources")

/**
 * 渲染一个模板成图片消息段（可选缓存到磁盘）
 * @param name      模板名（对应 resources/<name>/main.html）
 * @param data      模板上下文，会与 puppeteer 透传参数一起传给 art-template
 * @param opts.cacheFile  绝对路径；存在则命中返回，缺失则渲染后写盘
 * @param opts.* 其余字段透传给 puppeteer.screenshot（pageGotoParams 等）
 * @returns segment.image(...) 直接 reply 即可；失败返回 false
 */
export async function render(name, data = {}, opts = {}) {
  const { cacheFile, ...passthrough } = opts

  if (cacheFile && fs.existsSync(cacheFile)) {
    return segment.image(fs.readFileSync(cacheFile))
  }

  const tplFile = path.join(RES, name, "main.html")
  // 临时 HTML 写到 ./temp/html/，所以模板里的相对路径需要靠 <base> 回指到源目录
  const _base = `file://${path.join(RES, name)}/`
  // Yunzai 的 Renderer.dealTpl 用 name 同时拼父目录和 saveId，所以 name 里不能含 /
  const seg = await puppeteer.screenshot(`huitian-daily-${name}`, {
    tplFile,
    _base,
    ...data,
    ...passthrough,
  })

  if (cacheFile && seg && seg.file) {
    try {
      const file = seg.file
      const buf = Buffer.isBuffer(file)
        ? file
        : typeof file === "string"
        ? Buffer.from(file.replace(/^base64:\/\//, ""), "base64")
        : null
      if (buf) {
        fs.mkdirSync(path.dirname(cacheFile), { recursive: true })
        fs.writeFileSync(cacheFile, buf)
      }
    } catch (e) {
      logger.warn(`[Huitian-daily] 缓存写入失败 ${cacheFile}: ${e.message}`)
    }
  }

  return seg
}

export function cachePath(feature, dateLike = new Date()) {
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike)
  const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  return path.join(RES, "cache", feature, `${ymd}.png`)
}

export function clearCache(feature) {
  const dir = path.join(RES, "cache", feature)
  if (!fs.existsSync(dir)) return 0
  let n = 0
  for (const f of fs.readdirSync(dir)) {
    try { fs.unlinkSync(path.join(dir, f)); n++ } catch {}
  }
  return n
}
