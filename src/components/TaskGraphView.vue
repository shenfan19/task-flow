<template>
  <div class="position-relative w-100 h-100 ft-graph-root">
    <!-- Left rail: the Layout and Overview buttons, then the Profile row,
         view controls, filters and node appearance -->
    <div class="ft-left-rail">
      <ActionBar
        @layout="onLayoutClick"
        @overview="onOverviewClick"
        @reset="resetMarks"
      />
      <ProfileBar @layout="onLayoutClick" />
      <FilterPanel />
      <ViewControlPanel
        @direction-change="onLayoutDirectionChange"
        @edge-type-change="onEdgeTypeChange"
        @time-axis-change="onTimeAxisChange"
        @separate-links-change="onTimeAxisChange"
        @lane-change="onLaneChange"
      />
      <AppearancePanel />
    </div>

    <!-- Graph Container (Full Size) -->
    <div class="w-100 h-100 bg-white ft-graph-container" :class="{ 'ft-lod': zoomedFarOut }" :style="{ '--ft-highlight': taskStore.appearance.highlightColor, '--ft-select': taskStore.appearance.nodeBorder }">
      <VueFlow
        :nodes="nodes"
        :edges="edges"
        :default-edge-options="defaultEdgeOptions"
        :delete-key-code="DELETE_KEYS"
        :zoom-on-double-click="false"
        :min-zoom="MIN_ZOOM"
        :max-zoom="MAX_ZOOM"
        :node-types="NODE_TYPES"
        class="w-100 h-100"
        @node-click="onNodeClick"
        @node-double-click="onNodeDoubleClick"
        @node-context-menu="onNodeContextMenu"
        @selection-context-menu="onSelectionContextMenu"
        @edge-context-menu="onEdgeContextMenu"
        @pane-click="clearFocus"
        @move-end="onMoveEnd"
        @pane-context-menu="onPaneContextMenu"
        @node-drag-start="onNodeDragStart"
        @node-drag="onNodeDrag"
        @node-drag-stop="onNodeDragStop"
        @connect="onConnect"
        @connect-start="onConnectStart"
        @connect-end="onConnectEnd"
        @edges-change="onEdgesChange"
      >
        <Background />
        <EmptyState
          v-if="emptyReason"
          :reason="emptyReason"
          @show-all="taskStore.filters.onlyRelated = false"
          @sample="openSampleNote"
        />
        <LaneBands
          v-if="taskStore.viewSettings.laneBy !== 'none' && taskStore.laneInfo?.lanes"
          :info="taskStore.laneInfo"
        />
        <TimeAxisRuler
          v-if="taskStore.viewSettings.timeAxis && taskStore.timeAxisInfo?.anchors"
          :info="taskStore.timeAxisInfo"
        />
      </VueFlow>
    </div>
  </div>
</template>

<script setup>
import { computed, markRaw, onMounted, onUnmounted, ref, watch } from 'vue';
import { VueFlow, MarkerType, useVueFlow } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import { useTaskStore, isPlaceholderTaskName } from '../store';
import { MarkdownView, Menu, MenuItem } from 'obsidian';
import { getApp } from '../pluginContext';
import { onViewCommand } from '../viewCommands';
import ActionBar from './ActionBar.vue';
import ProfileBar from './ProfileBar.vue';
import FilterPanel from './FilterPanel.vue';
import ViewControlPanel from './ViewControlPanel.vue';
import AppearancePanel from './AppearancePanel.vue';
import TaskFlowNode from './TaskFlowNode.vue';
import TimeAxisRuler from './TimeAxisRuler.vue';
import EmptyState from './EmptyState.vue';
import { createSampleNote, takePendingSampleLayout } from '../utils/sampleNote';
import { TasksPluginAPI } from '../api/TasksPluginAPI';
import { layoutWithDagre, layoutWithTimeAxis, separateOverlappingLinks } from '../utils/layout';
import { applyLanes } from '../utils/lanes';
import LaneBands from './LaneBands.vue';
import { promptName } from '../utils/promptName';
import { isValidTaskId, normalizeTag, PRIORITY_LEVELS_NONE_LAST, NONE_PRIORITY } from '../utils/taskLineEdits';

const taskStore = useTaskStore();
const { fitView, findNode, getSelectedNodes, setCenter, screenToFlowCoordinate, viewport, dimensions, setViewport } = useVueFlow();

// When the canvas changes size, most often because a note opens in a side
// pane next to it, the view is shifted by half the change so that the point
// at the center stays at the center. The zoom is left alone: closing the
// pane shifts back by the same amount, so the view returns to where it was
// even if the user zoomed or panned in between.
let lastSize = null;
watch(
  () => [dimensions.value.width, dimensions.value.height],
  ([width, height]) => {
    const previous = lastSize;
    if (!width || !height) return;
    lastSize = { width, height };
    if (!previous) return;
    const { x, y, zoom } = viewport.value;
    setViewport({
      x: x + (width - previous.width) / 2,
      y: y + (height - previous.height) / 2,
      zoom
    });
  }
);

// Vue Flow only listens for Backspace by default; Delete is what most
// people reach for first to remove a selected edge.
const DELETE_KEYS = ['Backspace', 'Delete'];

// Node components are registered here rather than through a
// <template #node-task> slot. A slot is a new function each time this view
// renders, and Vue Flow took each new one for a different component, so
// every render, a click's highlight included, unmounted and remounted every
// node. That replaced the element under the pointer between the two clicks
// of a double click, so the browser never reported a double click.
const NODE_TYPES = { task: markRaw(TaskFlowNode) };

const defaultEdgeOptions = {
  markerEnd: MarkerType.ArrowClosed
};

// Highlight: nodes and edges the user has marked, {nodeIds, edgeIds}, drawn
// with a glowing outline in the Highlight color. A mark stays until it is
// removed from a right-click menu, whatever else is clicked in between, and
// marking a node lights up that node only, not its links. Selection is
// separate: a click selects, and clicking empty canvas deselects.
const highlight = ref({ nodeIds: new Set(), edgeIds: new Set() });

const hasHighlight = () => highlight.value.nodeIds.size > 0 || highlight.value.edgeIds.size > 0;

// Focus: a node's whole chain, everything it depends on and everything that
// depends on it, {nodeIds, edgeIds} kept at full strength while the rest
// fades. Chosen from a node's menu, cleared by clicking empty canvas. Null
// for no focus. focusIds are the nodes the chains were taken from, several
// when the focus was set on a multiple selection.
const focus = ref(null);
const focusIds = ref([]);

const clearFocus = () => {
  focus.value = null;
  focusIds.value = [];
};

const clearHighlight = () => {
  highlight.value = { nodeIds: new Set(), edgeIds: new Set() };
};

// Marks or unmarks one node (set 'nodeIds') or edge (set 'edgeIds').
const setHighlight = (set, id, on) => {
  const next = {
    nodeIds: new Set(highlight.value.nodeIds),
    edgeIds: new Set(highlight.value.edgeIds)
  };
  if (on) next[set].add(id);
  else next[set].delete(id);
  highlight.value = next;
};

// Walks the visible edges from `id` both ways.
const chainOf = (id) => {
  const nodeIds = new Set([id]);
  const edgeIds = new Set();
  const walk = (from, forward) => {
    const stack = [from];
    while (stack.length) {
      const current = stack.pop();
      for (const edge of taskStore.filteredEdges) {
        const [here, there] = forward ? [edge.source, edge.target] : [edge.target, edge.source];
        if (here !== current) continue;
        edgeIds.add(edge.id);
        if (!nodeIds.has(there)) {
          nodeIds.add(there);
          stack.push(there);
        }
      }
    }
  };
  walk(id, true);
  walk(id, false);
  return { nodeIds, edgeIds };
};

// Focuses the chains of all the given nodes together.
const focusChains = (ids) => {
  const nodeIds = new Set();
  const edgeIds = new Set();
  for (const id of ids) {
    const chain = chainOf(id);
    chain.nodeIds.forEach((n) => nodeIds.add(n));
    chain.edgeIds.forEach((e) => edgeIds.add(e));
  }
  focus.value = { nodeIds, edgeIds };
  focusIds.value = [...ids];
};

const focusChain = (id) => focusChains([id]);

// Reset clears every highlight and the focus: the button at the top of the
// rail and the Reset command.
const resetMarks = () => {
  clearHighlight();
  clearFocus();
};

// Highlight and focus are kept in data.json, so closing and reopening the
// view brings them back. Saving starts once they have been restored, so
// the empty state of a view that is still loading never overwrites them.
let marksRestored = false;

watch([highlight, focusIds], () => {
  if (!marksRestored) return;
  taskStore.setMarks({
    highlightNodes: [...highlight.value.nodeIds],
    highlightEdges: [...highlight.value.edgeIds],
    focusIds: focusIds.value
  });
});

// Called once the tasks are loaded, since the focused chain is worked out
// from their links. A focused task that no longer shows is dropped.
const restoreMarks = () => {
  const { highlightNodes = [], highlightEdges = [], focusIds: savedFocus = [], focusId: legacyFocus = null } = taskStore.marks ?? {};
  highlight.value = { nodeIds: new Set(highlightNodes), edgeIds: new Set(highlightEdges) };
  // focusId is how a single focus was saved up to 0.7.1.
  const visible = new Set(taskStore.filteredTasks.map((t) => t.id));
  const kept = (savedFocus.length ? savedFocus : [legacyFocus]).filter((id) => id && visible.has(id));
  if (kept.length) focusChains(kept);
  marksRestored = true;
};

// Class names for a node or edge from the current highlight and focus.
const markClasses = (set, id) => [
  highlight.value[set].has(id) ? 'ft-glow' : '',
  focus.value && !focus.value[set].has(id) ? 'ft-faded' : ''
].filter(Boolean).join(' ');

// Zoom range. Vue Flow stops at 0.5 by default, too near for a graph of
// hundreds of tasks. Below LOD_ZOOM the text and tags are hidden, leaving
// each node's size and color, since text that small cannot be read anyway.
const MIN_ZOOM = 0.02;
const MAX_ZOOM = 2;
const LOD_ZOOM = 0.3;
const zoomedFarOut = computed(() => viewport.value.zoom < LOD_ZOOM);

const nodes = computed(() =>
  taskStore.filteredTasks.map((task) => ({
    id: task.id,
    type: 'task',
    position: task.position,
    data: { task },
    class: markClasses('nodeIds', task.id)
  }))
);

// Which pair of handles (see TaskFlowNode.vue's 4 sides) an edge should use.
// The axis follows the layout direction setting: TB/BT only ever use the
// top/bottom handles, LR/RL only left/right, so every edge in the graph runs
// the same way. Picking the nearest side per edge instead mixed the two axes
// (a far-sideways edge in a TB layout would leave from a left/right handle),
// which is what made curves bend oddly and cross each other.
const HANDLES_BY_DIRECTION = {
  right: { source: 'right-source', target: 'left-target' },
  left: { source: 'left-source', target: 'right-target' },
  bottom: { source: 'bottom-source', target: 'top-target' },
  top: { source: 'top-source', target: 'bottom-target' }
};

// Along the layout axis, closer than this (px, top-left to top-left) counts
// as "same row/column" — only reachable by dragging nodes by hand, since
// dagre always puts a dependency's two ends in different ranks. Forcing the
// layout axis there would loop the edge back on itself, so fall back to the
// cross axis for just that edge.
const SAME_RANK_TOLERANCE = 30;

const pickHandles = (sourcePos, targetPos, layoutDirection) => {
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;
  const vertical = layoutDirection === 'TB' || layoutDirection === 'BT';
  const useVertical = vertical
    ? Math.abs(dy) >= SAME_RANK_TOLERANCE
    : Math.abs(dx) < SAME_RANK_TOLERANCE;
  const direction = useVertical
    ? (dy >= 0 ? 'bottom' : 'top')
    : (dx >= 0 ? 'right' : 'left');
  return HANDLES_BY_DIRECTION[direction];
};

// On the time axis, an edge whose dependent task is dated earlier than the
// task it depends on points backwards in time; drawn red so a plan that
// contradicts its own dependencies stands out. Only real dates count, not
// the estimated placement of undated tasks.
const BACKWARD_EDGE_COLOR = '#d32f2f';

const edges = computed(() => {
  const taskById = new Map(taskStore.filteredTasks.map((t) => [t.id, t]));
  const layoutDirection = taskStore.viewSettings.layoutDirection;
  const timeAxis = taskStore.viewSettings.timeAxis;
  return taskStore.filteredEdges.map((edge) => {
    const source = taskById.get(edge.source);
    const target = taskById.get(edge.target);
    const handles = source && target
      ? pickHandles(source.position, target.position, layoutDirection)
      : HANDLES_BY_DIRECTION.bottom;
    const backward = timeAxis && source?.day != null && target?.day != null && target.day < source.day;
    // A highlighted edge takes the Highlight color, arrowhead included;
    // otherwise a backward edge on the time axis is red.
    const glow = highlight.value.edgeIds.has(edge.id);
    const color = glow ? taskStore.appearance.highlightColor : backward ? BACKWARD_EDGE_COLOR : null;
    // Line width and arrow size from Style; a highlighted edge is drawn
    // a little thicker. Vue Flow sizes the arrowhead in units of the line
    // width, so dividing by it keeps the arrow at arrowSize px on screen.
    const { edgeWidth = 1, arrowSize = 12.5 } = taskStore.appearance;
    const strokeWidth = glow ? edgeWidth + 1.5 : edgeWidth;
    const markerSize = arrowSize / strokeWidth;
    const marker = { type: MarkerType.ArrowClosed, width: markerSize, height: markerSize };
    return {
      ...edge,
      // Both are always set, the plain values included: Vue Flow merges an
      // updated edge into the one it already has, so a property left out
      // keeps its old value, and an edge once drawn in a color kept it.
      style: color ? { stroke: color, strokeWidth } : { strokeWidth },
      markerEnd: color ? { ...marker, color } : marker,
      sourceHandle: handles.source,
      targetHandle: handles.target,
      // Set directly on the edge (not via default-edge-options) because Vue
      // Flow only applies default-edge-options the first time an edge id is
      // created; switching the dropdown afterwards would otherwise silently
      // do nothing to edges that already exist.
      type: taskStore.viewSettings.edgeType,
      class: markClasses('edgeIds', edge.id)
    };
  });
});

// Reused across clicks so opening several tasks doesn't spawn a new split
// each time; if the user closes that leaf, getLeafById stops finding it and
// a fresh split is created on the next click.
let fileLeaf = null;

// Opens `path` in the reused side split at `line`, in source mode, and puts
// the cursor on `text` in that line: with `select` the text is selected,
// ready to be typed over, otherwise the cursor goes to its end. When `text`
// is not on the line, the cursor goes to the end of the line instead.
// `waitForText` is for a line that was just written, see below.
const openInSidePane = async (path, line, { text, select = false, waitForText = false } = {}) => {
  const app = getApp();
  if (!app) return;
  const file = app.vault.getAbstractFileByPath(path);
  if (!file) return;

  const workspace = app.workspace;
  if (!fileLeaf || !workspace.getLeafById(fileLeaf.id)) {
    fileLeaf = workspace.getLeaf('split', 'vertical');
  }

  // The jump to the line is done below instead of through eState: if the
  // note is already open, its editor picks up a freshly written line a
  // moment after the write, and a jump by line number before that lands on
  // whatever line used to be there.
  await fileLeaf.openFile(file, { state: { mode: 'source' } });

  const editor = fileLeaf.view?.editor;
  if (!editor || line === undefined) return;
  const attempts = waitForText ? EDITOR_SYNC_ATTEMPTS : 1;
  let ch = -1;
  for (let attempt = 0; attempt < attempts && ch === -1; attempt++) {
    if (line < editor.lineCount() && text) ch = editor.getLine(line).indexOf(text);
    if (ch === -1 && attempt + 1 < attempts) {
      await new Promise((resolve) => activeWindow.setTimeout(resolve, EDITOR_SYNC_INTERVAL_MS));
    }
  }
  if (line >= editor.lineCount()) return;
  if (ch === -1 && waitForText) return;

  const end = ch === -1
    ? { line, ch: editor.getLine(line).length }
    : { line, ch: ch + text.length };
  const from = select && ch !== -1 ? { line, ch } : end;
  const to = end;
  workspace.setActiveLeaf(fileLeaf, { focus: true });
  editor.setSelection(from, to);
  editor.scrollIntoView({ from, to }, true);
  editor.focus();
  // The pointer release that ended the click or drag, or the graph reacting
  // to the side pane opening, can take focus back to the canvas a moment
  // later. Focus is set again once things settle, unless the user has
  // already moved to another pane or the selection changed.
  activeWindow.setTimeout(() => {
    if (workspace.getActiveViewOfType(MarkdownView) !== fileLeaf.view) return;
    const selection = editor.listSelections()[0];
    const unchanged = selection
      && selection.anchor.line === from.line && selection.anchor.ch === from.ch
      && selection.head.line === to.line && selection.head.ch === to.ch;
    if (unchanged && !editor.hasFocus()) editor.focus();
  }, REFOCUS_DELAY_MS);
};

const REFOCUS_DELAY_MS = 150;

// How long openInSidePane waits for an already open editor to show a line
// that was just written: 40 checks, 50 ms apart.
const EDITOR_SYNC_ATTEMPTS = 40;
const EDITOR_SYNC_INTERVAL_MS = 50;

// Clicking a node opens its note with the cursor on the task's name, so the
// user can type straight away. A name still left as the placeholder given
// to new tasks is selected, to be typed over; any other name gets the
// cursor at its end, so a stray key press cannot wipe it out.
const openTask = async (id) => {
  const task = taskStore.filteredTasks.find((t) => t.id === id);
  if (!task) return;
  await openInSidePane(task.path, task.originalTask?.taskLocation?.lineNumber, {
    text: task.name,
    select: isPlaceholderTaskName(task.name)
  });
};

// Click and Double-click in View each pick one of: select only,
// focus the node's chain, open its note, or edit it in the Tasks plugin's
// dialog. Every click also selects, which Vue Flow does on its own. By
// default a click only selects and a double click edits. The browser sends
// two clicks before every double click, so the click action always runs
// first. Highlight is not among them: it is a mark that stays, set from the
// right-click menu.
const runNodeAction = async (action, id) => {
  if (action === 'focus') focusChain(id);
  else if (action === 'open') await openTask(id);
  else if (action === 'edit') await taskStore.editTaskInModal(id);
};

// Asks for a task's new id, filled in with the current one, and changes it
// along with every dependsOn that names it.
const promptChangeId = async (id) => {
  const task = taskStore.tasks.find((t) => t.id === id);
  const app = getApp();
  if (!task || !app) return;
  const newId = await promptName(app, {
    title: task.pluginId ? 'Change id' : 'Set id',
    value: task.pluginId,
    placeholder: 'id',
    submitText: 'Save',
    emptyText: 'Enter an id.',
    validate: (value) => {
      if (!isValidTaskId(value)) return 'Use only letters, digits, - and _.';
      if (value !== task.pluginId && taskStore.tasks.some((t) => t.pluginId === value)) return 'Another task already has this id.';
      return null;
    }
  });
  if (newId && newId !== task.pluginId) await taskStore.changeTaskId(id, newId);
};

// Sets or clears the highlight on several nodes at once.
const setNodesHighlight = (ids, on) => {
  const next = {
    nodeIds: new Set(highlight.value.nodeIds),
    edgeIds: new Set(highlight.value.edgeIds)
  };
  for (const id of ids) {
    if (on) next.nodeIds.add(id);
    else next.nodeIds.delete(id);
  }
  highlight.value = next;
};

// A menu entry that opens a submenu built by `build`. Obsidian's submenu
// call is missing from its public typings and from older versions, so
// without it the entries go into the main menu under a greyed-out heading.
const addSubmenu = (menu, title, icon, build) => {
  if (typeof MenuItem.prototype.setSubmenu !== 'function') {
    menu.addSeparator();
    menu.addItem((item) => item.setTitle(title).setIcon(icon).setDisabled(true));
    build(menu);
    menu.addSeparator();
    return;
  }
  menu.addItem((item) => {
    item.setTitle(title).setIcon(icon);
    build(item.setSubmenu());
  });
};

// The tag and priority entries work on one or several tasks, `ids` being
// the node ids of the right-clicked node or of the whole selection.
const tasksOf = (ids) => ids.map((id) => taskStore.tasks.find((t) => t.id === id)).filter(Boolean);

const forEachTask = async (tasks, action) => {
  for (const task of tasks) await action(task);
};

// Asks for a new tag and puts it on the tasks.
const promptNewTag = async (ids) => {
  const app = getApp();
  if (!app) return;
  const text = await promptName(app, {
    title: 'New tag',
    placeholder: '#tag',
    submitText: 'Add',
    emptyText: 'Enter a tag.',
    validate: (value) => (normalizeTag(value) ? null : 'Use letters, digits, - _ and /, not only digits, no spaces.')
  });
  const tag = text && normalizeTag(text);
  if (tag) await forEachTask(tasksOf(ids), (task) => taskStore.addTagToTask(task.id, tag));
};

const addTagItems = (menu, ids) => {
  const tasks = tasksOf(ids);
  if (!tasks.length) return;
  addSubmenu(menu, 'Add tag', 'tag', (sub) => {
    for (const tag of taskStore.allTags.filter((t) => tasks.some((task) => !task.tags.includes(t)))) {
      sub.addItem((item) => item.setTitle(tag).onClick(() => forEachTask(tasks, (task) => taskStore.addTagToTask(task.id, tag))));
    }
    sub.addSeparator();
    sub.addItem((item) => item.setTitle('New tag…').setIcon('plus').onClick(() => promptNewTag(ids)));
  });
  const present = [...new Set(tasks.flatMap((task) => task.tags))];
  if (!present.length) return;
  addSubmenu(menu, 'Remove tag', 'tag', (sub) => {
    for (const tag of present) {
      sub.addItem((item) => item.setTitle(tag).onClick(() => forEachTask(
        tasks.filter((task) => task.tags.includes(tag)),
        (task) => taskStore.removeTagFromTask(task.id, tag)
      )));
    }
  });
};

// None is listed last, below a line of its own. A level is checked when
// every task has it.
const addPriorityItems = (menu, ids) => {
  const tasks = tasksOf(ids);
  if (!tasks.length) return;
  addSubmenu(menu, 'Priority', 'flag', (sub) => {
    for (const level of PRIORITY_LEVELS_NONE_LAST) {
      if (level.value === NONE_PRIORITY) sub.addSeparator();
      sub.addItem((item) => item
        .setTitle(level.label)
        .setChecked(tasks.every((task) => task.priority === level.value))
        .onClick(() => forEachTask(tasks, (task) => taskStore.setTaskPriority(task.id, level.value))));
    }
  });
};

const onNodeClick = (event) => runNodeAction(taskStore.viewSettings.clickAction, event.node.id);

const onNodeDoubleClick = (event) => runNodeAction(taskStore.viewSettings.doubleClickAction, event.node.id);

// Clearing entries at the end of the node, edge and canvas menus, shown
// only when there is something to clear.
const addClearItems = (menu, separate = true) => {
  if (!hasHighlight() && !focus.value) return;
  if (separate) menu.addSeparator();
  if (hasHighlight()) menu.addItem((item) => item.setTitle('Clear all highlights').setIcon('eraser').onClick(clearHighlight));
  if (focus.value) menu.addItem((item) => item.setTitle('Clear focus').setIcon('eraser').onClick(clearFocus));
};

// Highlight, or Remove highlight on an edge that is already lit.
const addHighlightItem = (menu, set, id) => {
  const on = highlight.value[set].has(id);
  menu.addItem((item) => item
    .setTitle(on ? 'Remove highlight' : 'Highlight')
    .setIcon('sparkles')
    .onClick(() => setHighlight(set, id, !on)));
};

// The menu of one node, or of every node in a multiple selection. The marking
// and editing entries come first: Highlight, Focus chain, tags and priority.
// A line follows, then the entries that open or rewrite one task, which a
// selection of several does not get.
const showNodesMenu = (event, ids) => {
  const menu = new Menu();
  const lit = ids.every((id) => highlight.value.nodeIds.has(id));
  menu.addItem((item) => item
    .setTitle(lit ? 'Remove highlight' : 'Highlight')
    .setIcon('sparkles')
    .onClick(() => setNodesHighlight(ids, !lit)));
  menu.addItem((item) => item.setTitle('Focus chain').setIcon('focus').onClick(() => focusChains(ids)));
  addTagItems(menu, ids);
  addPriorityItems(menu, ids);
  if (ids.length === 1) {
    menu.addSeparator();
    menu.addItem((item) => item.setTitle('Open note').setIcon('file-text').onClick(() => runNodeAction('open', ids[0])));
    menu.addItem((item) => item.setTitle('Edit task…').setIcon('pencil').onClick(() => runNodeAction('edit', ids[0])));
    menu.addItem((item) => item.setTitle('Change id…').setIcon('hash').onClick(() => promptChangeId(ids[0])));
  }
  addClearItems(menu);
  menu.showAtMouseEvent(event);
};

// Right-clicking a node that is part of a multiple selection acts on the
// whole selection; any other node acts on itself alone.
const onNodeContextMenu = ({ event, node }) => {
  event.preventDefault();
  const selected = getSelectedNodes.value.map((n) => n.id);
  showNodesMenu(event, selected.length > 1 && selected.includes(node.id) ? selected : [node.id]);
};

// Right-clicking the box drawn around a shift-drag selection.
const onSelectionContextMenu = ({ event, nodes: selectedNodes }) => {
  event.preventDefault();
  if (selectedNodes.length) showNodesMenu(event, selectedNodes.map((n) => n.id));
};

const onEdgeContextMenu = ({ event, edge }) => {
  event.preventDefault();
  const menu = new Menu();
  addHighlightItem(menu, 'edgeIds', edge.id);
  menu.addSeparator();
  menu.addItem((item) => item.setTitle('Open upstream note').setIcon('arrow-up').onClick(() => openTask(edge.source)));
  menu.addItem((item) => item.setTitle('Open downstream note').setIcon('arrow-down').onClick(() => openTask(edge.target)));
  menu.addSeparator();
  menu.addItem((item) => item.setTitle('Delete link').setIcon('trash').onClick(() => {
    setHighlight('edgeIds', edge.id, false);
    taskStore.disconnectTasks(edge.source, edge.target);
  }));
  addClearItems(menu);
  menu.showAtMouseEvent(event);
};

// Right-clicking empty canvas offers only the clearing entries.
const onPaneContextMenu = (event) => {
  event.preventDefault();
  if (!hasHighlight() && !focus.value) return;
  const menu = new Menu();
  addClearItems(menu, false);
  menu.showAtMouseEvent(event);
};

// With the time axis on, a dated node's coordinate along the flow direction
// is its date, so dragging it only moves it sideways: the along-axis
// coordinate is put back to the stored one on every drag step, not just when
// the drag ends. Undated nodes move freely.
const lockAlongAxis = (node) => {
  if (!taskStore.viewSettings.timeAxis || !taskStore.timeAxisInfo) return;
  const task = taskStore.tasks.find((t) => t.id === node.id);
  if (!task || task.day == null) return;
  const direction = taskStore.timeAxisInfo.direction;
  if (direction === 'TB' || direction === 'BT') node.position.y = task.position.y;
  else node.position.x = task.position.x;
};

// True while a node is being dragged or a connection is being drawn. The
// refresh and layout timers skip their tick then, since replacing the nodes
// or moving them mid-gesture would cancel what the user is doing.
let nodeDragging = false;
const isInteracting = () => nodeDragging || pendingDrag !== null;

const onNodeDragStart = () => {
  nodeDragging = true;
};

const onNodeDrag = (event) => {
  (event.nodes ?? [event.node]).forEach(lockAlongAxis);
};

const onNodeDragStop = (event) => {
  nodeDragging = false;
  lockAlongAxis(event.node);
  taskStore.updateTaskPosition(event.node.id, event.node.position.x, event.node.position.y);
};

const runAutoLayout = () => {
  // Vue Flow measures each node's actual rendered box after mount; feeding
  // that real width/height in (rather than one fixed size for every node) is
  // what keeps a TB/BT column properly centered regardless of how long each
  // task's text is.
  const layoutNodes = nodes.value.map((node) => {
    const graphNode = findNode(node.id);
    return {
      ...node,
      day: node.data.task.day,
      tags: node.data.task.tags,
      path: node.data.task.path,
      priority: node.data.task.priority,
      width: graphNode?.dimensions?.width,
      height: graphNode?.dimensions?.height
    };
  });
  const { layoutDirection, timeAxis, laneBy, laneMode } = taskStore.viewSettings;
  // With no dated task at all the time axis still lays out and shows a
  // ruler, starting from today; nothing on it is tied to a real date then.
  const timed = timeAxis ? layoutWithTimeAxis(layoutNodes, edges.value, layoutDirection) : null;
  const base = timed ? timed.positions : layoutWithDagre(layoutNodes, edges.value, layoutDirection);
  // Lanes only move nodes across the flow direction, so the time axis
  // computed above stays valid.
  const laned = applyLanes(base, layoutNodes, edges.value, layoutDirection, laneBy, laneMode);
  // With Separate links on, a node sitting on or near a longer link between
  // its two ends is moved aside, so the links do not lie on top of each other.
  const placed = taskStore.viewSettings.separateLinks
    ? separateOverlappingLinks(laned.positions, layoutNodes, edges.value, layoutDirection)
    : laned.positions;
  placed.forEach(({ id, x, y }) => taskStore.updateTaskPosition(id, x, y));
  taskStore.setTimeAxisInfo(timed ? timed.info : null);
  taskStore.setLaneInfo(laned.info);
};

// Layout only arranges the nodes and leaves the zoom alone; fitting the
// graph in the view is Overview's job. The view keeps its center, unless a
// task is selected: then it pans to put that task in the middle, so the
// task being worked on stays in sight after the nodes move. Layout only
// runs when asked for, a changed date included: a layout on a timer made
// the whole graph jump every few seconds, and saved every node's position
// each time.
const onLayoutClick = () => {
  runAutoLayout();
  const selected = getSelectedNodes.value[0];
  const task = selected && taskStore.tasks.find((t) => t.id === selected.id);
  if (!task) return;
  const { width = 0, height = 0 } = selected.dimensions ?? {};
  void setCenter(task.position.x + width / 2, task.position.y + height / 2, { zoom: viewport.value.zoom });
};

const onLayoutDirectionChange = (value) => {
  taskStore.updateViewSettings({ layoutDirection: value });
  onLayoutClick();
};

const onTimeAxisChange = (partial) => {
  taskStore.updateViewSettings(partial);
  onLayoutClick();
};

const onLaneChange = (partial) => {
  // Priority lanes keep their level order, so A-Z and Biggest first, which
  // the Order list greys out there, fall back to Auto.
  const order = partial.laneMode ?? taskStore.viewSettings.laneMode;
  const next = partial.laneBy === 'priority' && (order === 'alpha' || order === 'size')
    ? { ...partial, laneMode: 'auto' }
    : partial;
  taskStore.updateViewSettings(next);
  onLayoutClick();
};

const onEdgeTypeChange = (value) => {
  taskStore.updateViewSettings({ edgeType: value });
  onLayoutClick();
};

// Each node has a handle on all four sides; which way a drag out of one
// points depends on the layout direction. The handle on the downstream side
// (e.g. bottom in TB) and the two on the cross sides mean "a task that comes
// after this one"; the upstream side (top in TB) means "a task this one
// depends on", so the arrow ends up pointing back at the node dragged from.
const UPSTREAM_SIDE_BY_DIRECTION = { TB: 'top', BT: 'bottom', LR: 'left', RL: 'right' };

const isUpstreamHandle = (handleId) =>
  handleId?.split('-')[0] === UPSTREAM_SIDE_BY_DIRECTION[taskStore.viewSettings.layoutDirection];

// The drag currently in progress, from connect-start to connect-end:
// {nodeId, upstream, x, y, connected}.
let pendingDrag = null;

const eventPoint = (event) => {
  const p = event?.changedTouches?.[0] ?? event?.touches?.[0] ?? event;
  return p && p.clientX !== undefined ? { x: p.clientX, y: p.clientY } : null;
};

const onConnectStart = ({ event, nodeId, handleId }) => {
  const point = eventPoint(event);
  pendingDrag = { nodeId, upstream: isUpstreamHandle(handleId), connected: false, ...point };
};

// Dragging a connection from node A to node B out of a downstream or side
// handle means "B depends on A" (matches filteredEdges' own source=blocker,
// target=blocked convention); out of A's upstream handle it means "A depends
// on B". Writes real id/dependsOn tags back to the source files, it isn't a
// canvas-only edit.
const onConnect = (connection) => {
  const upstream = pendingDrag?.nodeId === connection.source && pendingDrag.upstream;
  if (pendingDrag) pendingDrag.connected = true;
  if (upstream) taskStore.connectTasks(connection.target, connection.source);
  else taskStore.connectTasks(connection.source, connection.target);
};

// Shorter drags than this (screen px) are treated as a click on the handle,
// not as a request for a new task.
const MIN_NEW_TASK_DRAG = 30;

// A drag that ends on empty canvas instead of another node creates a blank
// "untitled" linked to the node it started from, placed where it was
// dropped, and opens it in the side pane with its name selected for editing.
const onConnectEnd = async (event) => {
  const drag = pendingDrag;
  pendingDrag = null;
  if (!drag || drag.connected || drag.x === undefined) return;
  const end = eventPoint(event);
  if (!end || Math.hypot(end.x - drag.x, end.y - drag.y) < MIN_NEW_TASK_DRAG) return;
  // What lies under the release point is looked up rather than taken from
  // event.target: a touchend's target is where the touch began, which is
  // the handle on the origin node, so on a phone every drag looked like it
  // ended on a node and no task was created.
  const dropTarget = activeDocument.elementFromPoint(end.x, end.y);
  // Let go anywhere on another node links to it. Vue Flow only reports a
  // connection when the drag ends close to one of that node's handles, so
  // a drop on the middle of a node was otherwise ignored.
  const targetNode = dropTarget?.closest?.('.vue-flow__node');
  if (targetNode) {
    const targetId = targetNode.dataset.id;
    if (targetId && targetId !== drag.nodeId) {
      if (drag.upstream) void taskStore.connectTasks(targetId, drag.nodeId);
      else void taskStore.connectTasks(drag.nodeId, targetId);
    }
    return;
  }

  const drop = screenToFlowCoordinate(end);
  const created = await taskStore.createLinkedTask(drag.nodeId, {
    upstream: drag.upstream,
    position: { x: drop.x - 60, y: drop.y - 15 }
  });
  if (!created) return;
  // New task in View: open the note with the placeholder name
  // selected, ready to be typed over, or edit the task in the Tasks dialog.
  if (taskStore.viewSettings.newTaskAction === 'edit') await taskStore.editTaskInModal(created.id);
  else await openInSidePane(created.path, created.lineNumber, { text: created.name, select: true, waitForText: true });
  // Picks up the Tasks plugin's own parse of the new line once it has
  // re-indexed the file; the node id is the same, so it stays where it is.
  activeWindow.setTimeout(() => taskStore.fetchTasksFromObsidian(), 1500);
};

// Selecting an edge and pressing Delete/Backspace (Vue Flow's built-in
// behavior) fires an edges-change with a "remove" entry; without this, the
// edge would just reappear on the next refresh since it's derived from the
// task's real dependsOn field, not from Vue Flow's own edge list.
const onEdgesChange = (changes) => {
  for (const change of changes) {
    if (change.type !== 'remove') continue;
    const [sourceId, targetId] = change.id.split('->');
    if (sourceId && targetId) taskStore.disconnectTasks(sourceId, targetId);
  }
};

const onOverviewClick = () => {
  fitView({ padding: 0.2 });
};

// The canvas remembers where it was panned and zoomed to. It is saved when
// a pan or zoom ends, once the saved one has been put back, so the default
// view of a canvas that is still opening never overwrites it.
let viewportRestored = false;

const onMoveEnd = () => {
  if (!viewportRestored) return;
  const { x, y, zoom } = viewport.value;
  const { width, height } = dimensions.value;
  taskStore.setSavedViewport({ x, y, zoom, width, height });
};

// Puts the saved view back. When the canvas is a different size than when
// it was saved, for example because a note is open beside it now, the view
// is shifted by half the difference, as on a resize, so what was in the
// middle stays in the middle.
const restoreViewport = async () => {
  const saved = taskStore.viewport;
  if (saved) {
    for (let i = 0; i < 20 && !dimensions.value.width; i++) {
      await new Promise((resolve) => activeWindow.setTimeout(resolve, 50));
    }
    const { width, height } = dimensions.value;
    setViewport({
      x: saved.x + (saved.width && width ? (width - saved.width) / 2 : 0),
      y: saved.y + (saved.height && height ? (height - saved.height) / 2 : 0),
      zoom: saved.zoom
    });
  }
  viewportRestored = true;
};

// Tasks reload as soon as the Tasks plugin reports a change, see
// scheduleCacheReload below. This timer re-reads its cache every so often
// as well, for any change that event misses. A reload only replaces the
// data: nodes keep their stored positions, so a task that did not change
// does not move or redraw.
const REFRESH_INTERVAL_MS = 30000;
let refreshTimer = null;

// Filters are edited in place by the filter panel's inputs rather than
// through store actions, so they are saved from here whenever they change.
watch(() => taskStore.filters, () => taskStore.saveState(), { deep: true });

// The Tasks plugin announces every change to its task cache, for example a
// few seconds after a task line is edited and the note saved. Reloading on
// that keeps node text in step with the notes without waiting for the
// periodic refresh. Bursts of updates are collapsed, and a reload is put
// off while a node or connection is being dragged.
const TASKS_CACHE_UPDATE_EVENT = 'obsidian-tasks-plugin:cache-update';
const CACHE_RELOAD_DELAY_MS = 300;
let cacheUpdateRef = null;
let cacheReloadTimer = null;

const scheduleCacheReload = () => {
  if (cacheReloadTimer) activeWindow.clearTimeout(cacheReloadTimer);
  cacheReloadTimer = activeWindow.setTimeout(() => {
    cacheReloadTimer = null;
    if (isInteracting()) {
      scheduleCacheReload();
      return;
    }
    taskStore.fetchTasksFromObsidian();
  }, CACHE_RELOAD_DELAY_MS);
};

// The Layout, Overview and Reset commands, see main.ts.
// Empty canvas: why nothing is on the graph, for EmptyState. Decided only
// a moment after the view opens, since the Tasks plugin may still be
// reading the vault then and the panel would flash up for nothing.
const EMPTY_STATE_DELAY_MS = 1500;
const settled = ref(false);
const emptyReason = computed(() => {
  if (!settled.value || taskStore.filteredTasks.length > 0) return null;
  const app = getApp();
  if (!app || !new TasksPluginAPI(app).isTasksPluginAvailable()) return 'no-plugin';
  if (taskStore.tasks.length === 0) return 'no-tasks';
  if (taskStore.filters.onlyRelated && !taskStore.tasks.some((t) => t.dependsOn.length > 0)) return 'no-links';
  return 'filtered';
});

// Writes the sample note, or finds the one already there, and opens it
// beside the graph. Its tasks are laid out once they show up, see below.
const openSampleNote = async () => {
  const app = getApp();
  if (!app) return;
  const file = await createSampleNote(app);
  await openInSidePane(file.path);
};

// A freshly written sample note's tasks arrive with no saved positions, so
// they are laid out and fitted in the view once the graph has drawn and
// measured them.
const SAMPLE_LAYOUT_DELAY_MS = 300;
watch(
  () => taskStore.tasks,
  (tasks) => {
    if (!takePendingSampleLayout(tasks)) return;
    activeWindow.setTimeout(() => {
      runAutoLayout();
      fitView({ padding: 0.2 });
    }, SAMPLE_LAYOUT_DELAY_MS);
  }
);

const stopViewCommands = onViewCommand((name) => {
  if (name === 'layout') onLayoutClick();
  else if (name === 'overview') onOverviewClick();
  else if (name === 'reset') resetMarks();
  else if (name === 'refresh') taskStore.fetchTasksFromObsidian();
  else if (name === 'sample') void openSampleNote();
});

onMounted(async () => {
  // Positions must load before tasks are built, since each task's starting
  // position is read from taskStore.positions at construction time.
  await taskStore.loadState();
  taskStore.fetchTasksFromObsidian();
  restoreMarks();
  await restoreViewport();

  refreshTimer = activeWindow.setInterval(() => {
    if (!isInteracting()) taskStore.fetchTasksFromObsidian();
  }, REFRESH_INTERVAL_MS);
  activeWindow.setTimeout(() => {
    settled.value = true;
  }, EMPTY_STATE_DELAY_MS);

  const app = getApp();
  if (app) cacheUpdateRef = app.workspace.on(TASKS_CACHE_UPDATE_EVENT, scheduleCacheReload);
});

onUnmounted(() => {
  stopViewCommands();
  void taskStore.flushState();
  const app = getApp();
  if (app && cacheUpdateRef) app.workspace.offref(cacheUpdateRef);
  if (cacheReloadTimer) activeWindow.clearTimeout(cacheReloadTimer);
  if (refreshTimer) activeWindow.clearInterval(refreshTimer);
});
</script>

<style scoped>
/* Bootstrap's w-100/h-100 classes above have no effect (no bootstrap.css
   loaded, see App.vue); these give the VueFlow container an actual
   pixel-resolvable height so it isn't 0 and can render. */
.ft-graph-root,
.ft-graph-container {
  height: 100%;
  width: 100%;
}

/* The button rail is positioned against the graph root; without this it is
   positioned against an outer Obsidian container instead and ends up over
   the view header (Bootstrap's position-relative class isn't loaded). */
.ft-graph-root {
  position: relative;
}

.ft-left-rail {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

/* Focus: everything outside the focused chain fades. Vue Flow puts a
   node's or edge's class on its own wrapper, outside this component, hence
   :deep. */
.ft-graph-container :deep(.vue-flow__node.ft-faded) {
  opacity: 0.25;
}

/* Far out: text and tags are hidden but keep their space, so every node
   stays the size it has up close. */
.ft-lod :deep(.ft-link-count),
.ft-lod :deep(.task-flow-node__label),
.ft-lod :deep(.task-flow-node__tags) {
  visibility: hidden;
}

.ft-graph-container :deep(.vue-flow__edge.ft-faded) {
  opacity: 0.15;
}

/* Selection: Vue Flow draws a selected edge in dark gray, and a selected
   task node gets an outline in the Border color. Vue Flow also draws a
   focused edge dark, but an edge keeps focus after a click until something
   else takes it, so it stayed dark after being deselected; only selection
   counts here. An edge with its own color, red on the time axis or the
   Highlight color, sets it inline and is not affected. */
.ft-graph-container :deep(.vue-flow__edge:not(.selected):focus .vue-flow__edge-path),
.ft-graph-container :deep(.vue-flow__edge:not(.selected):focus-visible .vue-flow__edge-path) {
  stroke: #b1b1b7;
}

.ft-graph-container :deep(.vue-flow__node.selected .task-flow-node) {
  outline: 2px solid var(--ft-select);
  outline-offset: 2px;
}

/* Highlight: a glowing outline in the Highlight color from Style,
   passed in as --ft-highlight; nothing else changes. */
.ft-graph-container :deep(.vue-flow__node.ft-glow .task-flow-node) {
  box-shadow: 0 0 0 2px var(--ft-highlight), 0 0 12px 2px var(--ft-highlight);
}

.ft-graph-container :deep(.vue-flow__edge.ft-glow .vue-flow__edge-path) {
  filter: drop-shadow(0 0 3px var(--ft-highlight));
}
</style>
