/**
 * 薄封装 config/config.js：提供"群订阅增删 + 各模块配置查询"的稳定 API。
 * 命令层和定时任务层都走这里，不直接动 YAML。
 */
import Config from "../config/config.js"

const CHANNEL_KEYS = ["report", "moyu", "bangumi"]

/** 读取某模块配置（已经与 default.yaml 深合并） */
export function get(app) {
  return Config.get(app)
}

/** 把当前群号加入某个推送频道 */
export function subscribe(channel, groupId) {
  if (!CHANNEL_KEYS.includes(channel)) throw new Error(`未知推送频道: ${channel}`)
  const user = Config.raw()
  user[channel] = user[channel] || {}
  user[channel].groupList = user[channel].groupList || []
  const gid = String(groupId)
  if (user[channel].groupList.map(String).includes(gid)) return false
  user[channel].groupList.push(gid)
  Config.save(user)
  return true
}

/** 移除某群对某频道的订阅 */
export function unsubscribe(channel, groupId) {
  if (!CHANNEL_KEYS.includes(channel)) throw new Error(`未知推送频道: ${channel}`)
  const user = Config.raw()
  const list = user?.[channel]?.groupList || []
  const gid = String(groupId)
  const before = list.length
  user[channel] = user[channel] || {}
  user[channel].groupList = list.map(String).filter(g => g !== gid)
  Config.save(user)
  return user[channel].groupList.length < before
}

/** 一次性订阅/退订全部三个频道 */
export function subscribeAll(groupId) {
  const out = {}
  for (const c of CHANNEL_KEYS) out[c] = subscribe(c, groupId)
  return out
}
export function unsubscribeAll(groupId) {
  const out = {}
  for (const c of CHANNEL_KEYS) out[c] = unsubscribe(c, groupId)
  return out
}

/** 查询一个群在哪些频道开了推送 */
export function statusOf(groupId) {
  const gid = String(groupId)
  const out = {}
  for (const c of CHANNEL_KEYS) {
    const cfg = Config.get(c)
    out[c] = (cfg.groupList || []).map(String).includes(gid)
  }
  return out
}

export { CHANNEL_KEYS }
