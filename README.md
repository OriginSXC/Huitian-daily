# Huitian-daily（回天日报）

Yunzai-Bot 版"回天日报"。功能 fork 自 [SonderXiaoming/huannai_report](https://github.com/SonderXiaoming/huannai_report)，把指令 / 定时推送 / 数据源完整移植到 Yunzai，立绘换成派蒙，渲染风格在原版基础上做了现代化微调（统一的星空蓝紫主色 + 柔和圆角）。

## 安装

```bash
cd /path/to/Yunzai/plugins
git clone https://github.com/OriginSXC/Huitian-daily.git
# 或下载 zip 解压到 plugins/Huitian-daily/
```

首次启动会自动从 `config/default.yaml` 复制出 `config/config.yaml`。

可选依赖：`cheerio`（用于 IT 之家 RSS 解析，没有也会自动 fallback 到正则）

```bash
cd /path/to/Yunzai && pnpm add cheerio -w
```

重启 Yunzai 后发 `#日报帮助` 应回一张图。

## 指令（`#` 前缀可选）

| 指令 | 功能 |
|------|------|
| `日报帮助` | 帮助图卡 |
| `回天日报` | 今日完整日报（缓存到当日） |
| `60s早报` | 60 秒读懂世界（官方早报图） |
| `今日番剧` | Bangumi 今日放送 |
| `每日番剧` / `本周番剧` / `每周番剧` | 一周番剧总览 |
| `每日一言` | 一条 hitokoto |
| `摸鱼日历` | 今日摸鱼海报 |
| `历史上的今天` | 今日历史大事件 |
| `epic免费游戏` | Epic 当前免费游戏 |
| `<地区>今日油价` | 各地油价（不带地区 = 主要省市） |
| `日报推送开启 [日报/摸鱼/番剧]` | 订阅推送，不带参数 = 三项全订 |
| `日报推送关闭 [日报/摸鱼/番剧]` | 退订，不带参数 = 全退 |
| `日报推送状态` | 查看本群三项订阅状态 |

群里的推送管理指令仅群主 / 管理员 / 主人可用。

## 定时任务（默认值，可在 `config.yaml` 改 cron）

- `08:40` (±50s 抖动) 回天日报
- `10:00` (±50s 抖动) 摸鱼日历
- `00:05` 今日番剧
- 每周日 `03:00` 清 bangumi / epic 渲染缓存

只会推送到 `config.yaml` 对应模块 `groupList` 里的群——默认空，要群管 `#日报推送开启` 加入。

## 配置文件

风格借鉴 `Huitian-mini`：

```
config/
├── config.js       # 单例：Config.get('report' | 'moyu' | 'bangumi' | 'api' | 'command')
├── default.yaml    # 内置默认（随仓库；不要直接改）
└── config.yaml     # 用户配置（首次启动从 default 复制；user 字段 deep merge 覆盖 default）
```

`config.yaml` 顶层 key：

- `report` / `moyu` / `bangumi`：每个频道独立的 `cron` / `jitter` / `isAutoPush` / `groupList`
- `cleanup`：周期清缓存（`cron` + `targets`）
- `api`：`six_base`（60s 接口域名，国内可换公共实例）、`alapi_token`（预留）、`timeout_ms`
- `command.require_at_bot_in_group`：群里发 `回天日报` 是否必须 @bot（默认 false，对齐 Yunzai 习惯）

## 风格自定义

- 主色调 `--accent: #5b6ec9`（派蒙星空蓝紫），想换主题改 `resources/*/main.css` 的 `:root` 即可。
- 派蒙立绘：`resources/huitian_daily/res/image/paimon.jpg`，原图来自 miao-plugin 的 `character-img/派蒙/01.jpg`，已复制为本插件资产；换图覆盖同名文件即可。

## 数据源

- 60s API: https://60s.viki.moe/
- Bangumi: https://api.bgm.tv/calendar
- Hitokoto: https://v1.hitokoto.cn/
- B 站热搜: https://s.search.bilibili.com/main/hotword
- IT 之家: https://www.ithome.com/rss/

## 致谢

- 原项目：[SonderXiaoming/huannai_report](https://github.com/SonderXiaoming/huannai_report)
- config 风格参考：[Huitian-mini](https://github.com/...)（同作者）
- 60s 项目：[vikiboss/60s](https://github.com/vikiboss/60s)

MIT License
