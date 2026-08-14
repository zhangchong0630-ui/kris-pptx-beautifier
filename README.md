# kris-pptx-beautifier

HTML-first 同品牌 PPT 重构 skill：把现有 PPTX 重排为 1920x1080 HTML，再导出为
可编辑 PPTX（`brand-rebuild` / 同品牌重构）。

## 快速开始

1. 安装运行时依赖：
   ```bash
   ./bootstrap.sh
   export PPTX_BEAUTIFIER_NODE_MODULES="$(pwd)/node_modules"
   ```
2. 阅读 `SKILL.md` 的完整工作流（intake → 检查 → 逻辑映射 → 设计系统 →
   视觉素材 → 品牌绑定 → HTML → 校验 → 导出 → QA → 交付）。

## 依赖说明

| 依赖 | 类型 | 说明 |
|---|---|---|
| `playwright` | 公共 npm | 浏览器渲染 DOM |
| `jszip` | 公共 npm | 解包 PPTX 提取媒体 |
| `pngjs` | 公共 npm | 解码 PNG 做像素级视觉比较 |
| `@oai/artifact-tool` | **私有包** | PPTX 读写核心；`bootstrap.sh` 会从 Codex 运行时符号链接，缺失时需手动提供 |
| Chrome / Edge | 系统浏览器 | `launchBrowser` 会自动探测；或 `PPTX_BEAUTIFIER_BROWSER` 指定 |

## 环境变量

| 变量 | 用途 |
|---|---|
| `PPTX_BEAUTIFIER_NODE_MODULES` | 运行时依赖目录（**优先级最高**，bootstrap 后设为 `<skill>/node_modules`） |
| `PPTX_BEAUTIFIER_BROWSER` | 指定浏览器可执行文件路径 |
| `CODEX_RUNTIME_NODE_MODULES` | Codex 运行时依赖目录（第二优先级） |
| `OFFICECLI_BIN` | OfficeCLI 可执行文件（可选，用于原生二次 QA） |

## 目录结构

- `SKILL.md` — 主工作流定义
- `references/` — 各阶段详细规则与契约
- `scripts/` — 全部 CLI 脚本（零内部依赖，运行时包见上）
- `assets/deck-template.html` — HTML 起点模板
- `bootstrap.sh` — 依赖安装脚本

## 许可

本仓库尚未声明 License（上游参考项目：`JimLiu/baoyu-design`、
`zarazhangrui/frontend-slides`、`atharva9167j/dom-to-pptx` 为 MIT；
`iOfficeAI/OfficeCLI` 为 Apache-2.0）。发布前请补充 LICENSE 文件。
