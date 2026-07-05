const SIX_BASE = "https://60s.viki.moe"

export const SixAPI = {
  today60s:      `${SIX_BASE}/v2/60s`,
  moyu:          `${SIX_BASE}/v2/moyu`,
  fuelPrice:     `${SIX_BASE}/v2/fuel-price`,
  epic:          `${SIX_BASE}/v2/epic`,
  todayHistory:  `${SIX_BASE}/v2/today-in-history`,
  bili:          `${SIX_BASE}/v2/bili`,
}

export const OtherApi = {
  hitokoto: "https://v1.hitokoto.cn/?c=a",
  biliHot:  "https://s.search.bilibili.com/main/hotword",
  it:       "https://www.ithome.com/rss/",
  anime:    "https://api.bgm.tv/calendar",
  anilist:  "https://graphql.anilist.co",   // bgm 源站宕机时的番剧兜底（独立于 bgm）
}

export const WeekDay = {
  names:  ["一", "二", "三", "四", "五", "六", "日"],
  colors: ["#FF0000", "#FF8800", "#FFCC00", "#99FF00", "#00FF00", "#00CCFF", "#0088FF"],
  /** weekday: 0=Mon ... 6=Sun (matches Python datetime.weekday()) */
  nameCn(weekday) { return this.names[weekday] },
  color(weekday)  { return this.colors[weekday] },
}

const ZODIAC_BOUNDARIES = [20, 19, 21, 20, 21, 22, 23, 23, 23, 24, 23, 22]
const ZODIACS = [
  "水瓶座","双鱼座","白羊座","金牛座","双子座","巨蟹座",
  "狮子座","处女座","天秤座","天蝎座","射手座","摩羯座",
]
export function getZodiac(month, day) {
  return day < ZODIAC_BOUNDARIES[month - 1]
    ? ZODIACS[month - 1]
    : ZODIACS[month % 12]
}

const MOYU_QUOTES = [
  "奥德彪至死都认为他生活过得不好是因为香蕉拉得不够多",
  "想买一件羽绒服，但是999感冒灵才22块钱，于是我又穿着短裤出门了！早安，打工人！",
  "我真的太喜欢上班了，这种低人一等，累死累活还赚不到钱的感觉，真的太让人着迷了",
  "工资就像大姨妈，一个月来一次，一个星期左右就没了。",
  "小时候不明白章鱼哥天天上班为什么拉着个脸，直到我天天上班我才明白",
  "什么叫万死不辞，就是每天被气死一万次，依然不辞职。",
  "你每天都很忙的样子，可是你又穷，所以你在忙什么？",
  "去看牙，牙医问我年纪轻轻的牙齿怎么磨损这么严重？我说这些年，我都是咬着牙过来的。",
  "办公室为什么一直弥漫着一股海鲜味？原来都是你们在摸鱼？",
  "世界上最痛苦的三件事：上班、早起为了上班、早睡为了早起上班",
  "皮革厂会倒，小姨子会跑，只有你打工到老！加油打工人！",
  "当我一觉醒来精神焕发，我就知道，我迟到了。",
  "上班前：我真的很需要这份工作；上班后：那你去开除我啊",
  "上班还没有存款的人那都叫自费打工",
  "摸鱼时：这钱还挺好赚；认真工作时：你他妈的给我几个钱啊",
  "有人相爱，有人夜里看海，有人七八个闹钟起不来",
  "打工打工两手空空，闹钟一响就要开工",
  "上辈子作恶多端，这辈子早起上班",
  "枯藤老树昏鸦，上班摸鱼，下班回家",
  "古道西风瘦马，老板坐车，我骑爱玛",
  "打工的快乐是你想象不到的，因为打工根本就没有快乐",
  "我上班领的不是薪水，而是精神损失费",
  "世界上只有一种英雄主义，那就是早起上班。",
  "努力不一定被看到 但摸鱼休息一定会。",
  "每天早上睡着都要骂自己几句，怎么找了个早八的工作",
  "今天打工不努力，明日回村掰苞米",
  "只要我一直不努力，老板，就过不上他想要的生活",
  "装模做样上班，真心实意下班",
  "日常四个期盼：等周五、等下班、等快递、等发工资",
  "金窝银窝不如我的办公桌",
  "锄禾日当午，打工好辛苦",
  "放假发的朋友圈叫朋友圈，上班发的朋友圈叫劳改日记",
  "我上班的怨气可以复活十个邪剑仙",
  "余额：你最好创造心情",
  "今日心情：没心情工作",
  "生活不是卡通，请你起床打工。",
  "人之初性本善 不想上班怎么办",
  "如果坐牢有平替，那一定是上班。",
  "刚喝了一杯美式，好苦，跟我的命一样苦。",
  "漫长的岁月 竟没有一天适合上班",
  "没有困难的工作，只有勇敢的打工人",
  "打工只是一场戏，大家因为贫困而相聚",
  "早上多睡了五分钟，电动车都能拧冒烟",
  "一星期 总有那么5天摸鱼上班",
  "葡萄酒开了都要醒五分钟，人醒了却要立刻去上班",
  "加班不是福报 摸鱼才是王道",
]

const ZODIAC_QUOTES = [
  "灵感爆棚，先摸再说",
  "摸鱼需谨慎，老板在附近",
  "适合摸鱼，不宜内卷",
  "摸鱼效率MAX",
  "小心摸鱼被抓",
]

const FORTUNES = [
  "今日宜摸鱼，忌认真工作",
  "摸鱼时记得屏蔽老板，财运+1",
  "适合带薪拉屎，摸鱼指数拉满",
  "小心领导突击检查，建议低调摸鱼",
  "摸鱼虽好，可不要贪杯哦",
]

const FISH_IMGS = [
  "https://xximg1.meitudata.com/wechat-program/693e5bf1688897bivh8u605913.jpg",
  "https://xximg1.meitudata.com/wechat-program/693e5bf19ebbd9t5mu2zzc9443.jpg",
  "https://xximg1.meitudata.com/wechat-program/693e5bf1947e1ur17sr4i37516.jpg",
  "https://xximg1.meitudata.com/wechat-program/693e5bf1989d2m0bumtx1l8208.jpg",
  "https://xximg1.meitudata.com/wechat-program/693e5bf199b7fhsdrc1q4e1153.jpg",
]

const TOP_GIF_URL = "https://xximg1.meitudata.com/wechat-program/693e5bf550fd1bl4gs928f7732.gif"

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

export const MoyuData = {
  topGifUrl: TOP_GIF_URL,
  randomFortune()       { return pick(FORTUNES) },
  randomZodiacQuote()   { return pick(ZODIAC_QUOTES) },
  randomFishImg()       { return pick(FISH_IMGS) },
  randomMoyuQuote()     { return pick(MOYU_QUOTES) },
  greeting(hour) {
    if (hour >= 5  && hour < 9)  return "早上好"
    if (hour >= 9  && hour < 12) return "上午好"
    if (hour >= 12 && hour < 14) return "中午好"
    if (hour >= 14 && hour < 18) return "下午好"
    return "晚上好"
  },
  moyuLevel(idx) {
    if (idx >= 90) return "🐠 鱼王"
    if (idx >= 80) return "🦈 鱼鲨"
    if (idx >= 70) return "🐟 老油条"
    if (idx >= 60) return "🐡 熟练工"
    return "🐣 新手"
  },
  /** today: Date — returns an array of strings (对应源 util calc_salary_lines) */
  salaryLines(today) {
    const day = today.getDate()
    const year = today.getFullYear()
    const month = today.getMonth() + 1
    const lastDay = new Date(year, month, 0).getDate()
    const targets = [
      ["月初", 1], ["10号", 10], ["15号", 15],
      ["20号", 20], ["25号", 25], ["月底", lastDay],
    ]
    return targets.map(([name, d]) => {
      let target
      if (day <= d) {
        target = new Date(year, month - 1, d)
      } else {
        const ny = month === 12 ? year + 1 : year
        const nm = month === 12 ? 1 : month + 1
        const dd = name === "月底" ? new Date(ny, nm, 0).getDate() : d
        target = new Date(ny, nm - 1, dd)
      }
      const diff = Math.ceil((target - today) / 86400000)
      if (diff === 0) return `${name}：今天发薪！🎉`
      if (diff === 1) return `${name}：明天发！🥳`
      return `${name}：${diff}天`
    })
  },
}

/** 主要省/直辖市 (对应源 MainChinaCity Enum) */
export const MAIN_CHINA_CITIES = [
  "北京","上海","天津","重庆","福建","深圳","甘肃","广东","广西","贵州",
  "海南","河北","河南","湖北","湖南","吉林","江苏","江西","辽宁","浙江",
  "内蒙古","安徽","宁夏","青海","山东","山西","四川","西藏","黑龙江","新疆","云南",
]

const NUM_CN = {
  1:"一",2:"二",3:"三",4:"四",5:"五",6:"六",7:"七",8:"八",9:"九",10:"十",
  11:"十一",12:"十二",13:"十三",14:"十四",15:"十五",16:"十六",17:"十七",18:"十八",
  19:"十九",20:"二十",21:"二十一",22:"二十二",23:"二十三",24:"二十四",25:"二十五",
  26:"二十六",27:"二十七",28:"二十八",29:"二十九",30:"三十",31:"三十一",
}
export function numToCn(n) { return NUM_CN[n] ?? String(n) }

/** 历史上的今天事件类型 */
export const HistoryEventType = {
  birth: { label: "出生", color: "#22c55e", emoji: "🌱" },
  event: { label: "事件", color: "#3b82f6", emoji: "📜" },
  death: { label: "逝世", color: "#ef4444", emoji: "🕯️" },
}
