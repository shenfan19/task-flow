<template>
  <RailCard title="View Control" initially-open>
    <select
      class="dropdown"
      :value="taskStore.viewSettings.layoutDirection"
      @change="$emit('direction-change', $event.target.value)"
    >
      <option value="TB">Top to Bottom</option>
      <option value="BT">Bottom to Top</option>
      <option value="LR">Left to Right</option>
      <option value="RL">Right to Left</option>
    </select>

    <select
      class="dropdown"
      :value="taskStore.viewSettings.edgeType"
      @change="$emit('edge-type-change', $event.target.value)"
    >
      <option value="default">Bezier</option>
      <option value="straight">Straight</option>
      <option value="smoothstep">Step</option>
    </select>

    <hr class="ft-sep">

    <!-- Orders tasks along the flow direction by date (done, else
         due, else scheduled, else start); see layoutWithTimeAxis in utils/layout.js. -->
    <div class="ft-interval-row">
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
      <!-- Tasks reload on their own when a note changes; this is for
           reloading by hand. -->
      <button class="btn btn-sm btn-outline-primary ft-refresh" @click="taskStore.fetchTasksFromObsidian()">
        Refresh
      </button>
    </div>

    <hr class="ft-sep">

    <!-- What a click and a double click on a node do; see runNodeAction in
         TaskGraphView.vue. By default a click only selects, so clicking
         around the graph never opens notes, and a double click opens. -->
    <div v-for="row in CLICK_ROWS" :key="row.key" class="ft-interval-row">
      <label class="ft-click-label" :for="row.key">{{ row.label }}</label>
      <select
        :id="row.key"
        class="dropdown ft-click-select"
        :value="taskStore.viewSettings[row.key]"
        @change="taskStore.updateViewSettings({ [row.key]: $event.target.value })"
      >
        <option value="select">Select</option>
        <option value="focus">Focus chain</option>
        <option value="open">Open task</option>
        <option value="edit">Edit task</option>
      </select>
    </div>
  </RailCard>
</template>

<script setup>
import { useTaskStore } from '../store';
import RailCard from './RailCard.vue';

defineEmits(['direction-change', 'edge-type-change', 'time-axis-change']);

const taskStore = useTaskStore();

const CLICK_ROWS = [
  { key: 'clickAction', label: 'Click' },
  { key: 'doubleClickAction', label: 'Double-click' }
];
</script>

<style scoped>
.ft-interval-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ft-refresh {
  margin-left: auto;
}

.ft-click-label {
  flex: none;
  width: 76px;
}

.ft-interval-row .ft-click-select {
  flex: 1 1 auto;
  width: auto;
  min-width: 0;
}

.ft-interval-input {
  width: 48px;
}
</style>
