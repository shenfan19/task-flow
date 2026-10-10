# Links and new tasks

![Linking two tasks by dragging, then creating a linked task by dragging onto empty canvas](../images_ai/link-and-create.gif)

A link is a field on a task line in your note. Nothing is stored anywhere else, so every change here is an edit to the note.

## Link two tasks

Drag from a node's downstream side onto another node. That is the bottom in a top to bottom layout, and the left or right side in a left to right layout. The node you drop on now depends on the first one. Drag from the upstream side instead to make the first node depend on the other. A missing `[id:: ]` is generated for you.

## Delete a link

Right-click an arrow and choose **Delete link**, or click the arrow and press Delete or Backspace.

## Create a linked task

Let go on empty canvas instead of on a node. A line `- [ ] untitled` is added below the original task and its subtasks, linked by the same rule, and opened in the Tasks edit dialog to fill in.

- New task: set it in **View** to **Open note** to open the new line in a side pane instead, with `untitled` selected so you can type the name right away.
- Numbering: further ones are called `untitled2`, `untitled3` and so on, one word each so that a double-click selects the whole name.
- Global filter: the Tasks plugin's global filter tag is added if you use one.

## Change an id

Right-click a node and choose **Change id…** to give the task a new id. Every task that depends on it is updated to the new id as well, the way renaming a note updates the links to it.

## What is written to your notes

- Linking: adds an `[id:: ]` field to one task line and a `[dependsOn:: ]` field to the other.
- Unlinking: removes that entry from `[dependsOn:: ]`.
- Creating: inserts a new `- [ ] untitled` line below the task the connection started from.

Only the task lines involved are changed. There is no undo inside the flowchart. Obsidian's own undo works while the note is open in an editor, and the core File recovery plugin keeps snapshots you can go back to.

Back to the [manual](index.md).
