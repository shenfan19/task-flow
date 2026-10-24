<template>
  <RailCard :title="t('Style')">
    <!-- Outline colors, content colors, then the font size. Size and
         Background apply to every node; a task with a priority takes those
         of its tier below instead. -->
    <div class="ft-style-grid">
      <label for="nodeBorderColor">{{ t('Border') }}</label>
      <input id="nodeBorderColor" type="color" :value="taskStore.appearance.nodeBorder" @input="setValue('nodeBorder', $event)">
      <label for="highlightColor">{{ t('Highlight') }}</label>
      <input id="highlightColor" type="color" :value="taskStore.appearance.highlightColor" @input="setValue('highlightColor', $event)">
      <label for="nodeTextColor">{{ t('Text') }}</label>
      <input id="nodeTextColor" type="color" :value="taskStore.appearance.nodeText" @input="setValue('nodeText', $event)">
      <label for="nodeBgColor">{{ t('Background') }}</label>
      <input id="nodeBgColor" type="color" :value="taskStore.appearance.nodeBg" @input="setValue('nodeBg', $event)">
      <label for="nodeFontSize">{{ t('Size') }}</label>
      <span class="ft-tier-size">
        <input id="nodeFontSize" type="number" min="8" max="32" :value="taskStore.appearance.fontSize" @input="setNumber('fontSize', $event)">
        <span>px</span>
      </span>
    </div>

    <hr class="ft-sep">

    <!-- Font size and background by priority, one row for each of the Tasks
         plugin's five priority levels, see PRIORITY_TIER in
         TaskFlowNode.vue. -->
    <div class="ft-tier-grid">
      <span class="ft-tier-head">{{ t('Priority') }}</span>
      <span class="ft-tier-head">{{ t('Font size') }}</span>
      <span class="ft-tier-head">{{ t('Background') }}</span>
      <template v-for="tier in TIERS" :key="tier.label">
        <span class="ft-tier-label">{{ t(tier.label) }}</span>
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

    <!-- Links: line width and arrowhead size, changed by dragging. -->
    <div class="ft-link-grid">
      <label for="edgeWidth">{{ t('Line width') }}</label>
      <input id="edgeWidth" type="range" min="0.5" max="6" step="0.5" :value="taskStore.appearance.edgeWidth" @input="setNumber('edgeWidth', $event)">
      <span class="ft-link-value">{{ taskStore.appearance.edgeWidth }}</span>
      <label for="arrowSize">{{ t('Arrow size') }}</label>
      <input id="arrowSize" type="range" min="6" max="40" step="0.5" :value="taskStore.appearance.arrowSize" @input="setNumber('arrowSize', $event)">
      <span class="ft-link-value">{{ taskStore.appearance.arrowSize }}</span>
    </div>

    <hr class="ft-sep">

    <!-- How this plugin writes an id, a dependency or a priority on a task
         line it adds one to. Fields already on a line keep their own style.
         It describes the notes, so it is shared by every profile. -->
    <div class="ft-format-row">
      <label for="taskFormat">{{ t('Task format') }}</label>
      <select id="taskFormat" class="dropdown" :value="taskStore.writeFormat" @change="taskStore.setTaskFormat($event.target.value)">
        <option v-for="format in TASK_FORMATS" :key="format.value" :value="format.value">{{ t(format.label) }}</option>
      </select>
    </div>
    <p class="ft-format-note">{{ t('Used for new and edited tasks. A field already on a line keeps its style.') }}</p>

    <hr class="ft-sep">

    <div class="form-check">
      <input
        class="form-check-input"
        type="checkbox"
        id="richTextToggle"
        :checked="taskStore.appearance.richText"
        @change="taskStore.updateAppearance({ richText: $event.target.checked })"
      >
      <label class="form-check-label" for="richTextToggle">{{ t('Rich text') }}</label>
    </div>
    <div class="form-check">
      <input
        class="form-check-input"
        type="checkbox"
        id="showLinkCountsToggle"
        :checked="taskStore.appearance.showLinkCounts"
        @change="taskStore.updateAppearance({ showLinkCounts: $event.target.checked })"
      >
      <label class="form-check-label" for="showLinkCountsToggle">{{ t('Show link counts') }}</label>
    </div>
    <div class="form-check">
      <input
        class="form-check-input"
        type="checkbox"
        id="showTagsToggle"
        :checked="taskStore.appearance.showTags"
        @change="taskStore.updateAppearance({ showTags: $event.target.checked })"
      >
      <label class="form-check-label" for="showTagsToggle">{{ t('Show tags') }}</label>
    </div>
  </RailCard>
</template>

<script setup>
import { useTaskStore } from '../store';
import { TASK_FORMATS } from '../utils/taskLineEdits';
import RailCard from './RailCard.vue';
import { t } from '../i18n';

const taskStore = useTaskStore();

// Appearance keys of each priority level. A task with no priority uses Size
// and Background above, the original fontSize / nodeBg keys.
const TIERS = [
  { label: 'Highest', size: 'highestFontSize', bg: 'highestBg' },
  { label: 'High', size: 'highFontSize', bg: 'highBg' },
  { label: 'Medium', size: 'mediumFontSize', bg: 'mediumBg' },
  { label: 'Low', size: 'lowFontSize', bg: 'lowBg' },
  { label: 'Lowest', size: 'lowestFontSize', bg: 'lowestBg' }
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

.ft-link-grid {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  column-gap: 8px;
  row-gap: 4px;
}

.ft-link-grid input[type='range'] {
  width: 100%;
  min-width: 80px;
}

.ft-format-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ft-format-note {
  margin: 4px 0 0;
  color: var(--text-muted, #666);
  font-size: 11px;
}

.ft-link-value {
  min-width: 2.5em;
  text-align: right;
  color: var(--text-muted, #666);
  font-size: 11px;
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
