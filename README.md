# BJT 模擬試験 — Mock Exam

零依赖在线模拟 BJT（商务日语能力考试）。**双击 `index.html` 即可使用**。

## 功能特色

- **80 道真题级题目** — 听解(25) + 听读解(25) + 阅读(30)，分三部分限时作答
- **加权计分** — 按题型难度和 Part 权重计算 BJT 推定分数(0-800)，对应 J5~J1+ 六个等级
- **题型分析** — 成绩页展示 9 种题型的正答率，精准定位弱项
- **中日对照** — 全 80 题中文翻译完成，学习模式和错题本均支持双语显示
- **错题复习** — 按考试筛选、按章节筛选，翻译开关自由切换
- **历史趋势** — SVG 折线图追踪分数变化
- **TTS 语音** — 浏览器原生语音合成朗读日语听力，支持语速三档调节
- **完全离线** — 纯 HTML/CSS/JS，无框架无构建工具，数据存浏览器本地

## 快速开始

### 方式 A：双击打开（推荐）
1. 下载或 clone 本仓库
2. 双击 `index.html`，用 Chrome 或 Edge 打开
3. 开始答题

### 方式 B：本地 HTTP 服务
```bash
python3 -m http.server 8000
# 浏览器打开 http://localhost:8000
```

### 方式 C：GitHub Pages
1. Fork 本仓库
2. Settings → Pages → Deploy from branch → main
3. 访问 `https://<你的用户名>.github.io/BJTtest/`

## 文件说明

| 文件 | 作用 |
|---|---|
| `index.html` | 首页（考试入口 + 历史成绩 + 趋势图） |
| `exam.html` | 答题页（分段限时、TTS 语音、模式切换） |
| `result.html` | 成绩页（分数、等级、题型分析） |
| `review.html` | 错题本（中日对照、语音回放） |
| `study.html` | 学习模式（全题库中日对照、不限时） |
| `questions-data.js` | 80 题完整数据 |
| `translations.js` | 80 题中文翻译 |
| `bjt-local-api.js` | 本地判分 & 存储逻辑 |
| `bjt-common.js` | 公共函数（图表、TTS、计分算法） |
| `images/` | 场景图片（名片、会议等） |

## 数据存储

- 历史成绩、错题 → 浏览器 **localStorage**（最近 20 次）
- 答题进度 → **sessionStorage**（关标签页即消失）
- **不上传任何数据**
- 清空数据：控制台输入 `bjtClearRecords()`

## 浏览器兼容

| 浏览器 | 听力 TTS | 备注 |
|---|---|---|
| Chrome / Edge | ✅ | **推荐** |
| Safari | ✅ | macOS / iOS |
| Firefox | ⚠️ | 需日语语音包 |

---

**祝考试顺利！**
