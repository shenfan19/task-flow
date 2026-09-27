<template>
  <div class="position-relative w-100 h-100 ft-graph-root">
    <!-- Left button rail: filters, view controls, node appearance -->
    <div class="ft-left-rail">
      <FilterPanel />
      <ViewControlPanel
        @overview="onOverviewClick"
        @layout="onLayoutClick"
        @direction-change="onLayoutDirectionChange"
        @edge-type-change="onEdgeTypeChange"
        @time-axis-change="onTimeAxisChange"
      />
      <AppearancePanel />
    </div>

    <!-- Graph Container (Full Size) -->
    <div class="w-100 h-100 bg-white ft-graph-container">
      <VueFlow
        :nodes="nodes"
        :edges="edges"
        :default-edge-options="defaultEdgeOptions"
        :delete-key-code="DELETE_KEYS"
        class="w-100 h-100"
        @node-click="onNodeClick"
        @node-drag-start="onNodeDragStart"
        @node-drag="onNodeDrag"
        @node-drag-stop="onNodeDragStop"
        @connect="onConnect"
        @connect-start="onConnectStart"
        @connect-end="onConnectEnd"
        @edges-change="onEdgesChange"
      >
        <template #node-task="taskNodeProps">
          <TaskFlowNode v-bind="taskNodeProps" />
        </template>
        <Background />
        <TimeAxisRuler
          v-if="taskStore.viewSettings.timeAxis && taskStore.timeAxisInfo?.anchors"
          :info="taskStore.timeAxisInfo"
        />
      </VueFlow>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue';
import { VueFlow, MarkerType, useVueFlow } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import { useTaskStore } from '../store';
import { getApp } from '../pluginContext';
import FilterPanel from './FilterPanel.vue';
import ViewControlPanel from './ViewControlPanel.vue';
import AppearancePanel from './AppearancePanel.vue';
import TaskFlowNode from './TaskFlowNode.vue';
import TimeAxisRuler from './TimeAxisRuler.vue';
import { layoutWithDagre, layoutWithTimeAxis } from '../utils/layout';

const taskStore = useTaskStore();
const { fitView, findNode, screenToFlowCoordinate, viewport, dimensions, setViewport } = useVueFlow();

// When the canvas changes size, most often because a note opens in a side
// pane next to it, the view is rescaled around its center so that what was
// visible stays visible instead of disappearing past the new edge.
const MIN_RESIZE_PX = 20;
let lastSize = null;
watch(
  () => [dimensions.value.width, dimensions.value.height],
  ([width, height]) => {
    const previous = lastSize;
    if (!width || !height) return;
    lastSize = { width, height };
    if (!previous) return;
    if (Math.abs(width - previous.width) < MIN_RESIZE_PX && Math.abs(height - previous.height) < MIN_RESIZE_PX) return;
    const { x, y, zoom } = viewport.value;
    const centerX = (previous.width / 2 - x) / zoom;
    const centerY = (previous.height / 2 - y) / zoom;
    const nextZoom = zoom * Math.min(width / previous.width, height / previous.height);
    setViewport({ x: width / 2 - centerX * nextZoom, y: height / 2 - centerY * nextZoom, zoom: nextZoom });
  }
);

// Vue Flow only listens for Backspace by default; Delete is what most
// people reach for first to remove a selected edge.
const DELETE_KEYS = ['Backspace', 'Delete'];

const defaultEdgeOptions = {
  markerEnd: MarkerType.ArrowClosed
};

const nodes = computed(() =>
  taskStore.filteredTasks.map((task) => ({
    id: task.id,
    type: 'task',
    position: task.position,
    data: { task }
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
    return {
      ...edge,
      ...(backward && {
        style: { stroke: BACKWARD_EDGE_COLOR },
        markerEnd: { type: MarkerType.ArrowClosed, color: BACKWARD_EDGE_COLOR }
      }),
      sourceHandle: handles.source,
      targetHandle: handles.target,
      // Set directly on the edge (not via default-edge-options) because Vue
      // Flow only applies default-edge-options the first time an edge id is
      // created; switching the dropdown afterwards would otherwise silently
      // do nothing to edges that already exist.
      type: taskStore.viewSettings.edgeType
    };
  });
});

// Reused across clicks so opening several tasks doesn't spawn a new split
// each time; if the user closes that leaf, getLeafById stops finding it and
// a fresh split is created on the next click.
let fileLeaf = null;

// Opens `path` in the reused side split at `line`. With `selectText`, that
// text on the line is selected in source mode, ready to be typed over.
const openInSidePane = async (path, line, selectText) => {
  const app = getApp();
  if (!app) return;
  const file = app.vault.getAbstractFileByPath(path);
  if (!file) return;

  const workspace = app.workspace;
  if (!fileLeaf || !workspace.getLeafById(fileLeaf.id)) {
    fileLeaf = workspace.getLeaf('split', 'vertical');
  }

  // For a freshly written line the jump is done below instead of through
  // eState: if the note is already open, its editor picks up the new line a
  // moment after the write, and a jump by line number before that lands on
  // whatever line used to be there.
  const openState = line !== undefined && !selectText ? { eState: { line } } : {};
  if (selectText) openState.state = { mode: 'source' };
  await fileLeaf.openFile(file, openState);

  const editor = fileLeaf.view?.editor;
  if (!selectText || !editor || line === undefined) return;
  let ch = -1;
  for (let attempt = 0; attempt < EDITOR_SYNC_ATTEMPTS && ch === -1; attempt++) {
    if (line < editor.lineCount()) ch = editor.getLine(line).indexOf(selectText);
    if (ch === -1) await new Promise((resolve) => activeWindow.setTimeout(resolve, EDITOR_SYNC_INTERVAL_MS));
  }
  if (ch === -1) return;
  const from = { line, ch };
  const to = { line, ch: ch + selectText.length };
  workspace.setActiveLeaf(fileLeaf, { focus: true });
  editor.setSelection(from, to);
  editor.scrollIntoView({ from, to }, true);
  editor.focus();
};

// How long openInSidePane waits for an already open editor to show a line
// that was just written: 40 checks, 50 ms apart.
const EDITOR_SYNC_ATTEMPTS = 40;
const EDITOR_SYNC_INTERVAL_MS = 50;

const onNodeClick = async (event) => {
  const task = taskStore.filteredTasks.find((t) => t.id === event.node.id);
  if (!task) return;
  await openInSidePane(task.path, task.originalTask?.taskLocation?.lineNumber);
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
      width: graphNode?.dimensions?.width,
      height: graphNode?.dimensions?.height
    };
  });
  const { layoutDirection, timeAxis } = taskStore.viewSettings;
  // With no dated task at all the time axis still lays out and shows a
  // ruler, starting from today; nothing on it is tied to a real date then.
  const timed = timeAxis ? layoutWithTimeAxis(layoutNodes, edges.value, layoutDirection) : null;
  const positions = timed ? timed.positions : layoutWithDagre(layoutNodes, edges.value, layoutDirection);
  positions.forEach(({ id, x, y }) => taskStore.updateTaskPosition(id, x, y));
  taskStore.setTimeAxisInfo(timed ? timed.info : null);
};

// The manual button also re-centers the view, since a fresh layout can move
// nodes outside what's currently visible. The periodic auto-layout timer
// deliberately skips this — yanking the camera every interval would be its
// own kind of jarring — so Overview stays as the non-destructive, layout-only
// way to re-center.
const onLayoutClick = () => {
  runAutoLayout();
  fitView({ padding: 0.2 });
};

const onLayoutDirectionChange = (value) => {
  taskStore.updateViewSettings({ layoutDirection: value });
  onLayoutClick();
};

const onTimeAxisChange = (partial) => {
  taskStore.updateViewSettings(partial);
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
// "new task" linked to the node it started from, placed where it was
// dropped, and opens it in the side pane with its name selected for editing.
const onConnectEnd = async (event) => {
  const drag = pendingDrag;
  pendingDrag = null;
  if (!drag || drag.connected || drag.x === undefined) return;
  if (event?.target?.closest?.('.vue-flow__node')) return;
  const end = eventPoint(event);
  if (!end || Math.hypot(end.x - drag.x, end.y - drag.y) < MIN_NEW_TASK_DRAG) return;

  const drop = screenToFlowCoordinate(end);
  const created = await taskStore.createLinkedTask(drag.nodeId, {
    upstream: drag.upstream,
    position: { x: drop.x - 60, y: drop.y - 15 }
  });
  if (!created) return;
  await openInSidePane(created.path, created.lineNumber, created.name);
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

// Periodically re-reads the Tasks plugin's cache so edits made outside this
// view (checking off a task, editing dependsOn) show up without reopening
// it. Only refetches data, never re-runs layout — redoing dagre on every
// poll would jump/reflow the whole graph; existing node ids keep their
// stored position, so an unaffected task doesn't visibly change.
let refreshTimer = null;

const restartRefreshTimer = () => {
  if (refreshTimer) activeWindow.clearInterval(refreshTimer);
  refreshTimer = null;
  if (taskStore.viewSettings.autoRefreshEnabled) {
    refreshTimer = activeWindow.setInterval(() => {
      if (isInteracting()) return;
      taskStore.fetchTasksFromObsidian();
    }, taskStore.viewSettings.autoRefreshInterval * 1000);
  }
};

// Off by default: unlike the refresh above, this genuinely repositions every
// node on each tick, so enabling it trades a live-tidying graph for visible
// jumps at whatever interval is set.
let layoutTimer = null;

const restartLayoutTimer = () => {
  if (layoutTimer) activeWindow.clearInterval(layoutTimer);
  layoutTimer = null;
  if (taskStore.viewSettings.autoLayoutEnabled) {
    layoutTimer = activeWindow.setInterval(() => {
      if (isInteracting()) return;
      runAutoLayout();
    }, taskStore.viewSettings.autoLayoutInterval * 1000);
  }
};

// Filters are edited in place by the filter panel's inputs rather than
// through store actions, so they are saved from here whenever they change.
watch(() => taskStore.filters, () => taskStore.saveState(), { deep: true });

watch(
  () => [taskStore.viewSettings.autoRefreshEnabled, taskStore.viewSettings.autoRefreshInterval],
  restartRefreshTimer
);
watch(
  () => [taskStore.viewSettings.autoLayoutEnabled, taskStore.viewSettings.autoLayoutInterval],
  restartLayoutTimer
);

onMounted(async () => {
  // Positions must load before tasks are built, since each task's starting
  // position is read from taskStore.positions at construction time.
  await taskStore.loadState();
  taskStore.fetchTasksFromObsidian();

  restartRefreshTimer();
  restartLayoutTimer();
});

onUnmounted(() => {
  if (refreshTimer) activeWindow.clearInterval(refreshTimer);
  if (layoutTimer) activeWindow.clearInterval(layoutTimer);
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
</style>
