# Music - HTML5 Music Player

基于 [APlayer](https://github.com/DIYgod/APlayer) 的 HTML5 音乐播放器，支持搜索、在线播放与滚动歌词。

在线体验：<https://2iker.github.io/html5-music-player/>

## 功能特性

- 网易云音乐搜索（关键词搜索歌曲/歌手/专辑）
- 在线播放（APlayer 播放器，列表模式 + 歌词滚动）
- 滚动歌词同步显示
- 载入更多（分页加载更多搜索结果）
- 响应式设计，适配桌面与移动端
- 深色毛玻璃主题 + 动态波浪背景
- 歌曲信息展示（链接、音频源、歌曲 ID、歌词、名称、歌手）

## 技术栈

- 前端：原生 HTML / CSS / JavaScript（无构建工具）
- 播放器：[APlayer](https://github.com/DIYgod/APlayer) 1.10.1
- UI 组件：[AmazeUI](https://amazeui.org/) 2.7.2
- 后端 API：网易云音乐第三方接口（Vercel 代理）
- CDN 依赖：jQuery 3.6.0

## 快速开始

### 本地运行

直接打开 `index.html` 即可，或使用任意静态服务器：

```bash
python -m http.server 8080
# 或
npx serve .
```

### 部署到 GitHub Pages

1. Fork 本仓库
2. 进入仓库 Settings → Pages
3. Source 选择 `main` 分支
4. 点击 Save

## 项目结构

```
├── index.html    # 页面结构
├── style.css     # 样式（深色毛玻璃主题 + 响应式 + 动态背景）
├── script.js     # 搜索/播放/歌词逻辑
└── README.md
```

## 设计特点

- 毛玻璃（glassmorphism）面板效果
- 动态波浪背景动画
- SVG 音乐图标（无 emoji）
- 键盘导航焦点环支持
- `prefers-reduced-motion` 无障碍支持

## 免责声明

本项目仅供个人学习交流使用，请支持正版音乐。音频与歌词资源来自互联网，版权归原作者所有。

## License

MIT
