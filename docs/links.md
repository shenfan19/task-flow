# Links and new tasks

![Linking two tasks by dragging, creating a task that depends on one by dragging down onto empty canvas, creating a task that one depends on by dragging up, then clicking Layout](../images_ai/link-and-create.gif)

A link is a field on a task line in your note. Nothing is stored anywhere else, so every change here is an edit to the note.

## Link two tasks

Drag from a node's downstream side onto another node. That is the bottom in a top to bottom layout, and the left or right side in a left to right layout. The node you drop on now depends on the first one. Drag from the upstream side instead to make the first node depend on the other. A missing id is generated for you.

## Delete a link

Right-click an arrow and choose **Delete link**, or click the arrow and press Delete or Backspace.

## Create a linked task

Let go on empty canvas instead of on a node. A line `- [ ] untitled` is added below the original task and its subtasks, linked to it, and opened in the Tasks edit dialog to fill in. Which side you start from decides the direction of the new link.

- Downstream: start from the downstream side, the bottom in a top to bottom layout. The new task depends on the one you started from, and its arrow comes out of that task.
- Upstream: start from the upstream side, the top in a top to bottom layout. The task you started from depends on the new one, and the arrow comes into the task you started from.

The new task stays where you let go, also after you rename it. Click **Layout** afterwards to arrange it with the rest.

- New task: set it in **View** to **Open note** to open the new line in a side pane instead, with `untitled` selected so you can type the name right away.
- Numbering: further ones are called `untitled2`, `untitled3` and so on, one word each so that a double-click selects the whole name.
- Global filter: the Tasks plugin's global filter tag is added if you use one.

## Change an id

Right-click a node and choose **Change id…** to give the task a new id. Every task that depends on it is updated to the new id as well, the way renaming a note updates the links to it.

## What is written to your notes

- Linking: adds an id field to one task line and a dependency field to the other.
- Unlinking: removes that entry from the dependency list.
- Format: the emoji format `🆔` and `⛔`, or the Dataview format `[id:: ]` and `[dependsOn:: ]`, as set under **Task format** in **Style**. A field already on a line is edited in the style it has.
- Creating: inserts a new `- [ ] untitled` line below the task the connection started from.

Only the task lines involved are changed. There is no undo inside the flowchart. Obsidian's own undo works while the note is open in an editor, and the core File recovery plugin keeps snapshots you can go back to.

Back to the [manual](index.md).
