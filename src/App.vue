<template>
  <div class="container">
    <h1>FlowyTask</h1>
    <TaskForm />
    <div class="mb-4">
      <button class="btn btn-secondary me-2" @click="currentView = 'list'">任务列表视图</button>
      <button class="btn btn-secondary" @click="currentView = 'flowchart'">流程图-时间轴视图</button>
    </div>
    <TaskList v-if="currentView === 'list'" />
    <FlowchartTimeline v-if="currentView === 'flowchart'" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import TaskForm from './components/TaskForm.vue';
import TaskList from './components/TaskList.vue';
import FlowchartTimeline from './components/FlowchartTimeline.vue';

const currentView = ref('list');
</script>

<style scoped>
.container { padding: 20px; }
</style>