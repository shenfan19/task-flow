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
import { computed, ref, watchEffect, onBeforeUnmount } from 'vue';
import { Handle, Position } from '@vue-flow/core';
import { Component, MarkdownRenderer } from 'obsidian';
import { useTaskStore } from '../store';

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
});

const taskStore = useTaskStore();

// Tasks plugin's Priority enum string values; '3' (None) is intentionally
// absent so a normal-priority task just falls back to the uniform appearance
// settings instead of getting its own color.
const PRIORITY_STYLES = {
  '0': { color: '#d32f2f', scale: 1.3 }, // Highest
  '1': { color: '#f57c00', scale: 1.15 }, // High
  '2': { color: '#fbc02d', scale: 1.05 }, // Medium
  '4': { color: '#1976d2', scale: 0.9 }, // Low
  '5': { color: '#757575', scale: 0.8 } // Lowest
};

const nodeStyle = computed(() => {
  const priorityStyle = taskStore.appearance.priorityStyling
    ? PRIORITY_STYLES[props.data.task.priority]
    : undefined;

  return {
    background: taskStore.appearance.nodeBg,
    border: `1px solid ${priorityStyle?.color ?? taskStore.appearance.nodeBorder}`,
    color: taskStore.appearance.nodeText,
    fontSize: `${taskStore.appearance.fontSize * (priorityStyle?.scale ?? 1)}px`
  };
});

// Lifecycle handle MarkdownRenderer.render needs to attach/detach anything
// the rendered markdown creates (e.g. live embeds); one per node.
const mdComponent = new Component();
mdComponent.load();
onBeforeUnmount(() => mdComponent.unload());

const richTextEl = ref(null);

watchEffect(() => {
  if (!taskStore.appearance.richText || !richTextEl.value || !window.app) return;
  richTextEl.value.innerHTML = '';
  MarkdownRenderer.render(
    window.app,
    props.data.task.name,
    richTextEl.value,
    props.data.task.path,
    mdComponent
  );
}, { flush: 'post' });
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
