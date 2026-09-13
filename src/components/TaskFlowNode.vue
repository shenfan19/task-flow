<template>
  <div class="task-flow-node" :class="{ 'task-flow-node--done': data.task.completed }">
    <Handle type="target" :position="Position.Top" />
    <div class="task-flow-node__label">{{ data.task.name }}</div>
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<script setup>
import { Handle, Position } from '@vue-flow/core';

defineProps({
  data: {
    type: Object,
    required: true
  }
});
</script>

<style scoped>
.task-flow-node {
  max-width: 200px;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #0d6efd;
  background: #fff;
  font-size: 12px;
  line-height: 1.3;
  white-space: normal;
  word-break: break-word;
}

.task-flow-node--done {
  border-color: #198754;
  color: #6c757d;
  text-decoration: line-through;
}
</style>
