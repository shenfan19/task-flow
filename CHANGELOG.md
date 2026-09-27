# Changelog

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
