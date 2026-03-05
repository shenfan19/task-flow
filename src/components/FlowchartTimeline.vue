<template>
  <div class="card">
    <div class="card-body">
      <h5 class="card-title">流程图与时间轴</h5>
      <div ref="chartContainer" class="chart-container"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts';
import { useTaskStore } from '../store';

const chartContainer = ref(null);
const taskStore = useTaskStore();
let chart = null;

const renderChart = () => {
  if (!chartContainer.value) {
    console.error('图表容器未找到');
    return;
  }

  if (!chart) {
    chart = echarts.init(chartContainer.value);
  }

  const nodes = taskStore.tasks.map(task => ({
    name: task.name,
    value: [new Date(task.dueDate).getTime(), task.id * 100], // Y轴按ID分层
    id: task.id
  }));

  const links = taskStore.tasks.flatMap(task =>
    task.dependencies.map(depId => ({
      source: depId,
      target: task.id
    }))
  );

  const option = {
    tooltip: { formatter: '{b}' },
    xAxis: {
      type: 'time',
      name: '日期',
      axisLabel: { rotate: 45 }
    },
    yAxis: { type: 'value', show: false },
    series: [
      {
        type: 'graph',
        layout: 'none',
        data: nodes,
        links: links,
        edgeSymbol: ['none', 'arrow'],
        label: { show: true, position: 'top', formatter: '{b}' },
        lineStyle: { color: '#0f5132' },
        itemStyle: { color: '#d1e7dd', borderColor: '#0f5132' },
        symbolSize: 50
      }
    ]
  };

  chart.setOption(option);
  console.log('图表已渲染，节点数:', nodes.length, '连线数:', links.length);
};

// 监听任务数据变化
watch(() => taskStore.tasks, () => {
  console.log('任务数据更新，重新渲染图表');
  renderChart();
}, { deep: true });

// 初始化图表
onMounted(() => {
  renderChart();
  window.addEventListener('resize', () => chart?.resize());
});

// 清理图表
onUnmounted(() => {
  if (chart) {
    chart.dispose();
    chart = null;
  }
});
</script>

<style scoped>
.chart-container { width: 100%; height: 600px; }
</style>