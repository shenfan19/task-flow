# Editing tasks

![Double-clicking a task, setting its priority and due date in the Tasks edit dialog, then clicking Layout to move it along the date axis](../images_ai/edit-task.gif)

Everything on this page changes the task line in its note, in the format the line already uses.

## Edit

Double-click a node, or right-click it and choose **Edit task…**, to edit the task in the Tasks plugin's own dialog. It covers the name and tags, priority, dates, status, recurrence and dependencies, and needs Tasks 7.21.0 or later. Click outside the dialog to close it without saving, or use the **X** at its top right, which Tasks Flowchart adds beside the Tasks settings gear when Obsidian shows no close button there.

## Tags

Right-click a node and choose **Add tag** to pick one of the tags already used in your notes, or **New tag…** at the bottom of that list to type a new one. **Remove tag** lists the task's own tags. A new tag is written before the fields at the end of the line, such as `[id:: ]`, so the Tasks plugin still reads them.

Right-click a tag in the filter panel and choose **Remove … from all tasks** to take it off every task of the view. A confirmation says how many tasks and notes it touches.

## Priority

Right-click a node and choose **Priority** to pick Highest, High, Medium, Low or Lowest, with None apart at the end. The line is changed in the format it already uses, `[priority:: high]` or the emoji, and a task without a priority gets the `[priority:: …]` field.

## Open the note

Right-click a node and choose **Open note** to open its note in a side pane with the cursor at the end of the task's name, ready to type. A name still left as `untitled` is selected instead, so typing replaces it. Right-click an arrow to open the note at either end.

**Click** and **Double-click** in **View** set what each does to a node. The choices are **Select**, **Focus chain**, **Open note** and **Edit task**. By default a click selects and a double-click edits.

## Several nodes at once

Shift-drag a box around nodes, or select several, then right-click the box or one of the selected nodes. **Highlight**, **Focus chain**, **Add tag**, **Remove tag** and **Priority** then apply to all of them. **Open note**, **Edit task…** and **Change id…** are only in the menu of a single node.

## Refresh

The graph follows your edits. A few seconds after you change a task line and the note is saved, its node shows the new text in the same place. A changed date moves the node on the date axis at the next **Layout**. Tasks also reload every 30 seconds, or at once with the command **Tasks Flowchart: Refresh tasks**, and refreshing waits while you drag.

Back to the [manual](index.md).
