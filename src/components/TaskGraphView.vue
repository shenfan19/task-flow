<template>
  <div class="position-relative w-100 h-100">
    <!-- Floating Filter Panel -->
    <FilterPanel />

    <button
      class="btn btn-sm btn-outline-primary position-absolute top-0 start-50 translate-middle-x mt-2"
      style="z-index: 1000;"
      @click="runAutoLayout"
    >
      自动排布
    </button>

    <!-- Graph Container (Full Size) -->
    <div class="w-100 h-100 bg-white">
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

    <!-- Overlay for task details -->
    <div v-if="editingTask" class="task-editor-overlay position-absolute top-0 end-0 p-3 bg-white border-start h-100 shadow" style="width: 320px; z-index: 1000;">
      <h5 class="border-bottom pb-2 mb-3">任务详情</h5>

      <div class="mb-3">
        <label class="form-label text-muted small fw-bold mb-1">文件路径</label>
        <div class="small text-break">{{ editingTask.path }}</div>
      </div>

      <div class="mb-3">
        <label class="form-label text-muted small fw-bold mb-1">任务内容</label>
        <div class="p-2 bg-light border rounded small" style="white-space: pre-wrap;">{{ editingTask.originalTask?.originalMarkdown || editingTask.name }}</div>
      </div>

      <div class="mb-3">
        <label class="form-label text-muted small fw-bold mb-1">状态</label>
        <div>
          <span class="badge" :class="editingTask.completed ? 'bg-success' : 'bg-secondary'">
            {{ editingTask.completed ? '已完成' : '未完成' }}
          </span>
        </div>
      </div>


      <div class="alert alert-info py-1 px-2 mt-4" style="font-size: 0.8rem;">
        目前已介入 Obsidian 原生 Markdown 任务。请直接在对应文件中编辑任务内容。
      </div>

      <button class="btn btn-outline-secondary btn-sm w-100 mt-2" @click="editingTask = null">关闭</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { VueFlow, MarkerType } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import { useTaskStore } from '../store';
import FilterPanel from './FilterPanel.vue';
import TaskFlowNode from './TaskFlowNode.vue';
import { layoutWithDagre } from '../utils/layout';

const taskStore = useTaskStore();
const editingTask = ref(null);

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

const edges = computed(() => taskStore.filteredEdges);

const onNodeClick = (event) => {
  editingTask.value = taskStore.filteredTasks.find((t) => t.id === event.node.id) || null;
};

const onNodeDragStop = (event) => {
  taskStore.updateTaskPosition(event.node.id, event.node.position.x, event.node.position.y);
};

const runAutoLayout = () => {
  const positions = layoutWithDagre(nodes.value, edges.value);
  positions.forEach(({ id, x, y }) => taskStore.updateTaskPosition(id, x, y));
};

onMounted(async () => {
  // Positions must load before tasks are built, since each task's starting
  // position is read from taskStore.positions at construction time.
  await taskStore.loadPositions();
  taskStore.fetchTasksFromObsidian();
});
</script>

<style scoped>
.task-editor-overlay {
  box-shadow: -2px 0 5px rgba(0,0,0,0.1);
}
</style>
