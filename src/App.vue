<template>
  <div class="d-flex flex-column h-100 bg-light">
    <div v-if="error" class="alert alert-danger m-3 flex-grow-1 p-4 shadow">
      <h4>渲染时发生错误 (Render Error)</h4>
      <hr>
      <pre style="white-space: pre-wrap; word-wrap: break-word;">{{ error }}</pre>
      <p class="mt-3">Please check developer console for more details.</p>
    </div>
    <!-- Main content area -->
    <div v-else class="flex-grow-1 overflow-auto position-relative h-100">
      <TaskGraphView />
    </div>
  </div>
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue';
import TaskGraphView from './components/TaskGraphView.vue';

const error = ref(null);

onErrorCaptured((err) => {
  error.value = err.message || err.toString();
  console.error('FlowyTask rendering error:', err);
  return false; // stop propagation
});
</script>

<style>
/* Make sure the app container takes full height of the Obsidian view */
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>