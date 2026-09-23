<template>
  <div class="position-relative w-100 h-100 ft-graph-root">
    <!-- Left button rail: filters, view controls, node appearance -->
    <div class="ft-left-rail">
      <FilterPanel />
      <button class="btn btn-sm btn-outline-secondary bg-white shadow-sm" @click="onOverviewClick">
        Overview
      </button>
      <div class="d-flex flex-column gap-1 bg-white shadow-sm p-2 rounded">
        <select
          class="form-select form-select-sm"
          :value="taskStore.viewSettings.layoutDirection"
          @change="onLayoutDirectionChange"
        >
          <option value="TB">Top to Bottom</option>
          <option value="BT">Bottom to Top</option>
          <option value="LR">Left to Right</option>
          <option value="RL">Right to Left</option>
        </select>
        <select
          class="form-select form-select-sm"
          :value="taskStore.viewSettings.edgeType"
          @change="onEdgeTypeChange"
        >
          <option value="default">Bezier</option>
          <option value="straight">Straight</option>
          <option value="smoothstep">Step</option>
        </select>
        <div class="ft-interval-row">
          <button class="btn btn-sm btn-outline-primary" @click="onLayoutClick">
            Layout
          </button>
          <div class="form-check">
            <input
              class="form-check-input"
              type="checkbox"
              id="autoLayoutToggle"
              :checked="taskStore.viewSettings.autoLayoutEnabled"
              @change="taskStore.updateViewSettings({ autoLayoutEnabled: $event.target.checked })"
            >
            <label class="form-check-label" for="autoLayoutToggle">every</label>
          </div>
          <input
            type="number"
            min="1"
            class="ft-interval-input"
            :value="taskStore.viewSettings.autoLayoutInterval"
            @change="taskStore.updateViewSettings({ autoLayoutInterval: Math.max(1, Number($event.target.value)) })"
          >
          <span>s</span>
        </div>
        <div class="ft-interval-row">
          <button class="btn btn-sm btn-outline-primary" @click="taskStore.fetchTasksFromObsidian()">
            Refresh
          </button>
          <div class="form-check">
            <input
              class="form-check-input"
              type="checkbox"
              id="autoRefreshToggle"
              :checked="taskStore.viewSettings.autoRefreshEnabled"
              @change="taskStore.updateViewSettings({ autoRefreshEnabled: $event.target.checked })"
            >
            <label class="form-check-label" for="autoRefreshToggle">every</label>
          </div>
          <input
            type="number"
            min="1"
            class="ft-interval-input"
            :value="taskStore.viewSettings.autoRefreshInterval"
            @change="taskStore.updateViewSettings({ autoRefreshInterval: Math.max(1, Number($event.target.value)) })"
          >
          <span>s</span>
        </div>
      </div>
      <AppearancePanel />
    </div>

    <!-- Graph Container (Full Size) -->
    <div class="w-100 h-100 bg-white ft-graph-container">
      <VueFlow
        :nodes="nodes"
        :edges="edges"
        :default-edge-options="defaultEdgeOptions"
        class="w-100 h-100"
        @node-click="onNodeClick"
        @node-drag-stop="onNodeDragStop"
      >
        <template #node-task="taskNodeProps">
          <TaskFlowNode v-bind="taskNodeProps" />
        </template>
        <Background />
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
import FilterPanel from './FilterPanel.vue';
import AppearancePanel from './AppearancePanel.vue';
import TaskFlowNode from './TaskFlowNode.vue';
import { layoutWithDagre } from '../utils/layout';

const taskStore = useTaskStore();
const { fitView, findNode } = useVueFlow();

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

// Which pair of handles (see TaskFlowNode.vue's 4 sides) an edge should use,
// picked from the two nodes' current positions so the connection always
// leaves/enters from whichever side is closest — recomputed whenever a node
// is dragged or auto-laid-out, not fixed to the layout direction setting.
const HANDLES_BY_DIRECTION = {
  right: { source: 'right-source', target: 'left-target' },
  left: { source: 'left-source', target: 'right-target' },
  bottom: { source: 'bottom-source', target: 'top-target' },
  top: { source: 'top-source', target: 'bottom-target' }
};

const pickHandles = (sourcePos, targetPos) => {
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;
  const direction = Math.abs(dx) > Math.abs(dy)
    ? (dx >= 0 ? 'right' : 'left')
    : (dy >= 0 ? 'bottom' : 'top');
  return HANDLES_BY_DIRECTION[direction];
};

const edges = computed(() => {
  const positionById = new Map(taskStore.filteredTasks.map((t) => [t.id, t.position]));
  return taskStore.filteredEdges.map((edge) => {
    const sourcePos = positionById.get(edge.source);
    const targetPos = positionById.get(edge.target);
    const handles = sourcePos && targetPos
      ? pickHandles(sourcePos, targetPos)
      : HANDLES_BY_DIRECTION.bottom;
    return {
      ...edge,
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

const onNodeClick = async (event) => {
  const task = taskStore.filteredTasks.find((t) => t.id === event.node.id);
  if (!task || !window.app) return;

  const file = window.app.vault.getAbstractFileByPath(task.path);
  if (!file) return;

  const workspace = window.app.workspace;
  if (!fileLeaf || !workspace.getLeafById(fileLeaf.id)) {
    fileLeaf = workspace.getLeaf('split', 'vertical');
  }

  const line = task.originalTask?.taskLocation?.lineNumber;
  await fileLeaf.openFile(file, line !== undefined ? { eState: { line } } : undefined);
};

const onNodeDragStop = (event) => {
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
      width: graphNode?.dimensions?.width,
      height: graphNode?.dimensions?.height
    };
  });
  const positions = layoutWithDagre(layoutNodes, edges.value, taskStore.viewSettings.layoutDirection);
  positions.forEach(({ id, x, y }) => taskStore.updateTaskPosition(id, x, y));
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

const onLayoutDirectionChange = (event) => {
  taskStore.updateViewSettings({ layoutDirection: event.target.value });
  onLayoutClick();
};

const onEdgeTypeChange = (event) => {
  taskStore.updateViewSettings({ edgeType: event.target.value });
  onLayoutClick();
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
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = null;
  if (taskStore.viewSettings.autoRefreshEnabled) {
    refreshTimer = setInterval(() => {
      taskStore.fetchTasksFromObsidian();
    }, taskStore.viewSettings.autoRefreshInterval * 1000);
  }
};

// Off by default: unlike the refresh above, this genuinely repositions every
// node on each tick, so enabling it trades a live-tidying graph for visible
// jumps at whatever interval is set.
let layoutTimer = null;

const restartLayoutTimer = () => {
  if (layoutTimer) clearInterval(layoutTimer);
  layoutTimer = null;
  if (taskStore.viewSettings.autoLayoutEnabled) {
    layoutTimer = setInterval(() => {
      runAutoLayout();
    }, taskStore.viewSettings.autoLayoutInterval * 1000);
  }
};

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
  if (refreshTimer) clearInterval(refreshTimer);
  if (layoutTimer) clearInterval(layoutTimer);
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

.ft-interval-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ft-interval-input {
  width: 48px;
}
</style>
