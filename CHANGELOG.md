# Changelog

## 0.2.0

### Added

- Clicking a node gives it and its arrows a glowing outline, and clicking an arrow lights up that arrow, without changing anything else. The color is set with **Highlight** in Node Style.
- **Focus chain** in a node's right-click menu keeps the node's whole chain, every task it depends on and every task that depends on it, at full strength and fades the rest. Clicking empty canvas clears the highlight and the focus.
- Right-click menus. A node offers the same three actions as a click, **Highlight**, **Focus chain** and **Open task**, plus clearing the highlight and focus; an arrow offers opening the task at either end and **Delete link**.
- **Layout** and **Overview** commands, so both can be given hotkeys.
- **Click** and **Double-click** in View Control set what each does to a node: **Highlight**, **Focus chain**, or **Open task**, which opens it and highlights it. By default a click highlights and a double click opens.
- **Presets** is a card of its own at the top of the left rail and always open. Choosing a preset loads its filters, **Save** stores the current filters in it, and **New…** in the list asks for a name and saves the current filters as a new preset. A `*` after the name shows that the filters were changed since the last save.
- A **Default** preset that is always there and cannot be deleted. It starts from the filters in use when you update, so nothing changes on screen.
- **Node Style** sets a font size and a background for three priority tiers: High for highest and high priority, Normal for medium and no priority, Low for low and lowest priority.

### Changed

- Double-clicking the canvas no longer zooms in, since a double click on a node now has its own action. Zoom with the mouse wheel or a pinch.
- A task opens with a double click or from its right-click menu. A single click only highlights, so looking around the graph no longer opens notes.
- **Layout** and **Overview** are two highlighted buttons at the top of the rail, always in sight.
- **View Control** comes right after **Presets** and starts unfolded.
- The panels on the left are framed cards of the same width, each folded and unfolded from its title bar, and a long card scrolls inside itself.
- The layout direction and arrow style lists show a dropdown arrow, so they no longer look like buttons.
- **Time axis** sits below **Refresh** in View Control.
- In Node Style, each color and font size sits on the same line as its label.
- Rich text and tags are on by default.

### Removed

- Layout on a timer. Layout runs when you click **Layout**, so the graph no longer jumps every few seconds.
- **Color/size by priority**, replaced by the priority tiers. Priority no longer changes the border color.

### Fixed

- Positions and settings are saved at most once every half second, one write at a time. A layout used to save once per node, so a large vault could have hundreds of writes of `data.json` running at once, which left the file empty or cut short.
- The view opens even when `data.json` cannot be read. The unreadable file is copied to `data-unreadable-<time>.json` next to it, and the view starts with default settings instead of showing nothing.
- Disabling or updating the plugin stops the graph in open views. Before, a view could keep refreshing and saving from the old copy of the plugin until Obsidian was restarted.

## 0.1.8

### Fixed

- Dragging out of a node onto empty canvas creates a task on touch screens too. The end of a touch drag was always taken to be on the node it started from, so nothing was created on iPhone, iPad or Android.
- On touch screens the handles around a node are easier to grab with a finger, instead of a missed touch moving the node.

## 0.1.7

### Added

- Clicking a node puts the cursor at the end of the task's name in the note, so you can type right away. A name still left as `untitled` is selected, so typing replaces it.

### Changed

- A task created by dragging onto empty canvas is named `untitled`, numbered `untitled2`, `untitled3` and so on, instead of `new task`. Being one word, a double-click in the editor selects the whole name.
- When the view changes size, for example when a note opens beside it, the graph is shifted to keep its center in place instead of being rescaled. The zoom stays as it is, and closing the pane moves the graph back to where it was.

### Fixed

- The plugin loads on iPhone, iPad and Android. The bundle referred to Node's `process`, which only the desktop app provides, so on mobile it failed before anything was shown.
- The editor keeps focus on a newly created task's name, so typing replaces it straight away.

## 0.1.6

### Added

- Nodes follow edits to their task lines. The graph reloads whenever the Tasks plugin updates its task cache, a few seconds after a note is saved, instead of waiting for the periodic refresh.

### Fixed

- Renaming a task keeps its node where it was instead of moving it to a random spot.

## 0.1.5

### Added

- When the view changes size, for example when a note opens beside it, the graph is rescaled around its center so that everything that was visible stays visible.

### Fixed

- The File Filters, View Control and Node Style buttons stay inside the graph instead of overlapping the view header.
- Creating a task while its note is already open next to the graph now selects the new task's name, rather than highlighting the line that used to be there.

## 0.1.4

### Changed

- The plugin is now called **Tasks Flowchart**. The plugin id stays `task-flow`, so it updates in place and keeps your node positions, filters and settings.
- The view opens with the command **Tasks Flowchart: Open flowchart** or the ribbon icon **Open tasks flowchart**.

## 0.1.3

### Fixed

- Dependency and date fields are read anywhere on a task's line. Previously a task whose `[id:: ]` or `[dependsOn:: ]` field was followed by other text, such as the note an archiving plugin appends to finished tasks, lost its links and disappeared from the graph.

### Added

- **Exclude tasks containing** in File Filters hides every task whose line contains one of the given comma-separated keywords, for example `archived on`. Keywords are saved in filter presets.
- Filter settings are kept when the view is closed and reopened.

## 0.1.2

### Changed

- Requires Obsidian 1.7.2 or later, the first version where the API used to bring the graph view to the front can be awaited.
- Releases are built on GitHub Actions and carry artifact attestations, so each release can be verified against the source.

## 0.1.1

### Changed

- The graph view opens with the command **Task Flow: Open graph view** or the ribbon icon **Open task graph**.
- Periodic refresh and layout use Obsidian's window timers, so they also work when the view is in a popout window.
- The plugin reaches Obsidian through its own instance instead of the global `app` object.
- Requires Obsidian 1.5.1 or later.

## 0.1.0

- Initial release.
