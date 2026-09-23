# Task Flow

![GitHub release](https://img.shields.io/github/v/release/shenfan19/task-flow?sort=semver)
![License](https://img.shields.io/github/license/shenfan19/task-flow)
![Obsidian downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=downloads&query=%24%5B%22task-flow%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)

See your task dependencies as a graph, not a wall of checkboxes.

## How to install

Manual install for now, until Task Flow clears review and lands in Obsidian's Community Plugins browser:

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest Release](https://github.com/shenfan19/task-flow/releases).
2. Copy them into `<your-vault>/.obsidian/plugins/task-flow/`.
3. Reload Obsidian and enable **Task Flow** under Settings → Community plugins.

## Why Task Flow?

A flat task list can't show you *why* something is stuck. Once a project has more than a handful of tasks blocking each other, scrolling a checklist stops answering the two questions that actually matter:

- What's blocking what?
- What's actually safe to start right now?

Task Flow answers both at a glance, by drawing the dependency chains you've already tagged with the [Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) plugin's own `id`/`dependsOn` fields — no separate diagram to maintain, no second source of truth. Draw a new dependency by dragging between two nodes, delete one by selecting it and pressing Delete, and the underlying task metadata updates right along with it.

## Key Features

- **Reads your existing Tasks metadata** — nodes and arrows come straight from the Tasks plugin's `id`/`dependsOn` fields; a task can depend on more than one upstream task.
- **Edit dependencies on the canvas** — drag between nodes to create a link, select and delete to remove one. It writes back to the real task text, it isn't a canvas-only sketch.
- **One-click auto-layout** — four directions, plus a choice of bezier, straight, or stepped edges.
- **Click a node, open the file** — jumps to the task's exact line in a side pane you can drag back into your main view.
- **File Filters with saved presets** — scope by folder (include or exclude), by done/to-do, toggle whether unrelated tasks are hidden, and save named presets per project.
- **Node appearance you control** — colors, font size, an optional rich-text (Markdown) render mode, and optional color/size-by-priority.
- **Auto-refresh & auto-layout** — independently toggleable with their own interval, so the graph keeps up with edits made elsewhere without reopening the view.

<!-- TODO: add a screenshot of the graph view here before publishing -->

## Requirements

- The [Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) community plugin, installed and enabled.
- Tasks that reference each other using Tasks' Dataview-style syntax: `[id:: <id>]` and `[dependsOn:: <id1>,<id2>]`. Task Flow doesn't invent a new dependency format — it reads and writes the one you're already using.

## Usage

Click the Task Flow ribbon icon (or run **Open Task Flow view**) to open the graph. The left-hand rail holds three panels — **File Filters**, **View Control**, and node appearance — everything lives in that one view, there's no separate settings screen to dig through.

## License

MIT — see [LICENSE](LICENSE).
