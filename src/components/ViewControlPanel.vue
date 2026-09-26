<template>
  <div class="view-control-panel-wrapper">
    <button
      class="btn btn-sm btn-outline-secondary bg-white shadow-sm d-flex align-items-center mb-2"
      @click="isCollapsed = !isCollapsed"
    >
      <span class="me-2">View Control</span>
      <span>{{ isCollapsed ? '▼' : '▲' }}</span>
    </button>

    <div v-show="!isCollapsed" class="view-control-panel-content bg-white border rounded shadow-sm p-2">
      <button class="btn btn-sm btn-outline-secondary w-100 mb-2" @click="$emit('overview')">
        Overview
      </button>

      <select
        class="form-select form-select-sm mb-2"
        :value="taskStore.viewSettings.layoutDirection"
        @change="$emit('direction-change', $event.target.value)"
      >
        <option value="TB">Top to Bottom</option>
        <option value="BT">Bottom to Top</option>
        <option value="LR">Left to Right</option>
        <option value="RL">Right to Left</option>
      </select>

      <select
        class="form-select form-select-sm mb-2"
        :value="taskStore.viewSettings.edgeType"
        @change="$emit('edge-type-change', $event.target.value)"
      >
        <option value="default">Bezier</option>
        <option value="straight">Straight</option>
        <option value="smoothstep">Step</option>
      </select>

      <div class="ft-interval-row mb-1">
        <button class="btn btn-sm btn-outline-primary" @click="$emit('layout')">
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

      <!-- Orders tasks along the flow direction by date (done, else
           scheduled, else due); see layoutWithTimeAxis in utils/layout.js. -->
      <div class="ft-interval-row mb-1">
        <div class="form-check">
          <input
            class="form-check-input"
            type="checkbox"
            id="timeAxisToggle"
            :checked="taskStore.viewSettings.timeAxis"
            @change="$emit('time-axis-change', { timeAxis: $event.target.checked })"
          >
          <label class="form-check-label" for="timeAxisToggle">Time axis</label>
        </div>
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
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useTaskStore } from '../store';

defineEmits(['overview', 'layout', 'direction-change', 'edge-type-change', 'time-axis-change']);

const taskStore = useTaskStore();
const isCollapsed = ref(true);
</script>

<style scoped>
.view-control-panel-content {
  width: 200px;
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
