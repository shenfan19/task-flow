# Task Flow

![GitHub release](https://img.shields.io/github/v/release/shenfan19/task-flow?sort=semver)
![License](https://img.shields.io/github/license/shenfan19/task-flow)
![Obsidian downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=downloads&query=%24%5B%22task-flow%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)

See your task dependencies as a graph, not a wall of checkboxes.

[中文说明](README_zh.md)

![Task Flow graph with the time axis turned on](images_ai/time-axis.png)

Task Flow draws the tasks in your vault as an interactive node graph, using the dependency links you already keep with the [Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) plugin. Every arrow comes from a real `[id:: ]` and `[dependsOn:: ]` field in your notes, and every edit you make on the canvas is written back into those same notes, so there is no separate diagram to keep in sync.

## Your plan stays plain Markdown

Plenty of tools let you drag boxes around to plan a project. Most of them keep the result in their own database or in a file format only they can read. Task Flow keeps nothing of the kind. Every node is a task line in one of your notes, and every arrow is a short field on that line:

```markdown
- [ ] Design mockups  [id:: design]
- [ ] Build pages  [dependsOn:: design]
```

When you draw an arrow, delete one, or drag out a new task, Task Flow edits these lines and nothing else. That means

- you can read and edit the whole plan in any text editor, on any device, with or without the plugin,
- the plan works with git, sync services and backups exactly like the rest of your notes,
- the Tasks plugin, Dataview and your own queries all see the same dependencies, and
- if you ever uninstall Task Flow, every task and every dependency is still there as plain text.

The only thing Task Flow stores outside your notes is how the graph looks on screen, such as node positions and filter presets, see [Where Task Flow keeps its data](#where-task-flow-keeps-its-data).

## Why Task Flow?

A flat task list can't show you why something is stuck. Once a project has more than a handful of tasks blocking each other, scrolling a checklist stops answering the two questions that actually matter:

- What's blocking what?
- What's actually safe to start right now?

Task Flow answers both at a glance. Upstream tasks sit before the tasks that wait on them, chains of work read in one direction, and a task with nothing left above it is one you can start.

## Features

- **Plain Markdown all the way**: nodes and arrows come straight from the Tasks plugin's `id` and `dependsOn` fields in your notes, and every edit on the canvas is an edit to those lines. No database and no hidden file format.
- **Edit dependencies on the canvas**: drag from one node to another to add a dependency, select an arrow and press Delete to remove it. The change is written into the task lines in your notes.
- **Drag out to create a task**: drop a connection on empty canvas and Task Flow adds a blank `new task` linked to the node you dragged from, writes it into the same note, and opens it in a side pane with its name selected so you can type the real name straight away.
- **Time axis**: order the graph by date, with tasks that share a date lined up and a ruler along the edge of the view that marks each task's date and stretches to fit the tasks in between.
- **Click a node to open its note**: the note opens in a side pane at the task's exact line.
- **Auto layout in four directions**: top to bottom, bottom to top, left to right or right to left, with curved, straight or stepped arrows.
- **File filters with saved presets**: limit the graph to some folders or hide some folders, show done or open tasks, and save each combination under a name.
- **Node style**: choose colors and font size, render task text as Markdown, and optionally color and size nodes by priority.
- **Auto refresh and auto layout**: each on its own timer, so the graph keeps up with edits you make elsewhere in the vault.

## Requirements

- The [Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) community plugin, installed and enabled.
- Tasks that reference each other with the Tasks plugin's Dataview-style fields, `[id:: <id>]` and `[dependsOn:: <id1>,<id2>]`. Task Flow reads and writes this format only. The emoji format of the Tasks plugin, `🆔` and `⛔`, is not supported yet.

A small example that Task Flow turns into three connected nodes:

```markdown
- [ ] Write copy  [id:: copy]
- [ ] Design mockups  [id:: design]
- [ ] Build pages  [dependsOn:: design,copy]
```

## Installation

Manual install for now, until Task Flow clears review and lands in Obsidian's Community Plugins browser:

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/shenfan19/task-flow/releases).
2. Copy them into `<your-vault>/.obsidian/plugins/task-flow/`.
3. Reload Obsidian and enable **Task Flow** under Settings → Community plugins.

## Getting started

1. Click the Task Flow icon in the left ribbon, or run **Task Flow: Open Task Flow view** from the command palette. The graph opens in a new tab.
2. Open **View Control** on the left and click **Layout** to arrange the nodes, then **Overview** to fit the whole graph on screen.
3. Use **File Filters** to narrow the graph down to the project you are working on.

Everything is set from the three panels on the left side of the view, **File Filters**, **View Control** and **Node Style**. There is no separate settings page.

## Working with the graph

### Reading the graph

Each node is one task and each arrow points from a task to the task that depends on it. Finished tasks are shown faded and struck through. The graph flows in the layout direction you choose, so in the default top to bottom layout the work that has to happen first is at the top.

By default only tasks that have at least one dependency link are shown, since a vault can hold thousands of unrelated checkboxes. Turn off **Only show tasks with a relation** in **File Filters** to see every task.

### Moving around

- Drag the empty canvas to pan, and scroll to zoom.
- Drag a node to move it. Task Flow remembers where every node is, also after you close and reopen Obsidian.
- **Overview** fits the whole graph on screen without moving any node.
- **Layout** rearranges all nodes. Tick **every** next to it to repeat the layout automatically at the interval you set, in seconds. This keeps the graph tidy but moves nodes you placed by hand.

### Opening a task

Click a node and its note opens in a side pane, scrolled to the task's line. Later clicks reuse the same pane, and you can drag that pane anywhere in your workspace like any other Obsidian tab.

### Adding and removing dependencies

Every node has a connection point on each of its four sides. Drag from one of them onto another node to make a dependency.

- Dragging from the downstream side of node A, which is the bottom in a top to bottom layout, or from either side of it, onto node B makes B depend on A. The arrow points from A to B.
- Dragging from the upstream side of node A, which is the top in a top to bottom layout, onto node B makes A depend on B. The arrow points back to A.

Task Flow writes the link into your notes as a `[dependsOn:: ]` field on the dependent task. If the other task does not have an `[id:: ]` yet, a short random id is generated and added to it.

To remove a dependency, click its arrow to select it and press Delete or Backspace. The id is removed from the `[dependsOn:: ]` field in the note.

![Connecting two tasks, then selecting the new arrow and deleting it](images_ai/connect-and-delete.gif)

### Creating a task by dragging out

Drag from a connection point and let go on empty canvas instead of on another node. Task Flow then

1. adds a new line `- [ ] new task` to the same note, right below the task you dragged from and below its subtasks, at the same indentation,
2. links the two tasks, following the same rule as for existing nodes, so a drag from the downstream side or from either side creates a task that depends on the original one, and a drag from the upstream side creates a task that the original one depends on,
3. places the new node where you let go, and
4. opens the note in the side pane with the words `new task` selected, so typing replaces them with the real name.

If the note already has a `new task`, the next one is called `new task 2`, then `new task 3`, and so on. If the Tasks plugin is set up with a global filter such as `#task`, the new line includes it, so the Tasks plugin recognizes it as a task. A very short drag is treated as a click and creates nothing.

![Dragging out of three nodes to create new tasks, each opening in the side pane](images_ai/drag-to-create.gif)

### Time axis

Tick **Time axis** in **View Control** to lay the graph out by date. Each task is placed by its done date if it is finished, otherwise by its scheduled date, otherwise by its due date. Tasks without any of these dates are placed by their dependencies alone.

- Tasks that share a date are lined up at the same height, or in the same column for a left to right layout.
- A task with a later date always comes after a task with an earlier date.
- A task comes after every task it depends on, unless their dates say otherwise. When undated tasks sit between two dated ones, they spread out evenly between them.
- The ruler along the edge of the view marks only the dates that tasks on the graph actually have, so it stays quiet. It is elastic, so the distance between two dates depends on how many tasks lie between them, not on the number of days. A red line marks today. When the dates span more than one year, each label includes the year.
- An arrow whose dependent task is dated earlier than the task it depends on is drawn in red, so a plan that contradicts its own dependencies stands out.
- A dated node can only be dragged sideways, since its position along the axis is its date. Undated nodes can be dragged anywhere.

With no dated task on the graph, the nodes are laid out by their dependencies and the ruler shows only today's line.

The time axis layout is applied when you click **Layout**, and each time the automatic layout runs.

![The same project laid out left to right without the time axis, using stepped arrows](images_ai/layout-lr.png)

### Filtering

**File Filters** decides which tasks appear on the graph.

- **Only show tasks with a relation**: hide tasks that have no dependency link in either direction. On by default.
- **Status**: show open tasks, done tasks, or both. Cancelled tasks count as done.
- **Directory Path**: tick folders in the tree, then choose **Include checked** to show only tasks in those folders or **Exclude checked** to show everything except them.
- **Presets**: type a name and click **Save** to store the current filter settings, then pick a preset from the list to switch back to it later. **Delete** removes the selected preset.

### Node style

**Node Style** sets the look of every node.

- **Background**, **Border** and **Text Color** set the node colors.
- **Font Size** sets the text size in pixels.
- **Rich text** renders each task's text as Markdown, so links, tags and formatting show up as they do in your notes. It is off by default, since rendering is slower on large graphs.
- **Color/size by priority** gives tasks with a priority set in the Tasks plugin their own border color and a larger or smaller node, from red and largest for the highest priority to grey and smallest for the lowest. Tasks with normal priority keep the colors above.

### Staying up to date

Task Flow reads tasks from the Tasks plugin. Click **Refresh** in **View Control** to reload them, or tick **every** next to it to reload automatically at the interval you set, 30 seconds by default. Refreshing only updates the tasks and arrows and never moves nodes that are already on the graph.

## Where Task Flow keeps its data

Task dependencies live only in your notes, as `[id:: ]` and `[dependsOn:: ]` fields. Node positions, filter presets and view settings are saved in `.obsidian/plugins/task-flow/data.json` inside your vault. Deleting that file resets the layout and settings but does not touch any task.

## License

MIT, see [LICENSE](LICENSE).
