# Tasks Flowchart

[![Obsidian plugin](https://img.shields.io/badge/Obsidian-plugin-7C3AED?logo=obsidian&logoColor=white)](https://community.obsidian.md/plugins/task-flow)
[![Downloads](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fcommunity.obsidian.md%2Fapi%2Fv1%2Fplugins%2Ftask-flow&query=%24.downloads&label=downloads&logo=obsidian&logoColor=white&color=7C3AED)](https://community.obsidian.md/plugins/task-flow)
[![Latest release](https://img.shields.io/github/v/release/shenfan19/task-flow?sort=semver)](https://github.com/shenfan19/task-flow/releases/latest)
[![Minimum Obsidian version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fshenfan19%2Ftask-flow%2Fmain%2Fmanifest.json&query=%24.minAppVersion&label=min%20Obsidian&color=blue)](https://github.com/shenfan19/task-flow/blob/main/manifest.json)
[![License](https://img.shields.io/github/license/shenfan19/task-flow)](https://github.com/shenfan19/task-flow/blob/main/LICENSE)

**Tasks Flowchart** 是一款 [Obsidian](https://obsidian.md) 插件，把 [Tasks 插件](https://github.com/obsidian-tasks-group/obsidian-tasks) 里的任务画成流程图。沿着依赖链看清工作的来龙去脉，找出卡住其他任务的那几项，拖一拖就能建立依赖或新建任务。每条依赖都作为一个字段，记在笔记里对应的任务行上。

[English](https://github.com/shenfan19/task-flow/blob/main/README.md)

**双击任务即可编辑，点 Layout 后它会按新日期移到日期轴上对应的位置。**

![双击任务，在 Tasks 编辑框里设置优先级、截止日期和 tag，再点 Layout，任务沿日期轴移到新日期](images_ai/edit-task.gif)

**拖到另一个任务上即建立依赖，拖到画布空白处即新建关联任务，右键箭头可以删除依赖。**

![拖动连接两个任务，拖到空白处新建任务，再从右键菜单删除刚建的依赖](images_ai/link-and-create.gif)

**聚焦一个任务的整条链路，高亮需要留意的任务和箭头。**

![聚焦一个任务的链路，高亮一个任务和一条箭头，取消聚焦后高亮仍保留，最后去掉一个高亮](images_ai/focus-and-highlight.gif)

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

1. 安装并启用 [Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) 插件。Tasks Flowchart 读取它的 Dataview 风格字段 `[id:: ]` 和 `[dependsOn:: ]`，暂不支持 emoji 格式 `🆔` 和 `⛔`。
2. 在 **设置 → 第三方插件 → 浏览** 里安装 Tasks Flowchart。也可以手动安装，把[最新版本](https://github.com/shenfan19/task-flow/releases/latest)的 `main.js`、`manifest.json`、`styles.css` 拷贝到 `<你的vault>/.obsidian/plugins/task-flow/`。
3. 点击左侧功能区的 **Open tasks flowchart**，或者运行命令 **Tasks Flowchart: Open flowchart**。先点左上角的 **Layout**，再点 **Overview**。
4. 第一次用任务依赖？在空白画布上点 **Create sample note**，或者运行命令 **Tasks Flowchart: Create sample note**，会生成一篇带依赖的小计划，可以拿来试。

视图左上角是 **Layout**、**Overview** 和 **Reset** 三个按钮，下面是一行 **Profile**。其余设置在下方默认折叠的卡片里，分别是 **View**、**Filters** 和 **Style**，点卡片标题展开。

## 使用说明

- **建立依赖**：从节点的下游一侧拖到另一个节点上，从上到下排布时下游一侧就是底边，左右两侧也一样，被拖到的节点就依赖出发节点。从上游一侧拖出则方向相反，出发节点依赖被拖到的节点。缺少的 `[id:: ]` 会自动生成。
- **删除依赖**：右键点击箭头，选 **Delete link**；也可以点击箭头后按 Delete 或 Backspace。
- **新建任务**：不落在节点上，而是在画布空白处松开。原任务和它的子任务下面会新增一行 `- [ ] untitled`，按同样的规则建立依赖，并弹出 Tasks 编辑框来填写。把 View 里的 **New task** 设成 **Open note**，则改为在右侧分栏打开笔记并选中 `untitled`，可以直接输入任务名。后续新建的任务依次编号为 `untitled2`、`untitled3` 等，每个都是一个单词，双击就能选中整个名字；如果你设置了 Tasks 插件的全局过滤标签，也会自动带上。
- **选中**：单击节点或箭头即选中，单击空白处取消选中。按住 Shift 在空白处拖动，可以框选框内的所有节点；按住 Ctrl，Mac 上是 Cmd，再单击，可以逐个加选。选中的节点可以一起拖动。不按 Shift 直接在空白处拖动是平移视图。
- **高亮**：右键节点或箭头选 **Highlight**，给它加上发光标记，选 **Remove highlight** 去掉标记。高亮节点时只有节点本身发光，连在它上面的箭头不变。标记在单击、拖动、打开任务时都保持不变，右键菜单里的 **Clear all highlights** 一次清除全部标记，空白处的右键菜单里也有。颜色在 Style 的 **Highlight** 里设置。
- **聚焦**：右键节点选 **Focus chain**，它的整条链路，也就是它依赖的所有任务和依赖它的所有任务，保持原样，其余部分变淡。同时选中多个节点时，保留它们所有链路的并集。单击空白处取消聚焦。
- **复位**：点 **Reset** 按钮，或者运行命令 **Tasks Flowchart: Reset, clear highlights and focus**，一次清除全部高亮和聚焦，其他什么都不改。节点位置保持到下次点 **Layout**，画布的平移和缩放保持到点 **Overview** 或你自己移动画布，profile 及其中的过滤条件、View 和 Style 都不受影响。不点 Reset 时，高亮和聚焦在关闭视图再打开后都会保留，节点位置和画布的平移、缩放也一样。
- **编辑任务**：双击节点，或者右键节点选 **Edit task…**，在 Tasks 插件自己的编辑弹窗里修改任务，包括名称和 tag、优先级、各类日期、状态、重复规则和依赖。需要 Tasks 7.21.0 或更高版本。点击弹窗外的任意位置即可关闭且不保存，也可以点右上角的 **X**，Obsidian 在这里没有显示关闭按钮时，Tasks Flowchart 会在 Tasks 设置齿轮旁边补上它。
- **修改 id**：右键节点选 **Change id…**，给任务换一个新 id。所有依赖它的任务会同步改成新 id，就像重命名笔记时链接会跟着更新一样。
- **标签**：右键节点选 **Add tag**，从笔记里已有的 tag 中挑一个，或者点列表最下面的 **New tag…** 输入新 tag。**Remove tag** 列出这个任务自己的 tag。tag 会写进或删出任务所在笔记的那一行。在过滤面板里右键某个 tag，选 **Remove … from all tasks**，可以从当前 view 的所有任务上去掉它，操作前会确认并说明涉及多少个任务和笔记。
- **批量操作**：按住 Shift 拖出选框，或者选中多个节点，然后右键选框或其中一个已选节点。**Highlight**、**Focus chain**、**Add tag**、**Remove tag** 和 **Priority** 会同时作用在所有选中的节点上。**Open note**、**Edit task…** 和 **Change id…** 只在单个节点的菜单里。
- **优先级**：右键节点选 **Priority**，在 Highest、High、Medium、Low、Lowest 里选一个，None 单独放在最后。笔记里这一行按它原有的格式修改，是 `[priority:: high]` 就改字段，是 emoji 就换 emoji，原来没有优先级的任务会加上 `[priority:: …]` 字段。
- **打开任务**：右键节点选 **Open note**，或者把单击、双击设成打开，在右侧分栏打开笔记，光标放在任务名末尾，可以直接输入。如果任务名还是 `untitled`，则直接选中它，输入即可替换。View 里的 **Click** 和 **Double-click** 分别决定单击和双击节点的效果，都可选 **Select**、**Focus chain**、**Open note** 或 **Edit task**，默认单击选中、双击编辑。右键箭头可以打开它两端的笔记。
- **命令**：**Tasks Flowchart: Layout** 和 **Tasks Flowchart: Overview, fit the graph in the view** 与两个按钮作用相同，可以在 **设置 → 快捷键** 里绑定快捷键。
- **缩小**：画布最小可缩小到 2%，方便容纳很大的图。缩放低于 30% 时隐藏任务文字和 tag，只留下节点的大小和颜色。
- **排布**：节点可以随意拖动，位置会记住。**Layout** 按选定方向排布全部节点，箭头可选曲线、直线或阶梯线，缩放保持不变；视图位置不动，如果选中了某个任务，则把它移到视图中心。**Overview** 让整张图显示在屏幕内。这两个按钮在左侧最上方。
- **日期轴**：默认打开，可在 View 里关闭。每个任务按一个日期排布：已完成的任务用完成日期，否则依次取截止日期、计划日期、开始日期中第一个存在的。同一天的任务对齐，没有日期的任务排在前后任务之间，标尺标出各任务的日期，并随中间任务的多少伸缩。红线表示今天，红色箭头表示依赖方的日期早于被依赖的任务，有日期的节点只能横向拖动。
- **泳道**：在 View 里用 **Group by** 把共享同一个 tag、同一篇笔记或同一优先级的任务放进同一列，从左到右的布局里则放进同一行。默认是 **None**，即不分泳道，选了别的才生效。每条泳道是一块淡色带，名称显示在视图边缘：tag 用它自己的颜色，笔记显示文件名，两篇笔记同名时加上文件夹，优先级按 Highest 到 Lowest 排列，None 在最后。泳道只移动节点垂直于流向的位置，所以日期轴和每个节点在日期轴上的位置不变。同一泳道里沿流向有重叠的任务会并排放在泳道里，泳道随之变宽。一个任务只属于一条泳道。带多个 tag 的任务进入其中最多任务共用的那个 tag 的泳道，没有 tag 的任务放在最后一条泳道。**Order** 决定泳道怎么排：
  - **Auto**：先按泳道里的任务原来所在的位置排序，再调整到连线多的泳道互相相邻。
  - **A-Z**：按字母顺序排，顺序不会随图的变化而变。
  - **Biggest first**：任务最多的泳道排在最前。
  - **Soft pull**：任务只是被拉向所属泳道的中心，不强制排进整齐的列，常规布局的形状仍然看得出来。色带跟着任务走，相邻色带可能挨在一起。

  优先级泳道始终按级别顺序排，所以在那里只有 **Soft pull** 和 **Auto** 不同，不提供 A-Z 和 Biggest first。泳道和其他排布一样，在点 **Layout** 时生效，之后仍然可以手动拖动节点。tag 或笔记很多时图会变得很宽，可以先用过滤器去掉一些，或者改用 **Soft pull**。
- **过滤**：在 **Filters** 里可以只显示有依赖关系的任务，这一项默认开启；可以按关键字过滤，比如 `archived on`，也可以按 tag、优先级、文件夹和状态过滤。关键字用逗号分隔，在任务文字和 tag 里匹配，不区分大小写，不会匹配 `[id:: ]`、`[dependsOn:: ]` 这类字段。tag、优先级和文件夹的用法一致：先勾选，再选 **Include** 只显示这些任务，或选 **Exclude** 隐藏这些任务。关键字选 **Include** 时，任务文字或 tag 含有其中任意一个就显示。**Status** 和 **Only show tasks with a relation** 放在面板最后。过滤条件会一直保留。
- **Profile**：一个 profile 把 Filters、View 和 Style 存在一起，在 **Profile** 这一行选中一个，三者一起切换。**Save** 把当前设置存进选中的 profile，下拉里的 **New…** 把当前设置存成一个新 profile。名字后面的 `*` 表示设置在上次保存后改过。**Default** 始终存在，不能删除。切换到布局方向、连线类型或日期轴或泳道设置不同的 profile 时，图会自动重新布局。节点位置、画布的平移和缩放、高亮和聚焦属于视图本身，不属于某个 profile，所有 profile 共用。
- **样式**：在 **Style** 里设置边框、高亮和文字颜色，设置所有节点的字号和底色，给 Highest 到 Lowest 每一级优先级的任务另设字号和底色，拖动 **Line width** 和 **Arrow size** 调整连线粗细和箭头大小，把任务文字按 Markdown 渲染，把 tag 显示成自动配色的标签，还可以打开 **Show link counts**。打开后每个节点在箭头进入的一侧显示 `depend N`，表示它依赖的任务数，在箭头离开的一侧显示 `next N`，表示依赖它的任务数。所有连线都计入，不管另一端的任务有没有被过滤掉。默认关闭。
- **刷新**：图谱会跟着你的编辑更新。修改任务行、笔记保存后几秒内，对应节点就会显示新的文字，位置不变。改了日期后，点 **Layout** 节点才会移到日期轴上的新位置。任务还会每 30 秒重新读取一次，也可以用命令 **Tasks Flowchart: Refresh tasks** 立即重新读取。拖动时，自动刷新会暂停。

## 常见问题

某个任务在图上不见了，通常是因为它没有任何依赖关系，而 **Only show tasks with a relation** 默认会隐藏这类任务。否则请检查关键字、状态、tag、优先级和文件夹过滤，并确认 Tasks 插件识别了这一行，如果你设置了 Tasks 的全局过滤标签，这一行要带上它。

Tasks Flowchart 在整行的任意位置读取 `[id:: ]`、`[dependsOn:: ]` 和日期字段，所以归档插件在字段后面追加文字时，连线照样有效。Tasks 插件只读取行尾的字段，因此它自己的查询功能读不到这类任务的 id、依赖和日期。

## 反馈

遇到问题或有新想法，欢迎[在 GitHub 上提 issue](https://github.com/shenfan19/task-flow/issues)。报告 bug 时请写上 Obsidian 和 Tasks 的版本，并附几行能复现问题的任务。Filters 里的关键字只搜索任务文字和 tag，不搜索 `[id:: ]` 或日期这类字段。如果你需要按这些字段过滤，请提 issue，并说明你想完成什么。

## 数据

依赖关系只存在笔记里。节点位置、画布的平移和缩放、过滤条件、profile、视图设置、高亮和聚焦保存在 `.obsidian/plugins/task-flow/data.json`。删掉这个文件会重置布局和设置，不会影响任何任务。

## 对笔记的修改

Tasks Flowchart 会直接修改你的笔记。连接两个任务时，会给一行任务加上 `[id:: ]` 字段，给另一行加上 `[dependsOn:: ]` 字段；删除依赖时，从 `[dependsOn:: ]` 里去掉对应的一项；把连线拖到空白处松开时，会在出发任务下面插入一行新的 `- [ ] untitled`。插件只改涉及的任务行，笔记里的其他内容保持原样。流程图里没有撤销功能：笔记在编辑器中打开时，可以用 Obsidian 自带的撤销；Obsidian 的核心插件"文件恢复"也会保存快照，可以回退到之前的版本。在重要的笔记上使用之前，请先备份 vault，或者用 git、Obsidian Sync 的版本历史做版本管理。

本插件按原样提供，不作任何形式的担保，详见 [MIT 许可证](https://github.com/shenfan19/task-flow/blob/main/LICENSE)。

## 开发

需要 Node.js 22 或更高版本。运行 `npm install` 和 `npm run build`，构建产物 `main.js`、`manifest.json`、`styles.css` 输出到 `dist/`。发版由 GitHub Actions 根据版本 tag 自动构建和发布，具体步骤写在 `.github/workflows/release.yml` 开头的注释里。

## 致谢

本项目在开发中使用了 AI 编程辅助，用于代码生成、自动化测试和文档编写。

## 许可证

MIT，见 [LICENSE](https://github.com/shenfan19/task-flow/blob/main/LICENSE)。
