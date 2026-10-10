# Arranging the graph

![Dragging three tasks out of place, clicking Layout to put them back, then turning on the date axis](../images_ai/layout-date-axis.gif)

## Drag and Layout

Drag nodes freely and their positions are remembered. **Layout** arranges everything in the chosen direction, with curved, straight or stepped arrows, and keeps the zoom. The view stays where it is, or centers on the selected task if there is one. Layout runs only when you ask for it, so it never fights a node you just moved.

**Overview** fits the graph on screen. Both buttons sit at the top of the rail on the left. The commands **Tasks Flowchart: Layout** and **Tasks Flowchart: Overview, fit the graph in the view** do the same and can be given hotkeys in **Settings → Hotkeys**.

The direction, the arrow type and the other arranging options are in the **View** card. The steps Layout takes, and which links it can and cannot keep straight, are in [How Layout arranges nodes](layout_stability.md).

## Zoom out

The canvas zooms out to 2% so that a large graph fits on screen. Below 30% the task text and tags are hidden and only each node's size and color remain.

## Date axis

On by default, and turned off in **View**. Each task is placed by one date, which is the done date of a finished task, otherwise its due date, then its scheduled date, then its start date.

- Same date: tasks sharing a date line up on one level.
- Undated tasks: they fall between their neighbors.
- Ruler: it marks each task's date and stretches with the tasks in between, so a crowded week takes more room than an empty month.
- Today: a red line marks today.
- Backward link: a red arrow marks a task dated before one it depends on.
- Dragging: dated nodes can only be dragged sideways, because their place along the flow is their date.

A changed date moves the node at the next **Layout**.

## Separate links

Off by default, and turned on in **View**. When a task sits on or close to the straight line of a longer link, as b does between a and c with the links a to b, b to c and a to c, the three links lie on top of each other and the direction of the flow is hard to read. With this on, **Layout** moves such a task sideways, to about a third of its width from the long link, away from other nodes.

Only tasks that have a link of their own along that line are moved. A link that merely passes behind a task, or runs diagonally well clear of the others, is left as it is. Dragging a task back puts the links on top of each other again until the next **Layout**.

Back to the [manual](index.md).
