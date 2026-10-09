# Changelog

## 0.11.0

### Added

- **Separate links** in **View**, off by default. When a task sits on or close to the straight line of a longer link, as b does between a and c with the links a to b, b to c and a to c, the three links lie on top of each other and the direction of the flow is hard to read. With it on, **Layout** moves such a task sideways, to about a third of its width from the long link, to the nearest side free of other nodes. Only a task with a link of its own along that line is moved; a link that merely passes behind a task, or runs diagonally well clear of the others, is left as it is. It is part of a profile.

## 0.10.1

### Fixed

- A tag added from the right-click menu is now written before the fields at the end of the task line, such as `[id:: ]`, `[dependsOn:: ]`, dates and priority, instead of after them. Written after them, the Tasks plugin stopped reading those fields and did not report the tag either, so the tag was not found.
- Tags are now also read from the task line itself, wherever they sit among the inline fields, in addition to the ones the Tasks plugin reports. The Tasks global filter is not taken for a tag.
- In a note saved with Windows line endings, an edit to a task line no longer lands after the line's carriage return, where it would show up on a new line. Adding a tag, setting a priority or id, creating a linked task and the **Edit task…** dialog keep the line ending of the line they change.

## 0.10.0

### Added

- Lanes by **File** and by **Priority**, as well as by tag. A file lane is one note, named by its file name, with the folder added when two notes share a name. Priority lanes go from Highest to Lowest with None last, in the colors of the priority chips.
- The command **Tasks Flowchart: Refresh tasks** reloads the tasks at once and can be given a hotkey.

### Changed

- The lane settings in **View** are split in two. **Group by** chooses **None**, **Tag**, **File** or **Priority**, and **Order** chooses **Auto**, **A-Z**, **Biggest first** or **Soft pull**. The old **Default** is now **None**, and lanes saved by tag in 0.9.0 are carried over. Priority lanes keep the order of the levels, so **A-Z** and **Biggest first** are not listed there. The **Lane tag** choice is removed: a task with several tags always goes in the lane of the tag most tasks share.
- In **View**, the two lists at the top now have names, **Direction** and **Link**, and **Date axis** is the last item. The **Refresh** button is gone from the panel, replaced by the command above.
- **Keywords** in **Filters** starts on **Include**, like the other filters, instead of **Exclude**. Saved filters and profiles that already have keywords keep the mode they had, which was Exclude.

## 0.9.0

### Added

- **Tag lanes** in **View**: **Lanes, auto order**, **Lanes, A-Z**, **Lanes, biggest first** and **Soft pull to tag** group tasks of the same tag into one column, or one row in a left to right layout, with a tinted band and the tag's name for each lane. **Default** keeps the layout as before. **Lane tag** picks which tag of a task decides its lane: the most common, the rarest or the first. Lanes only move nodes across the flow direction, so the date axis is unchanged. Tag lanes are part of a profile and are applied at **Layout**.

### Changed

- The keyword box under **Filters** is now **Keywords**, with **Include** and **Exclude** like Tags, Priority and Directory Path. **Exclude**, the default, hides tasks whose text or tags contain any keyword as before. **Include** shows only those tasks. Keywords are matched in the task text and tags, not in fields such as id or dependsOn.
- The **Include checked** and **Exclude checked** options in **Filters** are now just **Include** and **Exclude**.
- In the **Priority** filter, **None** follows the other levels on the same row instead of standing apart, to save space. The right-click **Priority** menu still lists it apart at the end.
- In **Filters**, **Status** and **Only show tasks with a relation** are moved to the end of the panel, below **Directory Path**, so they are not clicked by mistake.

### Removed

- The **Search tasks** box under the **Layout** buttons, with its lit matches and the Enter and Shift+Enter jump between them. **Keywords** in **Filters** replaces it. Unlike the search it matches the task text and tags only, not the note path, and it hides the other tasks instead of fading them.

## 0.8.0

### Added

- **Priority** filter in **File Filters**, like the tag filter: click the levels to check them, then choose **Include checked** or **Exclude checked**. None is listed last, apart from the other levels.
- The right-click menu works on a multiple selection. Shift-drag a box or select several nodes, then right-click the box or one of the selected nodes to **Highlight**, **Focus chain**, **Add tag**, **Remove tag** or set **Priority** on all of them at once.
- **Highest** and **Lowest** have a font size and a background of their own in **Node Style**.
- **Show link counts** in **Node Style**, off by default. Each node shows `depend N`, the number of tasks it depends on, where its arrows come in, and `next N`, the number of tasks that depend on it, where they go out. Every link is counted, whether or not the filters show the task at its other end.

### Changed

- The node right-click menu is in two groups. **Highlight**, **Focus chain**, **Add tag**, **Remove tag** and **Priority** come first, and below a line **Open note**, **Edit task…** and **Change id…**.
- In the **Priority** menu, **None** is listed last, below a line.
- **Focus chain** on several nodes keeps all their chains at full strength together.

## 0.7.1

### Changed

- The plugin list description is shortened to one sentence. The details are in the README.

## 0.7.0

### Added

- **Add tag** and **Remove tag** in the node right-click menu. **Add tag** lists the tags already used in your notes and ends with **New tag…** to type a new one. The tag is written to the task's line in its note, before any block link.
- **Priority** in the node right-click menu, with Highest, High, Medium, None, Low and Lowest. The line is changed in the format it already uses, Dataview field or emoji.
- Right-click a tag in the filter panel and choose **Remove … from all tasks** to take it off every task of the view. A dialog first says how many tasks and notes it will edit, and each note is written once.

## 0.6.0

### Added

- **Search** box in the frame with **Layout**, **Overview** and **Reset**. Tasks whose text, tags or note path contain every word typed are lit and the rest fade. **Enter** and **Shift+Enter** step through the matches, and a **×** in the box clears it.
- The canvas zooms out to 2%, and below 30% the task text and tags are hidden so that only each node's size and color show.
- An **X** at the top right of the Tasks edit dialog when Obsidian shows no close button there, beside the Tasks settings gear.

## 0.5.1

### Changed

- **Open task** is now **Open note** in the node right-click menu and in the **Click** and **Double-click** choices of View Control, and the arrow menu entries read **Open upstream note** and **Open downstream note**. They open the note, and the old name was easy to mistake for **Edit task**.

## 0.5.0

### Added

- **Line width** and **Arrow size** in Node Style, two sliders for the links. The arrowhead keeps its size when the line gets thicker, and a highlighted link is drawn a little thicker than the others.

### Changed

- Presets are now **profiles**. A profile keeps the File Filters, View Control and Node Style together, so choosing one switches all three at once. **Save** stores the current settings in the selected profile, and a `*` after its name shows that any of them changed since the last save. Switching to a profile with another layout direction, link type or date axis setting lays the graph out again. Node positions, the pan and zoom of the canvas, highlights and focus are shared by all profiles.
- Each preset becomes a profile of the same name on update. It keeps its filters and takes the view settings and style in use at that moment, so nothing changes on screen. Profiles are saved under a new key in `data.json`, so going back to an earlier version leaves only the Default preset.
- **Profile** is a row of its own under **Layout**, **Overview** and **Reset**, with no frame, and those three buttons now sit in a frame without a title.
- **View Control** starts folded, like the other cards.
- **Time axis** is now **Date axis** and is on for new installs. A saved choice is kept.
- The README states that **Reset** only clears highlights and focus, and leaves node positions, the pan and zoom and the profile as they are.

## 0.4.2

### Fixed

- Letting go of a drag anywhere on another task links the two tasks. Before, the drop had to land close to one of that task's connection points, and a drop on the middle of a task did nothing.

### Changed

- The README shows three new demos: editing a task and placing it on the time axis, linking and creating tasks, and focus and highlight.

## 0.4.1

### Added

- An empty canvas says why nothing is showing: the Tasks plugin is missing, there are no tasks yet, no task is linked yet, or the filters hide every task. Where it helps, it offers **Show all tasks** and **Create sample note**.
- **Create sample note**, on the empty canvas and as a command, writes a small linked plan into the vault with ids, dependencies, dates, priorities and tags, opens it beside the graph and lays out its tasks.
- **New task** in View Control sets what happens to a task made by dragging onto empty canvas: **Edit task** fills it in with the Tasks edit dialog, and **Open note** opens the note with `untitled` selected, as before.

### Changed

- A task made by dragging onto empty canvas opens in the Tasks edit dialog by default.

## 0.4.0

### Added

- **Edit task…** in a node's right-click menu opens the task in the Tasks plugin's own edit dialog, to change its name and tags, priority, dates, status, recurrence and dependencies without leaving the graph. It needs Tasks 7.21.0 or later. If the task's line changes in its note while the dialog is open, the edit is not saved, so nothing written in the note is lost.
- **Change id…** in a node's right-click menu gives a task a new id and changes every dependsOn that names the old one, in both the Dataview and the emoji format.
- **Edit task** as a choice for **Click** and **Double-click** in View Control.
- The README describes selecting several nodes: Shift and drag for a box, Ctrl or Cmd and click to add one at a time.

### Changed

- A double click edits the task by default. A double click left at **Open task** changes to **Edit task** once on update; Open task stays in the right-click menu and can be chosen again in View Control.

## 0.3.1

### Added

- Highlights and focus are kept when the view is closed and opened again. A focused task that no longer shows is dropped.
- The canvas reopens panned and zoomed to where it was left. If the view is a different size than then, for example with a note open beside it, the graph is shifted so that what was in the middle stays in the middle.
- A **Reset** button next to Layout and Overview, and a **Reset, clear highlights and focus** command, remove every highlight and the focus at once.

## 0.3.0

### Added

- Right-clicking a node or an arrow offers **Highlight**, or **Remove highlight** when it is already lit.
- **Clear all highlights** and **Clear focus** in the right-click menus of nodes, arrows and empty canvas, when there is something to clear.
- **Select** for **Click** and **Double-click** in View Control, and the default for Click. A selected node has an outline in the Border color.

### Fixed

- An arrow kept the Highlight color after its highlight was removed, and kept a dark gray after being deselected.

### Changed

- Highlight is a mark that stays until it is removed. Clicking empty canvas no longer clears it, and opening a task no longer highlights it.
- Highlighting a node lights up the node only, not its arrows.
- **Highlight** is no longer a choice for Click and Double-click, since it is now a mark set from the right-click menu. A click saved as Highlight becomes Select.
- **Layout** keeps the zoom and leaves fitting the graph to **Overview**. The view stays where it is, or pans to put the selected task in the middle.
- On the time axis, a task that is not done is placed by its due date first, then its scheduled date, then its start date. Due used to come after scheduled, and start dates were not read.
- Tasks always reload when a note changes and every 30 seconds, so the auto refresh checkbox and interval are gone from View Control. **Refresh** is still there for reloading by hand.
- **Node Style** puts **Border** with **Highlight**, **Text** with **Background**, and **Size** on its own line, all applying to every node, and below them a **Priority** table with High for highest and high priority, Medium, and Low for low and lowest priority. Medium used to share the look of tasks with no priority.
- The cards separate their groups of controls with lines, and **Layout** and **Overview** no longer sit in a frame.
- The ribbon button has a new icon, and the flowchart tab shows the same icon instead of the default one.

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
