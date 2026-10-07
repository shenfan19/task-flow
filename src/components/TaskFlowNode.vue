<template>
  <div
    class="task-flow-node"
    :class="{ 'task-flow-node--done': data.task.completed }"
    :style="nodeStyle"
  >
    <!-- One source + one target handle per side, stacked exactly on top of
         each other, so an edge can be anchored to whichever side the layout
         direction calls for regardless of whether this node is that edge's
         source or target.
         Only the source dot is visible; the target one is still tracked for
         position lookups (see TaskGraphView.vue's pickHandles). -->
    <Handle type="target" :position="Position.Top" id="top-target" class="ft-node-handle ft-node-handle--hidden" />
    <Handle type="source" :position="Position.Top" id="top-source" class="ft-node-handle" />

    <Handle type="target" :position="Position.Right" id="right-target" class="ft-node-handle ft-node-handle--hidden" />
    <Handle type="source" :position="Position.Right" id="right-source" class="ft-node-handle" />

    <Handle type="target" :position="Position.Bottom" id="bottom-target" class="ft-node-handle ft-node-handle--hidden" />
    <Handle type="source" :position="Position.Bottom" id="bottom-source" class="ft-node-handle" />

    <Handle type="target" :position="Position.Left" id="left-target" class="ft-node-handle ft-node-handle--hidden" />
    <Handle type="source" :position="Position.Left" id="left-source" class="ft-node-handle" />

    <!-- Only one of these ever exists at a time: when rich text is off, the
         MarkdownRenderer call below never runs at all, not just hidden. -->
    <div v-if="taskStore.appearance.richText" ref="richTextEl" class="task-flow-node__label"></div>
    <div v-else class="task-flow-node__label">{{ data.task.name }}</div>
    <div v-if="taskStore.appearance.showTags && data.task.tags.length" class="task-flow-node__tags">
      <span
        v-for="tag in data.task.tags"
        :key="tag"
        class="ft-tag"
        :style="{ '--ft-tag-hue': taskStore.tagHues.get(tag) ?? 0 }"
      >{{ tag.replace(/^#/, '') }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onBeforeUnmount } from 'vue';
import { Handle, Position } from '@vue-flow/core';
import { Component, MarkdownRenderer } from 'obsidian';
import { useTaskStore } from '../store';
import { getApp } from '../pluginContext';

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
});

const taskStore = useTaskStore();

// The Tasks plugin's six priorities ('0' Highest .. '5' Lowest, '3' None),
// each but None with its own font size and background from the Node Style
// panel. None, and any value not listed, uses the panel's Size and
// Background.
const PRIORITY_TIER = { '0': 'highest', '1': 'high', '2': 'medium', '4': 'low', '5': 'lowest' };

// Appearance keys of each tier; see TIERS in AppearancePanel.vue.
const TIER_KEYS = {
  highest: { size: 'highestFontSize', bg: 'highestBg' },
  high: { size: 'highFontSize', bg: 'highBg' },
  medium: { size: 'mediumFontSize', bg: 'mediumBg' },
  none: { size: 'fontSize', bg: 'nodeBg' },
  low: { size: 'lowFontSize', bg: 'lowBg' },
  lowest: { size: 'lowestFontSize', bg: 'lowestBg' }
};

const nodeStyle = computed(() => {
  const a = taskStore.appearance;
  const keys = TIER_KEYS[PRIORITY_TIER[props.data.task.priority] ?? 'none'];
  return {
    background: a[keys.bg],
    border: `1px solid ${a.nodeBorder}`,
    color: a.nodeText,
    fontSize: `${a[keys.size]}px`
  };
});

// Lifecycle handle MarkdownRenderer.render needs to attach/detach anything
// the rendered markdown creates (e.g. live embeds); one per node.
const mdComponent = new Component();
mdComponent.load();
onBeforeUnmount(() => mdComponent.unload());

const richTextEl = ref(null);

// Renders only when the text, its note or the setting actually changes. The
// graph hands every node a fresh data object whenever anything on it
// changes, a highlight for instance; re-rendering on that replaced the
// node's inner elements between the two clicks of a double click, so the
// browser never reported the double click, and it redrew every node on
// every click besides.
// Each value is its own watch source, so Vue compares them one by one; a
// single getter returning an array would count as changed on every
// evaluation, since the array is new each time.
watch(
  [
    () => taskStore.appearance.richText,
    richTextEl,
    () => props.data.task.name,
    () => props.data.task.path
  ],
  ([richText, el, name, path]) => {
    const app = getApp();
    if (!richText || !el || !app) return;
    el.empty();
    MarkdownRenderer.render(app, name, el, path, mdComponent);
  },
  { flush: 'post', immediate: true }
);
</script>

<style scoped>
.task-flow-node {
  max-width: 200px;
  padding: 6px 10px;
  border-radius: 6px;
  line-height: 1.3;
  white-space: normal;
  word-break: break-word;
}

.task-flow-node--done {
  text-decoration: line-through;
  opacity: 0.6;
}

.ft-node-handle--hidden {
  opacity: 0;
  pointer-events: none;
}

/* On a touch screen the handle dots are too small to hit with a finger, and
   a touch that misses them drags the node instead. An invisible ring around
   each dot makes the area that starts a connection finger sized. */
@media (pointer: coarse) {
  .ft-node-handle:not(.ft-node-handle--hidden)::after {
    content: '';
    position: absolute;
    inset: -14px;
    border-radius: 50%;
  }
}

.task-flow-node__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 4px;
}

/* Tag chip colors come from one hue per tag (assigned in utils/tagColor.js); light
   and dark themes only differ in lightness, so a tag keeps its color family
   when Obsidian's theme changes. Also used by the filter panel. */
:global(.ft-tag) {
  display: inline-block;
  padding: 0 6px;
  border-radius: 8px;
  font-size: 0.8em;
  line-height: 1.5;
  white-space: nowrap;
  text-decoration: none;
  background: hsl(var(--ft-tag-hue) 75% 91%);
  color: hsl(var(--ft-tag-hue) 55% 30%);
  border: 1px solid hsl(var(--ft-tag-hue) 55% 80%);
}

:global(.theme-dark .ft-tag) {
  background: hsl(var(--ft-tag-hue) 35% 24%);
  color: hsl(var(--ft-tag-hue) 70% 82%);
  border-color: hsl(var(--ft-tag-hue) 35% 36%);
}

/* MarkdownRenderer wraps plain text in a <p>, and Obsidian's own global CSS
   puts default vertical margin on <p> — that's the extra height rich-text
   mode had that the plain-text branch never did. */
.task-flow-node__label :deep(p) {
  margin: 0;
}
</style>
