<template>
  <RailCard title="Node Style">
    <div class="ft-style-row">
      <label for="nodeBorderColor">Border</label>
      <input id="nodeBorderColor" type="color" :value="taskStore.appearance.nodeBorder" @input="setValue('nodeBorder', $event)">
      <label for="nodeTextColor">Text</label>
      <input id="nodeTextColor" type="color" :value="taskStore.appearance.nodeText" @input="setValue('nodeText', $event)">
      <label for="highlightColor">Highlight</label>
      <input id="highlightColor" type="color" :value="taskStore.appearance.highlightColor" @input="setValue('highlightColor', $event)">
    </div>

    <!-- Font size and background by priority. The Tasks plugin's six
         priorities fall into three tiers, see PRIORITY_TIER in
         TaskFlowNode.vue; the normal tier covers tasks with no priority. -->
    <div class="ft-tier-grid">
      <span></span>
      <span class="ft-tier-head">Font size</span>
      <span class="ft-tier-head">Background</span>
      <template v-for="tier in TIERS" :key="tier.label">
        <span class="ft-tier-label">{{ tier.label }}</span>
        <span class="ft-tier-size">
          <input
            type="number"
            min="8"
            max="32"
            :value="taskStore.appearance[tier.size]"
            @input="setNumber(tier.size, $event)"
          >
          <span>px</span>
        </span>
        <input type="color" :value="taskStore.appearance[tier.bg]" @input="setValue(tier.bg, $event)">
      </template>
    </div>

    <div class="form-check">
      <input
        class="form-check-input"
        type="checkbox"
        id="richTextToggle"
        :checked="taskStore.appearance.richText"
        @change="taskStore.updateAppearance({ richText: $event.target.checked })"
      >
      <label class="form-check-label" for="richTextToggle">Rich text</label>
    </div>
    <div class="form-check">
      <input
        class="form-check-input"
        type="checkbox"
        id="showTagsToggle"
        :checked="taskStore.appearance.showTags"
        @change="taskStore.updateAppearance({ showTags: $event.target.checked })"
      >
      <label class="form-check-label" for="showTagsToggle">Show tags</label>
    </div>
  </RailCard>
</template>

<script setup>
import { useTaskStore } from '../store';
import RailCard from './RailCard.vue';

const taskStore = useTaskStore();

// Appearance keys of each priority tier. The normal tier keeps the original
// fontSize / nodeBg keys, so settings saved before tiers existed still apply.
const TIERS = [
  { label: 'High', size: 'highFontSize', bg: 'highBg' },
  { label: 'Normal', size: 'fontSize', bg: 'nodeBg' },
  { label: 'Low', size: 'lowFontSize', bg: 'lowBg' }
];

const setValue = (key, event) => {
  taskStore.updateAppearance({ [key]: event.target.value });
};

const setNumber = (key, event) => {
  const value = Number(event.target.value);
  if (value > 0) taskStore.updateAppearance({ [key]: value });
};
</script>

<style scoped>
.ft-style-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  row-gap: 4px;
}

.ft-style-row label + input {
  margin-right: 10px;
}

.ft-tier-grid {
  display: grid;
  grid-template-columns: auto auto auto;
  align-items: center;
  justify-content: start;
  column-gap: 12px;
  row-gap: 4px;
}

.ft-tier-head {
  color: var(--text-muted, #666);
  font-size: 11px;
}

.ft-tier-label {
  font-weight: 600;
}

.ft-tier-size {
  display: flex;
  align-items: center;
  gap: 3px;
}

.ft-tier-size input {
  width: 48px;
}

input[type='color'] {
  width: 28px;
  height: 22px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
}
</style>
