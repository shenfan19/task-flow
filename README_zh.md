# Tasks Flowchart

[![Obsidian plugin](https://img.shields.io/badge/Obsidian-plugin-7C3AED?logo=obsidian&logoColor=white)](https://community.obsidian.md/plugins/task-flow)
[![Downloads](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fcommunity.obsidian.md%2Fapi%2Fv1%2Fplugins%2Ftask-flow&query=%24.downloads&label=downloads&logo=obsidian&logoColor=white&color=7C3AED)](https://community.obsidian.md/plugins/task-flow)
[![Latest release](https://img.shields.io/github/v/release/shenfan19/task-flow?sort=semver)](https://github.com/shenfan19/task-flow/releases/latest)
[![Minimum Obsidian version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fshenfan19%2Ftask-flow%2Fmain%2Fmanifest.json&query=%24.minAppVersion&label=min%20Obsidian&color=blue)](https://github.com/shenfan19/task-flow/blob/main/manifest.json)
[![License](https://img.shields.io/github/license/shenfan19/task-flow)](https://github.com/shenfan19/task-flow/blob/main/LICENSE)

**Tasks Flowchart** 是一款 [Obsidian](https://obsidian.md) 插件，把 [Tasks 插件](https://github.com/obsidian-tasks-group/obsidian-tasks) 里的任务画成流程图。沿着依赖链看清工作的来龙去脉，找出卡住其他任务的那几项，拖一拖就能建立依赖或新建任务。每条依赖都作为一个字段，记在笔记里对应的任务行上。

[English](https://github.com/shenfan19/task-flow/blob/main/README.md)

[在 YouTube 观看四分钟演示视频](https://www.youtube.com/watch?v=bcdKUnvzx1I)，英文朗读。

**拖到另一个任务上即建立依赖，拖到画布空白处即新建任务。从底边往下拖，新任务依赖它；从顶边往上拖，它依赖新任务。**

![拖动连接两个任务，向下拖到空白处新建依赖它的任务，向上拖到空白处新建它所依赖的任务，最后点 Layout](images_ai/link-and-create.gif)

**Layout 把任务按依赖排好，日期轴再按真实日期拉开流程。**

![把三个任务拖乱，点 Layout 排回原位，再打开日期轴，任务沿标尺按日期排列](images_ai/layout-date-axis.gif)

**按 tag、笔记或优先级把任务分成泳道。**

![按 tag 分组，把泳道顺序切到 Soft pull，再按优先级分组，最后关闭泳道](images_ai/lanes.gif)

## 为什么用 Tasks Flowchart

- **计划就存在你的笔记里。** 每个节点就是笔记里的一行任务，每条箭头就是这行任务上的一个字段。没有数据库，也没有隐藏的文件格式，所以计划在任何编辑器里都能打开，能放进 git 和同步服务，Dataview 和 Tasks 插件自己的查询也都能读到，卸载 Tasks Flowchart 之后也一样都在。
- **看清谁卡着谁。** 上游任务排在等待它的任务前面，上面已经没有未完成前置的任务，就是现在可以动手的任务。

下面这三行会画成三个相连的节点：

```markdown
- [ ] Write copy  [id:: copy]
- [ ] Design mockups  [id:: design]
- [ ] Build pages  [dependsOn:: design,copy]
```

## 快速上手

1. 安装并启用 [Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) 插件。Tasks Flowchart 两种格式都能读取，emoji 格式的 `🆔` 和 `⛔`，以及 Dataview 格式的 `[id:: ]` 和 `[dependsOn:: ]`，写入时用你在 **Style** 里 **Task format** 选的那一种。
2. 在 **设置 → 第三方插件 → 浏览** 里安装 Tasks Flowchart。也可以手动安装，把[最新版本](https://github.com/shenfan19/task-flow/releases/latest)的 `main.js`、`manifest.json`、`styles.css` 拷贝到 `<你的vault>/.obsidian/plugins/task-flow/`。
3. 点击左侧功能区的 **Open tasks flowchart**，或者运行命令 **Tasks Flowchart: Open flowchart**。先点左上角的 **Layout**，再点 **Overview**。
4. 第一次用任务依赖？在空白画布上点 **Create sample note**，或者运行命令 **Tasks Flowchart: Create sample note**，会生成一篇带依赖的小计划，可以拿来试。

视图左上角是 **Layout**、**Overview** 和 **Reset** 三个按钮，下面是一行 **Profile**。其余设置在下方默认折叠的卡片里，分别是 **View**、**Filters** 和 **Style**，点卡片标题展开。

## 功能一览

详细说明目前只有英文，每一项链接到英文手册里对应的页面，手册首页是 [Tasks Flowchart manual](docs/index.md)。

- **建立依赖与新建任务**：见 [Links and new tasks](docs/links.md)。
- **原地编辑**：双击任务改名称、日期、优先级和 tag，见 [Editing tasks](docs/editing.md)。
- **高亮与聚焦**：见 [Highlight and focus](docs/highlight_focus.md)。
- **排布**：Layout、日期轴、Separate links，见 [Arranging the graph](docs/arranging.md) 和 [How Layout arranges nodes](docs/layout_stability.md)。
- **泳道**：按 tag、笔记或优先级分组，见 [Lanes](docs/lanes.md)。
- **筛选、预设和样式**：见 [Filters, profiles and style](docs/filters_profiles_style.md)。

## 常见问题

某个任务在图上不见了，通常是因为它没有任何依赖关系，而 **Only show tasks with a relation** 默认会隐藏这类任务。否则请检查关键字、状态、tag、优先级和文件夹过滤，并确认 Tasks 插件识别了这一行，如果你设置了 Tasks 的全局过滤标签，这一行要带上它。

Tasks Flowchart 在整行的任意位置读取两种格式的 id、依赖和日期字段，所以归档插件在字段后面追加文字时，连线照样有效。Tasks 插件只读取行尾的字段，而且只认它自己设定的那一种格式，因此它自己的查询功能读不到这类任务，以及两种格式混写的行里的 id、依赖和日期。

## 反馈

遇到问题或有新想法，欢迎[在 GitHub 上提 issue](https://github.com/shenfan19/task-flow/issues)。报告 bug 时请写上 Obsidian 和 Tasks 的版本，并附几行能复现问题的任务。Filters 里的关键字只搜索任务文字和 tag，不搜索 `[id:: ]` 或日期这类字段。如果你需要按这些字段过滤，请提 issue，并说明你想完成什么。

## 数据

依赖关系只存在笔记里。节点位置、画布的平移和缩放、过滤条件、profile、视图设置、高亮和聚焦保存在 `.obsidian/plugins/task-flow/data.json`。删掉这个文件会重置布局和设置，不会影响任何任务。

## 对笔记的修改

Tasks Flowchart 会直接修改你的笔记。连接两个任务时，会给一行任务加上 id 字段，给另一行加上依赖字段，按 **Task format** 写成 `🆔` 和 `⛔`，或 `[id:: ]` 和 `[dependsOn:: ]`；删除依赖时，从依赖列表里去掉对应的一项；把连线拖到空白处松开时，会在出发任务下面插入一行新的 `- [ ] untitled`。插件只改涉及的任务行，笔记里的其他内容保持原样。流程图里没有撤销功能：笔记在编辑器中打开时，可以用 Obsidian 自带的撤销；Obsidian 的核心插件"文件恢复"也会保存快照，可以回退到之前的版本。在重要的笔记上使用之前，请先备份 vault，或者用 git、Obsidian Sync 的版本历史做版本管理。

本插件按原样提供，不作任何形式的担保，详见 [MIT 许可证](https://github.com/shenfan19/task-flow/blob/main/LICENSE)。

## 开发

需要 Node.js 22 或更高版本。运行 `npm install` 和 `npm run build`，构建产物 `main.js`、`manifest.json`、`styles.css` 输出到 `dist/`。发版由 GitHub Actions 根据版本 tag 自动构建和发布，具体步骤写在 `.github/workflows/release.yml` 开头的注释里。

## 致谢

本项目在开发中使用了 AI 编程辅助，用于代码生成、自动化测试和文档编写。

## 许可证

MIT，见 [LICENSE](https://github.com/shenfan19/task-flow/blob/main/LICENSE)。
