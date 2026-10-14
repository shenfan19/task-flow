# How selection and the pointer work

This page is for people reading or changing the code. The behavior itself is described in [Highlight and focus](highlight_focus.md) and [Editing tasks](editing.md). The code is in `src/components/TaskGraphView.vue`, `main.ts` and `src/viewCommands.ts`.

## What Vue Flow does and why it is not used for this

Vue Flow can select with a key held, Shift by default, and can add to a selection with another, Ctrl or Cmd by default. Both work through `useKeyPress`, which listens for `keydown` and `keyup` on the page and keeps a flag per key. When those events do not reach the page, the flags stay off and neither feature works, while ordinary clicks and drags still do. That happened in the setup that reported the bug, and it could not be reproduced in a clean vault.

A mouse event carries `shiftKey`, `ctrlKey` and `metaKey` for the keys held at that moment, whatever happened to the key events. The plugin therefore decides from the mouse event, and Vue Flow's own selection keys are never relied on.

## Pointer handlers

Four listeners sit on the graph container in the capture phase, so they run before Vue Flow's own handlers and can consume the event.

- pointerdown: with the left button and one of Shift, Ctrl or Cmd held, it acts and consumes the event. On a node it toggles that node in the selection. On empty canvas it starts a selection box. A press on a handle, an arrow or a panel is left alone.
- pointermove: copies the modifier state into `selectKeyHeld`, which turns the pointer into a crosshair.
- click and dblclick: the click that follows such a press is consumed too, so the node is not opened, focused or edited by the click that added it to the selection.

Consuming the pointerdown also stops the mouse events that the browser would send after it, which is what keeps Vue Flow from starting a pan or a node drag for the same press.

## Toggling a node

`toggleNodeSelection` reads the selected node ids, adds or removes the pressed one, and passes the result to `addSelectedNodes`, which replaces the whole selection. An empty result clears it.

When several nodes are selected Vue Flow draws a box around them that lies on top of the nodes, so a press there lands on the box and not on a node. `nodeAt` then looks through the box with `elementsFromPoint` and takes the first node element under the pointer.

## Selection box

`startSelectionBox` adds a `div` to the container and follows the pointer with `pointermove`, `pointerup` and `pointercancel` listeners on the window, removed again when the button is released. On release, every node element whose bounding rectangle touches the box is selected. A press that moved less than 3 pixels is a click on empty canvas and changes nothing.

The box is made at run time, so its style has to be written with `:deep()` in the scoped style block. A plain scoped rule does not reach it.

## Panning and zooming

Left and middle button drags on empty canvas pan and the wheel zooms, which are Vue Flow's defaults. An earlier attempt set `selection-key-code` to `true` so that the left button would select. Vue Flow then treated every press on the canvas as the start of a selection, and a selection that did not end cleanly blocked wheel zoom and made every pointer move expensive. The defaults are kept for that reason.

## Pointer shapes

Vue Flow puts a grab cursor on the canvas and on every node. The style block replaces them with the default arrow, and `.vue-flow__pane.dragging` keeps the grabbing hand while the canvas is dragged. The crosshair comes from the `ft-select-ready` class, set while `selectKeyHeld` is true.

## Esc

Obsidian answers an Esc that no handler used by switching to the previous tab. A document listener cannot prevent that, because Obsidian's own handler runs first. The view therefore registers Esc in its own key scope in `main.ts`, and the handler returns `false`, which tells Obsidian the key was used, only when the graph cleared a selection. The graph registers its handler through `onEscape` in `src/viewCommands.ts`, the same way commands reach it, and `runEscape` reports whether any handler used the key. With nothing selected the handler returns nothing and Obsidian behaves as it always did.

Vue Flow's keyboard handling of nodes is switched off with `disable-keyboard-a11y`, because its own Esc handler selected a node that had focus.

## Renaming a tag

`removeTagFromAllTasks(tag, newTag)` in `src/store/index.js` is the one function for removing and renaming. It groups the tasks that carry the tag by note, edits the lines of each note inside one `vault.process` call, and updates the tasks in memory and the tag filter. `renameTagInLine` in `src/utils/taskLineEdits.js` writes the new tag where the old one stood, or only removes the old one when the line already has the new tag, so no tag appears twice. The dialog in `FilterPanel.vue` asks for a confirmation first when the new name is already a tag.
