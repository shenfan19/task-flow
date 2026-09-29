<template>
  <RailCard title="Node Style">
    <!-- Outline colors, content colors, then the font size. Size and
         Background apply to every node; a task with a priority takes those
         of its tier below instead. -->
    <div class="ft-style-grid">
      <label for="nodeBorderColor">Border</label>
      <input id="nodeBorderColor" type="color" :value="taskStore.appearance.nodeBorder" @input="setValue('nodeBorder', $event)">
      <label for="highlightColor">Highlight</label>
      <input id="highlightColor" type="color" :value="taskStore.appearance.highlightColor" @input="setValue('highlightColor', $event)">
      <label for="nodeTextColor">Text</label>
      <input id="nodeTextColor" type="color" :value="taskStore.appearance.nodeText" @input="setValue('nodeText', $event)">
      <label for="nodeBgColor">Background</label>
      <input id="nodeBgColor" type="color" :value="taskStore.appearance.nodeBg" @input="setValue('nodeBg', $event)">
      <label for="nodeFontSize">Size</label>
      <span class="ft-tier-size">
        <input id="nodeFontSize" type="number" min="8" max="32" :value="taskStore.appearance.fontSize" @input="setNumber('fontSize', $event)">
        <span>px</span>
      </span>
    </div>

    <hr class="ft-sep">

    <!-- Font size and background by priority. The Tasks plugin's five
         priority levels fall into three tiers, see PRIORITY_TIER in
         TaskFlowNode.vue. -->
    <div class="ft-tier-grid">
      <span class="ft-tier-head">Priority</span>
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

    <hr class="ft-sep">

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

// Appearance keys of each priority tier. A task with no priority uses Size
// and Background above, the original fontSize / nodeBg keys.
const TIERS = [
  { label: 'High', size: 'highFontSize', bg: 'highBg' },
  { label: 'Medium', size: 'mediumFontSize', bg: 'mediumBg' },
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
.ft-style-grid {
  display: grid;
  grid-template-columns: auto auto auto auto;
  align-items: center;
  justify-content: start;
  column-gap: 6px;
  row-gap: 4px;
}

.ft-style-grid > :nth-child(4n + 2) {
  margin-right: 8px;
}

/* The size box spans the rest of its row, so its width does not widen the
   column of colors above it and push the card past its edge. */
.ft-style-grid > .ft-tier-size {
  grid-column: span 3;
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
