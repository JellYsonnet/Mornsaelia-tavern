# 莫恩瑟利亚 — SillyTavern 酒馆助手前端卡

## 简介

莫恩瑟利亚是一款基于 **SillyTavern + 酒馆助手 (Tavern Helper)** 的开放世界 RPG 同层前端卡。

- 自包含前端界面（Vue 3 + TypeScript）
- 固定地图系统（7 个地点）
- 三栏布局（状态/叙事/背包）
- localStorage 存档
- jsDelivr CDN 自动更新

## 快速开始

### 前提条件

1. SillyTavern 已安装
2. 酒馆助手 (Tavern Helper) 插件已安装
   ```
   酒馆 → 扩展 → 安装扩展 → 
   https://github.com/n0vi028/JS-Slash-Runner
   ```

### 部署到 GitHub

1. 点击右上角绿色「Use this template」按钮创建你的仓库
2. 前往仓库 **Settings → Actions → General**
   - 将 Workflow permissions 设为 **Read and write permissions**
   - 勾选 **Allow GitHub Actions to create and approve pull requests**
3. 克隆到本地：
   ```bash
   git clone https://github.com/你的用户名/仓库名.git
   cd 仓库名
   ```
4. 安装依赖：
   ```bash
   npm install -g pnpm
   pnpm install
   ```
5. 在 `tavern_sync.yaml` 中配置 `user名称: 你的名字`
6. 修改 `src/莫恩瑟利亚/角色卡/第一条消息/1.md` 中的 jsDelivr URL：
   ```
   https://testingcf.jsdelivr.net/gh/你的用户名/仓库名/dist/莫恩瑟利亚/前端/index.html
   ```

### 本地开发 (热更新)

1. 启动 Cursor/VSCode
2. 修改 `src/莫恩瑟利亚/前端/界面.vue` 中的代码
3. 运行：
   ```bash
   pnpm run watch
   ```
4. 修改会自动同步到酒馆

### 使用角色卡

1. 从 CI 打包产物中下载 `dist/莫恩瑟利亚/角色卡/莫恩瑟利亚.png`
2. 拖入 SillyTavern 导入
3. 下拉招呼加载前端界面

## 项目结构

```
├── src/
│   └── 莫恩瑟利亚/
│       ├── 前端/          # 前端界面（Vue 组件）
│       │   ├── index.html # HTML 入口
│       │   ├── index.ts   # TypeScript 入口
│       │   └── 界面.vue   # 主界面组件
│       ├── 脚本/          # 酒馆助手脚本
│       │   └── index.ts
│       └── 角色卡/        # 角色卡配置
│           ├── index.yaml
│           └── 第一条消息/
├── dist/                  # 打包产物（自动生成）
├── tavern_sync.yaml       # 同步配置
├── webpack.config.ts      # Webpack 配置
└── package.json
```

## 技术栈

- Vue 3 + TypeScript
- Tavern Helper API
- Webpack 5
- jsDelivr CDN
- GitHub Actions (自动打包)

## 许可证

MIT
