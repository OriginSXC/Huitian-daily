<div align="center">

# Huitian-daily

**Yunzai / TRSS / Miao / NapCat(OneBot v11)** 通用日报插件  
**回天日报 · 60s · 番剧 · 摸鱼日历 · 历史上的今天 · Epic · 油价**

[![license](https://img.shields.io/github/license/OriginSXC/Huitian-daily)](./LICENSE)
![node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
[![stars](https://img.shields.io/github/stars/OriginSXC/Huitian-daily?style=flat)](https://github.com/OriginSXC/Huitian-daily/stargazers)
[![issues](https://img.shields.io/github/issues/OriginSXC/Huitian-daily)](https://github.com/OriginSXC/Huitian-daily/issues)
[![gitee](https://img.shields.io/badge/Gitee-%E9%95%9C%E5%83%8F-C71D23?logo=gitee)](https://gitee.com/OriginSXC/Huitian-daily)

**GitHub**：<https://github.com/OriginSXC/Huitian-daily> ｜ **Gitee 镜像**：<https://gitee.com/OriginSXC/Huitian-daily>

</div>

## 描述

**Huitian-daily** 是一个面向 Yunzai-Bot 的日报聚合插件，每天自动把"工位人最关心的几件事"——**今日新闻、热搜、番剧、摸鱼指数、节假日倒计时、IT 资讯、Epic 免费游戏、历史上的今天、各地油价**——拼成一张派蒙主题的可视化日报推送到群里。

设计灵感来源于 HoshinoBot 的 [huannai_report](https://github.com/SonderXiaoming/huannai_report)，本插件在保留其全部功能与定时推送语义的基础上：

- 用 Yunzai 自带 puppeteer + art-template 重写渲染管线
- 把原版 PIL 手绘的 4 张图（番剧 / Epic / 历史上的今天 / 油价）改写为 HTML + CSS 模板
- 立绘换成 **原神派蒙**（清洁素材，已内置）
- 配置体系借鉴 [Huitian-mini](https://github.com/OriginSXC/Huitian-mini) —— `default.yaml` 随仓库走、`config.yaml` 走用户私有覆盖、`Config.get(app)` 深合并
- 推送按"日报 / 摸鱼 / 番剧"三个频道独立管理

## 功能一览

- ✅ **指令触发 + 定时推送**（Yunzai 原生 `task` 机制 + `cron` 表达式）
- ✅ **群订阅按频道独立**：`日报 / 摸鱼 / 番剧` 三类可分别开关
- ✅ **失败自动降级**：日报里任意一项数据源挂了用占位文案，其它照常出图
- ✅ **按天缓存**：同一天的相同图直接命中缓存返回，秒级响应
- ✅ **派蒙主题**：星空蓝紫 `#5b6ec9` 主色，柔和圆角，统一卡片风格

## 指令列表（`#` 前缀可选）

| 指令 | 触发 | 简述 |
|---|---|---|
| 回天日报 | 任何形式 | 今日完整日报：摸鱼/B站/新番/60s/IT/一言（按天缓存） |
| 60s早报 | 任何形式 | 60 秒读懂世界（直接转发官方早报海报） |
| 今日番剧 | 任何形式 | Bangumi 当日放送 |
| 每日番剧 / 本周番剧 / 每周番剧 | 任何形式 | 一周番剧总览（4×7 网格） |
| 每日一言 | 任何形式 | 一条 hitokoto |
| 摸鱼日历 | 任何形式 | 今日摸鱼海报（含节假日倒计时） |
| 历史上的今天 | 任何形式 | 时间线 + 卡片，按事件类型区分颜色 |
| epic免费游戏 | 任何形式 | Epic 当前及即将到来的免费游戏 |
| `<地区>今日油价` | 任何形式 | 如 `上海今日油价`；不带地区 = 主要省市 |
| 日报推送开启 / 关闭 / 状态 | 群主/管理员/主人 | 频道级订阅；可加参数 `日报 / 摸鱼 / 番剧` |
| 日报帮助 | 任何形式 | 帮助图卡 |

## 定时任务（默认 cron，可在 `config.yaml` 改）

- `08:40`（±50s 抖动）回天日报
- `10:00`（±50s 抖动）摸鱼日历
- `00:05` 今日番剧
- 每周日 `03:00` 清理 bangumi / epic 渲染缓存

只会推送到 `config.yaml` 中对应模块 `groupList` 里的群——默认空，**需要群管在群里发 `#日报推送开启` 主动加入**。

---

## 安装

在 **云崽根目录** 执行：

```bash
# GitHub（海外推荐）
git clone https://github.com/OriginSXC/Huitian-daily.git ./plugins/Huitian-daily

# Gitee 镜像（国内推荐）
git clone https://gitee.com/OriginSXC/Huitian-daily.git ./plugins/Huitian-daily
```

### 安装依赖

推荐直接使用 pnpm 的过滤器功能为插件安装依赖：

```bash
pnpm install --filter=Huitian-daily
```

> 本插件运行时依赖：`cheerio`（IT 之家 RSS 解析）、`node-fetch`、`yaml`、`lodash`。
> 上面这条命令会把它们装到 `plugins/Huitian-daily/node_modules/` 下，不污染 Yunzai 主目录。

### 重启

重启 Bot 后即可使用。首次启动会自动从 `config/default.yaml` 复制出 `config/config.yaml`。

---

## 配置说明（YAML）

为了防止 `git pull` 更新代码时产生冲突，并保护您的隐私数据（如推送群号），本插件采用 **YAML 配置文件**，**请勿直接修改 JS 源码**！

### 如何修改配置？

1. **查看默认配置**：所有默认参数位于 `config/default.yaml`。**（⚠️ 请勿直接修改此文件，以免后续更新产生代码冲突）**
2. **生成用户配置**：首次启动机器人时，系统会自动在 `config/` 下生成 `config.yaml`。（也可手动新建）
3. **自定义覆盖**：打开 `config/config.yaml`，只写需要修改的字段即可，未写入的字段沿用 `default.yaml`。该文件已加入 `.gitignore`，**绝对不会在更新或上传代码时被覆盖或泄露**。

### `config.yaml` 配置示例

```yaml
# 回天日报推送（聚合报告）
report:
  cron: '0 40 8 * * *'                    # 每天 08:40（注意把 ? 换成 *）
  jitter: 50                              # 启动随机抖动秒数，0 关闭
  isAutoPush: true
  groupList: ['123456789', '987654321']   # 填入推送目标群号

# 摸鱼日历推送
moyu:
  cron: '0 0 10 * * *'
  isAutoPush: true
  groupList: ['123456789']

# 每日番剧推送
bangumi:
  cron: '0 5 0 * * *'
  isAutoPush: true
  groupList: ['123456789']

# 周日清理缓存
cleanup:
  cron: '0 0 3 * * 0'
  enable: true
  targets: ['bangumi', 'epic']

# 外部 API
api:
  six_base: 'https://60s.viki.moe'        # 60s 主接口；国内可换公共实例
  timeout_ms: 15000

# 指令行为
command:
  require_at_bot_in_group: false          # 群里发"回天日报"是否必须 @bot
```

> **常见配置项说明**:
> * **定时推送时间**：`report.cron / moyu.cron / bangumi.cron`
> * **定时推送开关**：`isAutoPush`
> * **推送目标**：`groupList`（每个频道独立）
> * **API 域名**：`api.six_base`（如默认域名访问慢可换公共实例）

> **💡 Cron 小贴士**：若 `node-schedule` 不认 `?`（Quartz 风格），请在 `config.yaml` 中把定时表达式从 `0 40 8 * * ?` 改成 `0 40 8 * * *`（把 `?` 替换为 `*` 即可）。

## 指令示例

* **手动出图**：`#回天日报` / `#60s早报` / `#摸鱼日历` / `#今日番剧` / `#每周番剧` / `#历史上的今天` / `#epic免费游戏` / `#上海今日油价`
* **群订阅**（群主/管理员/主人）：
  - 开启全部三类：`#日报推送开启`
  - 仅订阅摸鱼日历：`#日报推送开启 摸鱼`
  - 退订日报这一项：`#日报推送关闭 日报`
  - 查看本群状态：`#日报推送状态`
* **帮助图卡**：`#日报帮助`

## 数据源

- [60s API](https://github.com/vikiboss/60s)（60 秒读懂世界 / 摸鱼日历 / Epic / 历史 / 油价 / B站热搜）
- [Bangumi API](https://api.bgm.tv/calendar)（番剧周日程）
- [Hitokoto](https://v1.hitokoto.cn/)（每日一言）
- [IT 之家 RSS](https://www.ithome.com/rss/)（IT 资讯）

## 风格自定义

- 主色调统一为派蒙星空蓝紫 `#5b6ec9`，想换主题改 `resources/*/main.css` 的 `:root --accent` 即可
- 派蒙立绘：`resources/huitian_daily/res/image/paimon.jpg`（已内置，原图来自 miao-plugin 的 `character-img/派蒙/01.jpg`，无外部依赖）
- 想换立绘：放任意 jpg/png 到同一路径覆盖即可，CSS `object-fit: cover` 自适应

## 免责声明

* **开源性质**：Huitian-daily 为永久免费项目，基于 **MIT License** 协议向公众开放。
* **项目定位**：本项目主要面向 Yunzai-Bot 用户群体，旨在促进内部技术交流与学习。用户在使用过程中应严格遵守 MIT License 及当地法律法规。
* **第三方服务**：本项目所引用的第三方 API 均尽力遵循其官方使用准则。开发者不对该等 API 及其内容的合法性、准确性或稳定性作任何形式的担保。用户应自行评估并承担因调用第三方服务而产生的法律及相关风险。
* **素材声明**：内置的派蒙立绘 (`paimon.jpg`) 版权归 米哈游 / HoYoverse 所有，本项目仅作技术演示使用。
