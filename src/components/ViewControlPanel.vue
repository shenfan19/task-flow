<template>
  <RailCard title="View">
    <div class="ft-interval-row">
      <label class="ft-click-label" for="layoutDirection">Direction</label>
      <select
        id="layoutDirection"
        class="dropdown ft-click-select"
        :value="taskStore.viewSettings.layoutDirection"
        @change="$emit('direction-change', $event.target.value)"
      >
        <option value="TB">Top to Bottom</option>
        <option value="BT">Bottom to Top</option>
        <option value="LR">Left to Right</option>
        <option value="RL">Right to Left</option>
      </select>
    </div>

    <div class="ft-interval-row">
      <label class="ft-click-label" for="edgeType">Link</label>
      <select
        id="edgeType"
        class="dropdown ft-click-select"
        :value="taskStore.viewSettings.edgeType"
        @change="$emit('edge-type-change', $event.target.value)"
      >
        <option value="default">Bezier</option>
        <option value="straight">Straight</option>
        <option value="smoothstep">Step</option>
      </select>
    </div>

    <!-- Lanes: after the layout above, each task is moved across the flow
         direction into a column (row in LR/RL) by its tag, note or priority;
         see utils/lanes.js. -->
    <div class="ft-interval-row">
      <label class="ft-click-label" for="laneBy">Group by</label>
      <select
        id="laneBy"
        class="dropdown ft-click-select"
        :value="taskStore.viewSettings.laneBy"
        @change="$emit('lane-change', { laneBy: $event.target.value })"
      >
        <option value="none">None</option>
        <option value="tag">Tag</option>
        <option value="file">File</option>
        <option value="priority">Priority</option>
      </select>
    </div>
    <div v-if="taskStore.viewSettings.laneBy !== 'none'" class="ft-interval-row">
      <label class="ft-click-label" for="laneMode">Order</label>
      <select
        id="laneMode"
        class="dropdown ft-click-select"
        :value="taskStore.viewSettings.laneMode"
        @change="$emit('lane-change', { laneMode: $event.target.value })"
      >
        <option value="auto">Auto</option>
        <!-- Priority lanes keep the order of the levels, so A-Z and Biggest
             first are not offered there rather than shown greyed out. -->
        <option v-if="!byPriority" value="alpha">A-Z</option>
        <option v-if="!byPriority" value="size">Biggest first</option>
        <option value="soft">Soft pull</option>
      </select>
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
        <option value="open">Open note</option>
        <option value="edit">Edit task</option>
      </select>
    </div>

    <!-- What happens to a task made by dragging onto empty canvas; see
         onConnectEnd in TaskGraphView.vue. -->
    <div class="ft-interval-row">
      <label class="ft-click-label" for="newTaskAction">New task</label>
      <select
        id="newTaskAction"
        class="dropdown ft-click-select"
        :value="taskStore.viewSettings.newTaskAction"
        @change="taskStore.updateViewSettings({ newTaskAction: $event.target.value })"
      >
        <option value="edit">Edit task</option>
        <option value="open">Open note</option>
      </select>
    </div>

    <hr class="ft-sep">

    <!-- Orders tasks along the flow direction by date (done, else
         due, else scheduled, else start); see layoutWithTimeAxis in utils/layout.js. -->
    <div class="form-check">
      <input
        class="form-check-input"
        type="checkbox"
        id="timeAxisToggle"
        :checked="taskStore.viewSettings.timeAxis"
        @change="$emit('time-axis-change', { timeAxis: $event.target.checked })"
      >
      <label class="form-check-label" for="timeAxisToggle">Date axis</label>
    </div>

    <!-- At Layout, a task sitting on or near a longer link that joins the
         tasks before and after it is moved aside, so the links do not lie on
         top of each other; see separateOverlappingLinks in utils/layout.js. -->
    <div class="form-check">
      <input
        class="form-check-input"
        type="checkbox"
        id="separateLinksToggle"
        :checked="taskStore.viewSettings.separateLinks"
        @change="$emit('separate-links-change', { separateLinks: $event.target.checked })"
      >
      <label class="form-check-label" for="separateLinksToggle">Separate links</label>
    </div>
  </RailCard>
</template>

<script setup>
import { computed } from 'vue';
import { useTaskStore } from '../store';
import RailCard from './RailCard.vue';

defineEmits(['direction-change', 'edge-type-change', 'time-axis-change', 'separate-links-change', 'lane-change']);

const taskStore = useTaskStore();

const byPriority = computed(() => taskStore.viewSettings.laneBy === 'priority');

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

.ft-click-label {
  flex: none;
  width: 76px;
}

.ft-interval-row .ft-click-select {
  flex: 1 1 auto;
  width: auto;
  min-width: 0;
}
</style>
