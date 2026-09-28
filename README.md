# Tasks Flowchart

[![Obsidian plugin](https://img.shields.io/badge/Obsidian-plugin-7C3AED?logo=obsidian&logoColor=white)](https://community.obsidian.md/plugins/task-flow)
[![Downloads](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fcommunity.obsidian.md%2Fapi%2Fv1%2Fplugins%2Ftask-flow&query=%24.downloads&label=downloads&logo=obsidian&logoColor=white&color=7C3AED)](https://community.obsidian.md/plugins/task-flow)
[![Latest release](https://img.shields.io/github/v/release/shenfan19/task-flow?sort=semver)](https://github.com/shenfan19/task-flow/releases/latest)
[![Minimum Obsidian version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fshenfan19%2Ftask-flow%2Fmain%2Fmanifest.json&query=%24.minAppVersion&label=min%20Obsidian&color=blue)](manifest.json)
[![License](https://img.shields.io/github/license/shenfan19/task-flow)](LICENSE)

**Tasks Flowchart** is a plugin for [Obsidian](https://obsidian.md) that draws your [Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) as a flowchart. Follow the flow of work along dependency chains, see what blocks what, link and create tasks by dragging, and keep everything as plain Markdown.

[中文说明](README_zh.md)

**Drop a connection on empty canvas to create a linked task.** It is written into your note and opened with its name selected.

![Dragging out of two nodes to create new tasks, each selected in the note beside the graph](images_ai/drag-to-create.gif)

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
3. Click **Open tasks flowchart** in the left ribbon, or run **Tasks Flowchart: Open flowchart**. Click **Layout** at the top left, then **Overview**.

All settings live in the cards on the left of the view, **Presets**, **View Control**, **File Filters** and **Node Style**, below the **Layout** and **Overview** buttons.

## Usage

- **Link**: drag from a node's downstream side, the bottom in a top to bottom layout, or from its left or right side onto another node. That node now depends on the first one. Drag from the upstream side instead to make the first node depend on the other. A missing `[id:: ]` is generated for you.
- **Unlink**: right-click an arrow and choose **Delete link**, or click it and press Delete or Backspace.
- **Create**: let go on empty canvas instead of on a node. A line `- [ ] untitled` is added below the original task and its subtasks, linked by the same rule, and opened in a side pane with `untitled` selected, so you can type the name right away. Further ones are numbered `untitled2`, `untitled3` and so on, one word each so a double-click selects the whole name, and the Tasks plugin's global filter tag is added if you use one.
- **Highlight**: click a node to give it and its arrows a glowing outline, or click an arrow to light up just that arrow. Nothing else on the graph changes. The color is **Highlight** in Node Style.
- **Focus**: right-click a node and choose **Focus chain** to keep its whole chain, every task it depends on and every task that depends on it, at full strength while the rest of the graph fades. Click empty canvas to clear the highlight and the focus.
- **Open**: double-click a node, or right-click it and choose **Open task**, to open its note in a side pane with the cursor at the end of the task's name, ready to type. A name still left as `untitled` is selected instead, so typing replaces it. **Click** and **Double-click** in View Control set what each does to a node, **Highlight**, **Focus chain** or **Open task**. By default a click highlights and a double click opens. Right-click an arrow to open the task at either end.
- **Commands**: **Tasks Flowchart: Layout** and **Tasks Flowchart: Overview, fit the graph in the view** do the same as the two buttons and can be given hotkeys in **Settings → Hotkeys**.
- **Arrange**: drag nodes freely, and their positions are remembered. **Layout** arranges everything in the chosen direction with curved, straight or stepped arrows, and **Overview** fits the graph on screen. Both buttons sit at the top of the rail on the left.
- **Time axis**: each task is placed by its done, scheduled or due date. Tasks sharing a date line up, undated tasks fall between their neighbors, and the ruler marks each task's date and stretches with the tasks in between. A red line marks today, a red arrow marks a task dated before one it depends on, and dated nodes can only be dragged sideways.
- **Filter**: in **File Filters**, show only tasks with a dependency link, which is on by default, hide tasks containing keywords such as `archived on`, and filter by status, tag or folder. Filters are kept between sessions.
- **Presets**: pick a saved set of filters in **Presets** to load it. **Save** stores the current filters in the selected preset, and **New…** saves them as a new one. **Default** is always there.
- **Style**: in **Node Style**, set the border and text colors, give high, normal and low priority tasks their own font size and background, render task text as Markdown, and show tags as chips with automatic colors.
- **Refresh**: the graph follows your edits. A few seconds after you change a task line and the note is saved, its node shows the new text in the same place. Tasks also reload every 30 seconds by default, or with **Refresh** in **View Control**, and refreshing waits while you drag.

## Troubleshooting

A task missing from the graph usually has no dependency link, and **Only show tasks with a relation** hides such tasks by default. Otherwise check the keyword, status, tag and folder filters, and check that the Tasks plugin indexes the line, which requires the Tasks global filter tag if you set one.

Tasks Flowchart reads `[id:: ]`, `[dependsOn:: ]` and date fields anywhere on the line, so links survive text that archiving plugins append after them. The Tasks plugin only reads fields at the end of a line, so its own queries see no id, dependencies or dates on such a task.

## Data

Dependencies live only in your notes. Node positions, filters, presets and view settings are saved in `.obsidian/plugins/task-flow/data.json`. Deleting that file resets the layout and settings without touching any task.

## Development

The project requires Node.js 22 or later. `npm install` and `npm run build` write `main.js`, `manifest.json` and `styles.css` to `dist/`. Releases are built and published by GitHub Actions from a version tag, and the steps are described at the top of `.github/workflows/release.yml`.

## License

MIT, see [LICENSE](LICENSE).
