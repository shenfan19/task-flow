<template>
  <!-- Always open, above the other cards: choosing a preset loads its
       filters, Save stores the current filters into it, and New… makes a
       new one from the current filters. -->
  <RailCard title="Presets" :collapsible="false">
    <div class="ft-preset-row">
      <select class="dropdown ft-preset-select" :value="taskStore.selectedPresetId" @change="onSelect">
        <option v-for="preset in taskStore.filterPresets" :key="preset.id" :value="preset.id">
          {{ preset.name }}{{ preset.id === taskStore.selectedPresetId && taskStore.presetModified ? ' *' : '' }}
        </option>
        <option :value="NEW_PRESET">New…</option>
      </select>
      <button
        :class="{ 'mod-cta': taskStore.presetModified }"
        :disabled="!taskStore.presetModified"
        title="Store the current filters in this preset"
        @click="taskStore.saveFilterPreset()"
      >Save</button>
      <button
        :disabled="taskStore.selectedPresetId === DEFAULT_PRESET_ID"
        title="Delete this preset"
        @click="onDelete"
      >Delete</button>
    </div>
  </RailCard>
</template>

<script setup>
import { useTaskStore, DEFAULT_PRESET_ID } from '../store';
import { getApp } from '../pluginContext';
import { promptName } from '../utils/promptName';
import RailCard from './RailCard.vue';

const taskStore = useTaskStore();

// Option value of "New…"; not a preset id, since ids come from Date.now().
const NEW_PRESET = '__new__';

const onSelect = async (event) => {
  const value = event.target.value;
  if (value !== NEW_PRESET) {
    taskStore.applyFilterPreset(value);
    return;
  }
  // The select would otherwise keep showing "New…" while the dialog is up
  // and after it is cancelled.
  event.target.value = taskStore.selectedPresetId;
  const app = getApp();
  if (!app) return;
  const name = await promptName(app, {
    title: 'New filter preset',
    placeholder: 'Preset name',
    validate: (n) => (taskStore.filterPresets.some((p) => p.name === n) ? 'A preset with this name already exists.' : null)
  });
  if (name) taskStore.createFilterPreset(name);
};

const onDelete = () => {
  taskStore.deleteFilterPreset(taskStore.selectedPresetId);
};
</script>

<style scoped>
.ft-preset-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ft-preset-row .ft-preset-select {
  flex: 1 1 auto;
  min-width: 0;
  width: auto;
}

.ft-preset-row button {
  flex: none;
  padding: 0 8px;
}
</style>

<style>
/* The name dialog lives outside this component, see utils/promptName.js. */
.ft-prompt-input {
  width: 100%;
}

.ft-prompt-error {
  margin-top: 6px;
  color: var(--text-error);
}
</style>
