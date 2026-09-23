# Task Flowchart

**Task Flowchart turns your [Tasks plugin](https://github.com/obsidian-tasks-group/obsidian-tasks) dependencies into an interactive node graph**, so you can see task dependency chains, blockers, and what's actually ready to work on — instead of scrolling a flat checklist.

If you already tag tasks with the Tasks plugin's `🆔` and `⛔` (dependsOn) metadata, Task Flowchart reads that graph and draws it for you: drag nodes around, auto-arrange them, draw or delete dependency links directly on the canvas, click through to the source note, and filter down to the project you're actually looking at.

## Features

- **Dependency graph, not a to-do list** — nodes and arrows are derived live from the Tasks plugin's own `id`/`dependsOn` fields; a task can depend on multiple upstream tasks.
- **Edit dependencies on the canvas** — drag from one node to another to create a real `🆔`/`⛔` link in the underlying files (generating an id for the source task if it doesn't have one yet); select an edge and press Delete to remove it. This isn't a separate diagram format — it edits the same metadata the Tasks plugin already reads.
- **Interactive canvas** — drag nodes freely; positions persist. One-click auto-layout (dagre) in four directions (top-to-bottom, bottom-to-top, left-to-right, right-to-left), with a choice of bezier, straight, or stepped edges.
- **Click a node, open the file** — jumps straight to the task's line in a side-by-side pane; drag it back into your main view like any other Obsidian tab.
- **File Filters with saved presets** — scope the graph to specific folders (include or exclude mode), filter by done/to-do, toggle whether unrelated tasks are hidden, and save named presets to jump between projects.
- **Customizable node appearance** — background, border and text color, font size, and an optional rich-text (Markdown) rendering mode for long task descriptions with links.
- **Priority-aware styling** — optionally color and size nodes by the Tasks plugin's priority markers, so the most important blockers stand out at a glance.
- **Auto-refresh & auto-layout** — both live in the View Control panel, independently toggleable with their own interval, so the graph can stay current with edits made elsewhere in the vault without you reopening it.

## Requirements

- The [Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) community plugin, installed and enabled.
- Tasks that reference each other using Tasks' own `🆔 <id>` and `⛔ <id>` syntax. Task Flowchart doesn't invent a new dependency format — it reads and writes the one you're already using.

## Installation

Manual installation, until Task Flowchart is available in Obsidian's Community Plugins browser:

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest Release](https://github.com/shenfan19/flowy-task/releases).
2. Copy them into `<your-vault>/.obsidian/plugins/task-flowchart/`.
3. Reload Obsidian and enable **Task Flowchart** under Settings → Community plugins.

## Usage

- Click the Task Flowchart ribbon icon (or run the **Open Task Flowchart view** command) to open the graph.
- The left-hand rail holds three panels — **File Filters**, **View Control**, and node appearance — everything lives in that one view, there's no separate settings screen to hunt for.

## Why a graph instead of a list?

A flat checklist can't show you *why* something is stuck. A dependency graph makes it visually obvious what's blocking what, what's safe to start right now, and where the actual critical path runs — the same reason project-management tools draw Gantt charts and dependency diagrams instead of plain lists.

## License

MIT — see [LICENSE](LICENSE).
