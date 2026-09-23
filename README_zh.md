# Task Flow

**Task Flow 把 [Tasks 插件](https://github.com/obsidian-tasks-group/obsidian-tasks) 里的任务依赖关系，画成一张可交互的节点图**，让你一眼看清任务之间的依赖链、卡在哪里、现在能立刻动手做什么，而不是在一长串扁平的勾选列表里翻找。

如果你已经在用 Tasks 插件的 `[id:: ]` 和 `[dependsOn:: ]`（Dataview 风格内联字段）语法给任务打依赖标记，Task Flow 会直接读出这张关系图并画出来：拖动节点、一键自动排布、直接在画布上拉连线或删连线、点节点跳转到源文件、按目录和状态过滤出你正在看的那个项目。

## 功能

- **依赖图，不是待办列表**——节点和箭头都是从 Tasks 插件自己的 `id`/`dependsOn` 字段实时算出来的，一个任务可以同时依赖多个上级任务
- **在画布上直接编辑依赖关系**——从一个节点拖一条线到另一个节点，就是往源文件里真实写入 `[id:: ]`/`[dependsOn:: ]` 标签（如果起点任务还没有 id 会自动生成一个）；选中一条连线按 Delete 就能删除。这不是另起一套画布专用格式，改的就是 Tasks 插件本来就在读的那份数据
- **可交互画布**——自由拖动节点，位置会记住。一键自动排布（dagre 算法），支持上下左右四个方向，连线样式可选贝塞尔曲线、直线或阶梯线
- **点节点开文件**——直接跳转到任务所在文件的对应行，在右侧分栏打开，可以像 Obsidian 其他标签页一样拖回主视图
- **File Filters 加保存预设**——按目录范围过滤（只看勾选的或排除勾选的两种模式）、按完成状态过滤、可以关掉"只显示有依赖关系的任务"这条默认规则，还能把一组过滤条件存成命名预设,随时切换
- **节点样式可自定义**——背景色、边框色、文字色、字号，另外有个可选的富文本（Markdown）渲染模式,适合任务描述里带链接、比较长的情况
- **按优先级变色变大**——可选功能,打开后节点会按 Tasks 插件的优先级标记自动变色变大,重要的阻塞任务一眼就能看到
- **自动刷新和自动排布**——都在 View Control 面板里,各自独立开关、各自可调间隔,不用手动重开视图就能跟上你在别处改的任务

## 前置依赖

- 需要装好并启用 [Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) 这个社区插件
- 任务之间要用 Tasks 插件的 Dataview 风格语法互相引用：`[id:: <id>]` 和 `[dependsOn:: <id1>,<id2>]`。Task Flow 不发明新的依赖标记格式,读写的都是你已经在用的那一套

## 安装

在正式进入 Obsidian 官方插件商店之前,先手动安装：

1. 从 [最新 Release](https://github.com/shenfan19/task-flow/releases) 下载 `main.js`、`manifest.json`、`styles.css`
2. 拷贝到 `<你的vault>/.obsidian/plugins/task-flow/`
3. 重启 Obsidian,在设置的第三方插件里启用 **Task Flow**

## 使用

- 点击 Task Flow 的功能区图标（或者跑 **Open Task Flow view** 这个命令）打开图谱
- 左侧栏有三个面板——**File Filters**、**View Control**、节点样式——所有设置都在这一个视图里，不需要另外找设置页面

## License

MIT，见 [LICENSE](LICENSE)。
