# ThreeUI 3D Pages Skill

一个面向 Codex 等 AI Agent 的 ThreeUI Skill，用于为 3D 落地页、Hero、
背景、按钮和 UI 元素做选型，并按源码约束接入现有项目。

本仓库由 [hhse](https://github.com/hhse) 发布。Skill 封装、中文说明、检索
脚本、同步脚本和校验流程由 Codex 根据 hhse 的需求协助编写，并经过本地
验证。ThreeUI 的组件、模板、实现指南和原始素材版权归原作者所有，详见
[来源与署名](#来源与署名)。

## 它解决什么问题

直接把大量 ThreeUI 提示词塞进一个文件，会让 Agent 一次读取过多内容，也
容易把多个互不相关的 3D 效果堆在同一个页面里。这个 Skill 采用渐进式检索：

1. 根据产品、受众和视觉方向检索候选；
2. 优先选一个主视觉，最多增加一个辅助效果；
3. 读取该条目的源码文件、运行时、资源和交互说明；
4. 按项目技术栈接入，并检查移动端、可访问性和性能降级。

目标不是机械复制模板，而是让 3D 效果、排版、留白、内容和交互形成统一的
视觉方向。

## 包含内容

- `SKILL.md`：Agent 的选型、实现和质量约束；
- `references/catalog.json`：ThreeUI Community 的离线目录快照；
- `references/guides/`：上游当前公开的 43 份实现指南；
- `references/integration.md`：React 接入、资源路径、性能与验证要求；
- `scripts/threeui.mjs`：中英文目录检索、条目详情和指南读取；
- `scripts/sync-threeui.mjs`：从 ThreeUI Community 更新目录和指南；
- `references/THIRD_PARTY_NOTICES.md`：上游署名和许可证说明。

当前快照包含 43 个父条目、104 条组件记录、176 个可见结果和 43 份实现
指南。数量和内容可通过同步脚本更新。

## 安装

将仓库放到 Codex 的用户级 Skills 目录：

```bash
git clone https://github.com/hhse/threeui-3d-pages.git \
  ~/.codex/skills/threeui-3d-pages
```

Codex 通常会自动发现新的 Skill。如果没有出现，重启 Codex。

## 使用

显式调用 Skill：

```text
$threeui-3d-pages 做一个深色 AI 产品落地页，使用液态金属按钮，移动端可用
```

也可以直接使用目录检索：

```bash
node scripts/threeui.mjs search "液态金属 按钮"
node scripts/threeui.mjs search "glass background" --limit 5
node scripts/threeui.mjs show liquid-metal-button
node scripts/threeui.mjs guide liquid-metal-button
```

查看分类和当前快照规模：

```bash
node scripts/threeui.mjs search
```

## 更新 ThreeUI 目录

从上游默认分支重新同步：

```bash
node scripts/sync-threeui.mjs
```

使用本地 ThreeUI checkout 进行离线同步或测试：

```bash
node scripts/sync-threeui.mjs --source-root /path/to/threeui
```

同步脚本只解析公开的 `src/data/shaders.tsx` 和
`src/components/buildSkillMarkdown.js`，不会执行上游 JavaScript。

## 范围与限制

- 只包含 ThreeUI Community 的公开元数据和实现指南；
- 不包含 Pro 源码、登录凭据或需要授权才能获取的内容；
- 不重新分发 ThreeUI 的远程缩略图、预览视频或运行时资源；
- 目标项目实际安装 ThreeUI 时，应自行核对组件、字体和第三方资源的许可证；
- 本仓库与 ThreeUI 官方没有隶属或背书关系。

## 来源与署名

本仓库的目录数据和实现指南源自：

- [MengTo/threeui](https://github.com/MengTo/threeui)
- [ThreeUI Community catalog data](https://github.com/MengTo/threeui/blob/main/src/data/shaders.tsx)
- [ThreeUI implementation guides](https://github.com/MengTo/threeui/blob/main/src/components/buildSkillMarkdown.js)
- 原作者：Meng To
- 上游许可证：MIT

具体分工：

- Codex 协助编写了 Skill 指令、集成规范、检索脚本、同步脚本、README 和
  验证流程；
- ThreeUI 的组件目录、实现指南、组件源码、设计、图片和品牌内容来自上游
  Community 项目；
- 上游 MIT 许可证和第三方说明保留在
  [`LICENSE`](LICENSE) 和
  [`references/THIRD_PARTY_NOTICES.md`](references/THIRD_PARTY_NOTICES.md)。

## License

本仓库新增的 Skill 指令和脚本采用 MIT License。来自 ThreeUI Community 的
目录数据与实现指南继续遵循其 MIT License 及相应署名要求。
