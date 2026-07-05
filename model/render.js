import fs from "node:fs"
import path from "node:path"
import puppeteer from "../../../lib/puppeteer/puppeteer.js"

const PLUGIN_ROOT = path.resolve("./plugins/Huitian-daily")
const RES = path.join(PLUGIN_ROOT, "resources")

// 渲染整体超时兜底：puppeteer 冷启动偶发浏览器起不来 / goto 内部超时不触发，
// 导致 screenshot 永久挂起 → 定时任务 promise 一直 pending → 永不广播、任务无 [完成]。
// 用一个外层 race 兜底，超时就当渲染失败返回 false，让任务能收尾（下一轮/次日再试）。
const RENDER_TIMEOUT_MS = 60_000

function withTimeout(promise, ms, label) {
  let timer
  const guard = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`render "${label}" 超时 ${ms}ms（疑似 Chromium 冷启动卡死）`)), ms)
  })
  return Promise.race([promise, guard]).finally(() => clearTimeout(timer))
}

/**
 * 渲染一个模板成图片消息段（可选缓存到磁盘）
 * @param name      模板名（对应 resources/<name>/main.html）
 * @param data      模板上下文，会与 puppeteer 透传参数一起传给 art-template
 * @param opts.cacheFile  绝对路径；存在则命中返回，缺失则渲染后写盘
 * @param opts.* 其余字段透传给 puppeteer.screenshot（pageGotoParams 等）
 * @returns segment.image(...) 直接 reply 即可；失败返回 false
 */
export async function render(name, data = {}, opts = {}) {
  const { cacheFile, renderTimeout = RENDER_TIMEOUT_MS, ...passthrough } = opts

  if (cacheFile && fs.existsSync(cacheFile)) {
    return segment.image(fs.readFileSync(cacheFile))
  }

  const tplFile = path.join(RES, name, "main.html")
  // 临时 HTML 写到 ./temp/html/，所以模板里的相对路径需要靠 <base> 回指到源目录
  const _base = `file://${path.join(RES, name)}/`
  // Yunzai 的 Renderer.dealTpl 用 name 同时拼父目录和 saveId，所以 name 里不能含 /
  // 冷启动首次渲染偶发浏览器卡死（“首次必挂、第二次就好”），超时/失败自动再渲一次，
  // 让日报/摸鱼在清晨冷启动那一轮也能出图，而不是白白丢一整轮推送。
  let seg = false
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      seg = await withTimeout(
        puppeteer.screenshot(`huitian-daily-${name}`, {
          tplFile,
          _base,
          ...data,
          ...passthrough,
        }),
        renderTimeout,
        name,
      )
      if (seg) break
      logger.warn(`[Huitian-daily] 渲染 ${name} 返回空${attempt === 0 ? "，重试一次" : ""}`)
    } catch (e) {
      logger.error(`[Huitian-daily] 渲染 ${name} 失败: ${e.message}${attempt === 0 ? "，重试一次" : ""}`)
    }
  }
  if (!seg) return false

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
