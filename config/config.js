import fs from "fs"
import path from "path"
import YAML from "yaml"
import _ from "lodash"

const pluginName = "Huitian-daily"
const pluginPath = path.join(process.cwd(), "plugins", pluginName)
const defPath    = path.join(pluginPath, "config", "default.yaml")
const userPath   = path.join(pluginPath, "config", "config.yaml")

class Config {
  constructor() {
    this.init()
  }

  /** 自动生成用户配置文件（首次运行时从 default.yaml 复制） */
  init() {
    const dir = path.join(pluginPath, "config")
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    if (!fs.existsSync(userPath) && fs.existsSync(defPath)) {
      try { fs.copyFileSync(defPath, userPath) }
      catch (e) { console.error(`[${pluginName}] 创建默认配置失败`, e) }
    }
  }

  /**
   * 读取配置
   * @param {string} app  顶层 key，如 'report' / 'moyu' / 'bangumi' / 'api'
   * @returns {object}    user 覆盖 default 的深合并结果
   */
  get(app) {
    let def = {}, user = {}
    try {
      if (fs.existsSync(defPath))  def  = YAML.parse(fs.readFileSync(defPath,  "utf8")) || {}
      if (fs.existsSync(userPath)) user = YAML.parse(fs.readFileSync(userPath, "utf8")) || {}
    } catch (e) {
      console.error(`[${pluginName}] YAML 解析错误`, e.message)
    }
    const merged = _.merge({}, def, user)
    return app ? (merged[app] || {}) : merged
  }

  /** 把 user yaml 写回去（用于群订阅指令） */
  save(data) {
    try {
      fs.writeFileSync(userPath, YAML.stringify(data))
    } catch (e) {
      console.error(`[${pluginName}] 保存配置失败`, e)
    }
  }

  /** 读取 user yaml 原始对象（不与 default 合并），便于改完整体写回 */
  raw() {
    if (!fs.existsSync(userPath)) return {}
    try { return YAML.parse(fs.readFileSync(userPath, "utf8")) || {} }
    catch { return {} }
  }
}

export default new Config()
