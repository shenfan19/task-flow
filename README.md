# Tasks Flowchart

[![Obsidian plugin](https://img.shields.io/badge/Obsidian-plugin-7C3AED?logo=obsidian&logoColor=white)](https://community.obsidian.md/plugins/task-flow)
[![Downloads](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fcommunity.obsidian.md%2Fapi%2Fv1%2Fplugins%2Ftask-flow&query=%24.downloads&label=downloads&logo=obsidian&logoColor=white&color=7C3AED)](https://community.obsidian.md/plugins/task-flow)
[![Latest release](https://img.shields.io/github/v/release/shenfan19/task-flow?sort=semver)](https://github.com/shenfan19/task-flow/releases/latest)
[![Minimum Obsidian version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fshenfan19%2Ftask-flow%2Fmain%2Fmanifest.json&query=%24.minAppVersion&label=min%20Obsidian&color=blue)](manifest.json)
[![License](https://img.shields.io/github/license/shenfan19/task-flow)](LICENSE)

**Tasks Flowchart** is a plugin for [Obsidian](https://obsidian.md) that draws your [Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) as a flowchart. Follow the flow of work along dependency chains, see what blocks what, link and create tasks by dragging, and keep everything as plain Markdown.

[中文说明](README_zh.md)

**Drop a connection on empty canvas to create a linked task.** It is written into your note and opened with its name selected.

![Dragging out of three nodes to create new tasks, each opening in the side pane](images_ai/drag-to-create.gif)

**Drag between two tasks to link them. Select an arrow and press Delete to unlink.**

![Connecting two tasks, then selecting the new arrow and deleting it](images_ai/connect-and-delete.gif)

**Turn on the time axis to order tasks by date.**

![Tasks Flowchart graph with the time axis turned on](images_ai/time-axis.png)

## Why Tasks Flowchart

- **Your plan stays plain Markdown.** Every node is a task line in your notes and every arrow is a field on that line. There is no database and no hidden file format, so the plan works in any editor, with git and sync, with Dataview and the Tasks plugin's own queries, and it is all still there if you uninstall Tasks Flowchart.
- **See what blocks what.** Upstream tasks come before the tasks that wait on them, and a task with nothing left above it is one you can start now.

Three lines like these become three connected nodes:

```markdown
- [ ] Write copy  [id:: copy]
- [ ] Design mockups  [id:: design]
- [ ] Build pages  [dependsOn:: design,copy]
```

## Getting started

1. Install and enable the [Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) plugin. Tasks Flowchart reads its Dataview-style fields `[id:: ]` and `[dependsOn:: ]`. The emoji format `🆔` and `⛔` is not supported yet.
2. Install Tasks Flowchart from **Settings → Community plugins → Browse**. To install manually, copy `main.js`, `manifest.json` and `styles.css` from the [latest release](https://github.com/shenfan19/task-flow/releases/latest) into `<your-vault>/.obsidian/plugins/task-flow/`.
3. Click **Open tasks flowchart** in the left ribbon, or run **Tasks Flowchart: Open flowchart**. In **View Control**, click **Layout**, then **Overview**.

All settings live in the three panels on the left of the view, **File Filters**, **View Control** and **Node Style**.

## Usage

- **Link**: drag from a node's downstream side, the bottom in a top to bottom layout, or from its left or right side onto another node. That node now depends on the first one. Drag from the upstream side instead to make the first node depend on the other. A missing `[id:: ]` is generated for you.
- **Unlink**: click an arrow and press Delete or Backspace.
- **Create**: let go on empty canvas instead of on a node. A line `- [ ] new task` is added below the original task and its subtasks, linked by the same rule, and opened in a side pane with `new task` selected. Further ones are numbered, and the Tasks plugin's global filter tag is added if you use one.
- **Open**: click a node to open its note at the task's line.
- **Arrange**: drag nodes freely, and their positions are remembered. **Layout** arranges everything in the chosen direction with curved, straight or stepped arrows, once or on a timer, and **Overview** fits the graph on screen.
- **Time axis**: each task is placed by its done, scheduled or due date. Tasks sharing a date line up, undated tasks fall between their neighbors, and the ruler marks each task's date and stretches with the tasks in between. A red line marks today, a red arrow marks a task dated before one it depends on, and dated nodes can only be dragged sideways.
- **Filter**: in **File Filters**, show only tasks with a dependency link, which is on by default, hide tasks containing keywords such as `archived on`, and filter by status, tag or folder. Filters are kept between sessions and can be saved as named presets.
- **Style**: in **Node Style**, set colors and font size, render task text as Markdown, show tags as chips with automatic colors, and color and size nodes by priority.
- **Refresh**: tasks reload every 30 seconds by default, or with **Refresh** in **View Control**. Refreshing and automatic layout wait while you drag.

## Troubleshooting

A task missing from the graph usually has no dependency link, and **Only show tasks with a relation** hides such tasks by default. Otherwise check the keyword, status, tag and folder filters, and check that the Tasks plugin indexes the line, which requires the Tasks global filter tag if you set one.

Tasks Flowchart reads `[id:: ]`, `[dependsOn:: ]` and date fields anywhere on the line, so links survive text that archiving plugins append after them. The Tasks plugin only reads fields at the end of a line, so its own queries see no id, dependencies or dates on such a task.

## Data

Dependencies live only in your notes. Node positions, filters, presets and view settings are saved in `.obsidian/plugins/task-flow/data.json`. Deleting that file resets the layout and settings without touching any task.

## Development

The project requires Node.js 22 or later. `npm install` and `npm run build` write `main.js`, `manifest.json` and `styles.css` to `dist/`. Releases are built and published by GitHub Actions from a version tag, and the steps are described at the top of `.github/workflows/release.yml`.

## License

MIT, see [LICENSE](LICENSE).
