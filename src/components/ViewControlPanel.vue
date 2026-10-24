<template>
  <RailCard :title="t('View')">
    <div class="ft-interval-row">
      <label class="ft-click-label" for="layoutDirection">{{ t('Direction') }}</label>
      <select
        id="layoutDirection"
        class="dropdown ft-click-select"
        :value="taskStore.viewSettings.layoutDirection"
        @change="$emit('direction-change', $event.target.value)"
      >
        <option value="TB">{{ t('Top to Bottom') }}</option>
        <option value="BT">{{ t('Bottom to Top') }}</option>
        <option value="LR">{{ t('Left to Right') }}</option>
        <option value="RL">{{ t('Right to Left') }}</option>
      </select>
    </div>

    <div class="ft-interval-row">
      <label class="ft-click-label" for="edgeType">{{ t('Link') }}</label>
      <select
        id="edgeType"
        class="dropdown ft-click-select"
        :value="taskStore.viewSettings.edgeType"
        @change="$emit('edge-type-change', $event.target.value)"
      >
        <option value="default">{{ t('Bezier') }}</option>
        <option value="straight">{{ t('Straight') }}</option>
        <option value="smoothstep">{{ t('Step') }}</option>
      </select>
    </div>

    <!-- Lanes: after the layout above, each task is moved across the flow
         direction into a column (row in LR/RL) by its tag, note or priority;
         see utils/lanes.js. -->
    <div class="ft-interval-row">
      <label class="ft-click-label" for="laneBy">{{ t('Group by') }}</label>
      <select
        id="laneBy"
        class="dropdown ft-click-select"
        :value="taskStore.viewSettings.laneBy"
        @change="$emit('lane-change', { laneBy: $event.target.value })"
      >
        <option value="none">{{ t('None') }}</option>
        <option value="tag">{{ t('Tag') }}</option>
        <option value="file">{{ t('File') }}</option>
        <option value="priority">{{ t('Priority') }}</option>
      </select>
    </div>
    <div v-if="taskStore.viewSettings.laneBy !== 'none'" class="ft-interval-row">
      <label class="ft-click-label" for="laneMode">{{ t('Order') }}</label>
      <select
        id="laneMode"
        class="dropdown ft-click-select"
        :value="taskStore.viewSettings.laneMode"
        @change="$emit('lane-change', { laneMode: $event.target.value })"
      >
        <option value="auto">{{ t('Auto') }}</option>
        <!-- Priority lanes keep the order of the levels, so A-Z and Biggest
             first are not offered there rather than shown greyed out. -->
        <option v-if="!byPriority" value="alpha">{{ t('A-Z') }}</option>
        <option v-if="!byPriority" value="size">{{ t('Biggest first') }}</option>
        <option value="soft">{{ t('Soft pull') }}</option>
      </select>
    </div>

    <hr class="ft-sep">

    <!-- What a click and a double click on a node do; see runNodeAction in
         TaskGraphView.vue. By default a click only selects, so clicking
         around the graph never opens notes, and a double click opens. -->
    <div v-for="row in CLICK_ROWS" :key="row.key" class="ft-interval-row">
      <label class="ft-click-label" :for="row.key">{{ t(row.label) }}</label>
      <select
        :id="row.key"
        class="dropdown ft-click-select"
        :value="taskStore.viewSettings[row.key]"
        @change="taskStore.updateViewSettings({ [row.key]: $event.target.value })"
      >
        <option value="select">{{ t('Select') }}</option>
        <option value="focus">{{ t('Focus chain') }}</option>
        <option value="open">{{ t('Open note') }}</option>
        <option value="edit">{{ t('Edit task') }}</option>
      </select>
    </div>

    <!-- What happens to a task made by dragging onto empty canvas; see
         onConnectEnd in TaskGraphView.vue. -->
    <div class="ft-interval-row">
      <label class="ft-click-label" for="newTaskAction">{{ t('New task') }}</label>
      <select
        id="newTaskAction"
        class="dropdown ft-click-select"
        :value="taskStore.viewSettings.newTaskAction"
        @change="taskStore.updateViewSettings({ newTaskAction: $event.target.value })"
      >
        <option value="edit">{{ t('Edit task') }}</option>
        <option value="open">{{ t('Open note') }}</option>
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
      <label class="form-check-label" for="timeAxisToggle">{{ t('Date axis') }}</label>
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
      <label class="form-check-label" for="separateLinksToggle">{{ t('Separate links') }}</label>
    </div>

    <hr class="ft-sep">

    <!-- The interface language: Auto follows Obsidian. The language names are
         written in their own language and are not translated. -->
    <div class="ft-interval-row">
      <label class="ft-click-label" for="languageChoice">{{ t('Language') }}</label>
      <select
        id="languageChoice"
        class="dropdown ft-click-select"
        :value="languageChoice"
        @change="setLanguage($event.target.value)"
      >
        <option value="auto">{{ t('Follow Obsidian') }}</option>
        <option value="en">English</option>
        <option value="zh-CN">简体中文</option>
        <option value="zh-TW">繁體中文</option>
        <option value="ja">日本語</option>
        <option value="ko">한국어</option>
        <option value="de">Deutsch</option>
        <option value="fr">Français</option>
        <option value="es">Español</option>
        <option value="ru">Русский</option>
      </select>
    </div>
  </RailCard>
</template>

<script setup>
import { computed } from 'vue';
import { useTaskStore } from '../store';
import RailCard from './RailCard.vue';
import { languageChoice, setLanguage, t } from '../i18n';

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
