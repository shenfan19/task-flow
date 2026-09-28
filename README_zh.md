# Tasks Flowchart

[![Obsidian plugin](https://img.shields.io/badge/Obsidian-plugin-7C3AED?logo=obsidian&logoColor=white)](https://community.obsidian.md/plugins/task-flow)
[![Downloads](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fcommunity.obsidian.md%2Fapi%2Fv1%2Fplugins%2Ftask-flow&query=%24.downloads&label=downloads&logo=obsidian&logoColor=white&color=7C3AED)](https://community.obsidian.md/plugins/task-flow)
[![Latest release](https://img.shields.io/github/v/release/shenfan19/task-flow?sort=semver)](https://github.com/shenfan19/task-flow/releases/latest)
[![Minimum Obsidian version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fshenfan19%2Ftask-flow%2Fmain%2Fmanifest.json&query=%24.minAppVersion&label=min%20Obsidian&color=blue)](manifest.json)
[![License](https://img.shields.io/github/license/shenfan19/task-flow)](LICENSE)

**Tasks Flowchart** 是一款 [Obsidian](https://obsidian.md) 插件，把 [Tasks 插件](https://github.com/obsidian-tasks-group/obsidian-tasks) 里的任务画成流程图。沿着依赖链看清工作的来龙去脉和谁卡着谁，拖一拖就能建立依赖或新建任务，一切都保存为明文 Markdown。

[English](README.md)

**把连线拖到画布空白处，就新建一个关联任务。** 新任务写进笔记，并打开、选中名字，直接输入即可改名。

![从两个节点拖出新建任务，新任务在旁边的笔记里被选中](images_ai/drag-to-create.gif)

**在两个任务之间拖动即可建立依赖，选中箭头按 Delete 即可删除。**

![连接两个任务，再选中新箭头并删除](images_ai/connect-and-delete.gif)

**打开时间轴，按日期排布任务。**

![打开时间轴后的 Tasks Flowchart 图谱](images_ai/time-axis.png)

## 为什么用 Tasks Flowchart

- **计划始终是明文 Markdown。** 每个节点就是笔记里的一行任务，每条箭头就是这行任务上的一个字段。没有数据库，也没有隐藏的文件格式，所以计划在任何编辑器里都能打开，能放进 git 和同步服务，Dataview 和 Tasks 插件自己的查询也都能读到，卸载 Tasks Flowchart 之后也一样都在。
- **看清谁卡着谁。** 上游任务排在等待它的任务前面，上面已经没有未完成前置的任务，就是现在可以动手的任务。

下面这三行会画成三个相连的节点：

```markdown
- [ ] Write copy  [id:: copy]
- [ ] Design mockups  [id:: design]
- [ ] Build pages  [dependsOn:: design,copy]
```

## 快速上手

1. 安装并启用 [Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) 插件。Tasks Flowchart 读取它的 Dataview 风格字段 `[id:: ]` 和 `[dependsOn:: ]`，暂不支持 emoji 格式 `🆔` 和 `⛔`。
2. 在 **设置 → 第三方插件 → 浏览** 里安装 Tasks Flowchart。也可以手动安装，把[最新版本](https://github.com/shenfan19/task-flow/releases/latest)的 `main.js`、`manifest.json`、`styles.css` 拷贝到 `<你的vault>/.obsidian/plugins/task-flow/`。
3. 点击左侧功能区的 **Open tasks flowchart**，或者运行命令 **Tasks Flowchart: Open flowchart**。先点左上角的 **Layout**，再点 **Overview**。

所有设置都在视图左侧的几张卡片里，分别是 **Presets**、**View Control**、**File Filters** 和 **Node Style**，上方是 **Layout** 和 **Overview** 两个按钮。

## 使用说明

- **建立依赖**：从节点的下游一侧拖到另一个节点上，从上到下排布时下游一侧就是底边，左右两侧也一样，被拖到的节点就依赖出发节点。从上游一侧拖出则方向相反，出发节点依赖被拖到的节点。缺少的 `[id:: ]` 会自动生成。
- **删除依赖**：右键点击箭头，选 **Delete link**；也可以点击箭头后按 Delete 或 Backspace。
- **新建任务**：不落在节点上，而是在画布空白处松开。原任务和它的子任务下面会新增一行 `- [ ] untitled`，按同样的规则建立依赖，并在右侧分栏打开、选中 `untitled`，可以直接输入任务名。后续新建的任务依次编号为 `untitled2`、`untitled3` 等，每个都是一个单词，双击就能选中整个名字；如果你设置了 Tasks 插件的全局过滤标签，也会自动带上。
- **高亮**：单击节点，它和连在它上面的箭头会发光凸显；单击箭头则只有这条箭头发光。图上其余部分保持不变。颜色在 Node Style 的 **Highlight** 里设置。
- **聚焦**：右键节点选 **Focus chain**，它的整条链路，也就是它依赖的所有任务和依赖它的所有任务，保持原样，其余部分变淡。单击空白处同时取消高亮和聚焦。
- **打开任务**：双击节点，或者右键节点选 **Open task**，在右侧分栏打开笔记，光标放在任务名末尾，可以直接输入。如果任务名还是 `untitled`，则直接选中它，输入即可替换。View Control 里的 **Click** 和 **Double-click** 分别决定单击和双击节点的效果，都可选 **Highlight**、**Focus chain** 或 **Open task**，默认单击高亮、双击打开。右键箭头可以打开它两端的任务。
- **命令**：**Tasks Flowchart: Layout** 和 **Tasks Flowchart: Overview, fit the graph in the view** 与两个按钮作用相同，可以在 **设置 → 快捷键** 里绑定快捷键。
- **排布**：节点可以随意拖动，位置会记住。**Layout** 按选定方向排布全部节点，箭头可选曲线、直线或阶梯线；**Overview** 让整张图显示在屏幕内。这两个按钮在左侧最上方。
- **时间轴**：每个任务按完成日期、计划日期或截止日期排布。同一天的任务对齐，没有日期的任务排在前后任务之间，标尺标出各任务的日期，并随中间任务的多少伸缩。红线表示今天，红色箭头表示依赖方的日期早于被依赖的任务，有日期的节点只能横向拖动。
- **过滤**：在 **File Filters** 里可以只显示有依赖关系的任务，这一项默认开启；可以隐藏含有关键字的任务，比如 `archived on`；还可以按状态、tag、文件夹过滤。过滤条件会一直保留。
- **预设**：在 **Presets** 里选中一个预设就载入它的过滤条件。**Save** 把当前过滤条件存进选中的预设，下拉里的 **New…** 把当前过滤条件存成一个新预设。**Default** 始终存在，不能删除。
- **样式**：在 **Node Style** 里设置边框和文字颜色，给高、普通、低三档优先级的任务各设字号和底色，把任务文字按 Markdown 渲染，把 tag 显示成自动配色的标签。
- **刷新**：图谱会跟着你的编辑更新。修改任务行、笔记保存后几秒内，对应节点就会显示新的文字，位置不变。任务默认还会每 30 秒重新读取一次，也可以点 **View Control** 里的 **Refresh**。拖动时，自动刷新会暂停。

## 常见问题

某个任务在图上不见了，通常是因为它没有任何依赖关系，而 **Only show tasks with a relation** 默认会隐藏这类任务。否则请检查关键字、状态、tag 和文件夹过滤，并确认 Tasks 插件识别了这一行，如果你设置了 Tasks 的全局过滤标签，这一行要带上它。

Tasks Flowchart 在整行的任意位置读取 `[id:: ]`、`[dependsOn:: ]` 和日期字段，所以归档插件在字段后面追加文字时，连线照样有效。Tasks 插件只读取行尾的字段，因此它自己的查询功能读不到这类任务的 id、依赖和日期。

## 数据

依赖关系只存在笔记里。节点位置、过滤条件、预设和视图设置保存在 `.obsidian/plugins/task-flow/data.json`。删掉这个文件会重置布局和设置，不会影响任何任务。

## 开发

需要 Node.js 22 或更高版本。运行 `npm install` 和 `npm run build`，构建产物 `main.js`、`manifest.json`、`styles.css` 输出到 `dist/`。发版由 GitHub Actions 根据版本 tag 自动构建和发布，具体步骤写在 `.github/workflows/release.yml` 开头的注释里。

## 许可证

MIT，见 [LICENSE](LICENSE)。
