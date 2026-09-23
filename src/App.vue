<template>
  <div class="d-flex flex-column h-100 bg-light ft-root">
    <div v-if="error" class="alert alert-danger m-3 flex-grow-1 p-4 shadow">
      <h4>Render Error</h4>
      <hr>
      <pre style="white-space: pre-wrap; word-wrap: break-word;">{{ error }}</pre>
      <p class="mt-3">Please check developer console for more details.</p>
    </div>
    <!-- Main content area -->
    <div v-else class="flex-grow-1 overflow-auto position-relative h-100 ft-content">
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
  console.error('Task Flowchart rendering error:', err);
  return false; // stop propagation
});
</script>

<style scoped>
/* Bootstrap's utility classes (d-flex, h-100, etc.) above have no effect since
   bootstrap.css is never loaded here — an Obsidian plugin shares the host
   app's document, so importing it globally would leak into all of Obsidian's
   own UI. These scoped rules give the same layout without that risk. */
.ft-root {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}
.ft-content {
  flex: 1 1 auto;
  min-height: 0;
}
</style>