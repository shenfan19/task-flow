<template>
  <div class="position-relative w-100 h-100">
    <!-- Floating Filter Panel -->
    <FilterPanel />
    
    <!-- Graph Container (Full Size) -->
    <div class="w-100 h-100 bg-white">
      <div ref="chartContainer" class="w-100 h-100 min-vh-50"></div>
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
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts';
import { useTaskStore } from '../store';
import FilterPanel from './FilterPanel.vue';

const chartContainer = ref(null);
const taskStore = useTaskStore();
const editingTask = ref(null);
let chart = null;

const renderChart = () => {
  if (!chartContainer.value) return;

  if (!chart) {
    chart = echarts.init(chartContainer.value);
    
    chart.on('mouseup', (params) => {
      if (params.componentType === 'series' && params.seriesType === 'graph') {
        const nodeIndex = params.dataIndex;
        const task = taskStore.filteredTasks[nodeIndex];
        if (task) {
          const option = chart.getOption();
          const nodeData = option.series[0].data[nodeIndex];
          taskStore.updateTaskPosition(task.id, nodeData.x, nodeData.y);
        }
      }
    });

    chart.on('click', (params) => {
      if (params.componentType === 'series' && params.seriesType === 'graph') {
        editingTask.value = taskStore.filteredTasks[params.dataIndex];
      }
    });
  }

  const nodes = taskStore.filteredTasks.map(task => ({
    name: task.id, // Use ID internally for linking if needed
    x: task.position?.x || Math.random() * 500,
    y: task.position?.y || Math.random() * 500,
    id: String(task.id),
    itemStyle: {
      color: task.completed ? '#198754' : '#0d6efd'
    },
    label: {
      show: true,
      formatter: task.name.substring(0, 15) + (task.name.length > 15 ? '...' : ''),
      position: 'bottom',
      color: '#333'
    },
    symbolSize: 25,
    draggable: true
  }));

  // No explicit dependencies yet since standard Obsidian tasks don't map them natively
  const links = [];

  const option = {
    tooltip: { 
      trigger: 'item',
      formatter: function(params) {
        if (params.dataType === 'node') {
          const t = taskStore.filteredTasks[params.dataIndex];
          return t ? t.name : params.name;
        }
        return '';
      }
    },
    series: [
      {
        type: 'graph',
        layout: 'none',
        data: nodes,
        links: links,
        edgeSymbol: ['none', 'arrow'],
        lineStyle: { color: '#bbb', width: 2, curveness: 0.1 },
        emphasis: { focus: 'adjacency' },
        roam: true // Enable zooming and panning
      }
    ]
  };

  chart.setOption(option);
};

watch(() => taskStore.filteredTasks, () => {
  renderChart();
}, { deep: true });

onMounted(() => {
  // Fetch native tasks!
  taskStore.fetchTasksFromObsidian();
  
  // Need a slight delay to ensure container is fully sized by parent flexbox
  setTimeout(() => {
    renderChart();
    window.addEventListener('resize', () => chart?.resize());
  }, 100);
});

onUnmounted(() => {
  if (chart) {
    chart.dispose();
    chart = null;
  }
});
</script>

<style scoped>
.task-editor-overlay {
  box-shadow: -2px 0 5px rgba(0,0,0,0.1);
}
</style>
