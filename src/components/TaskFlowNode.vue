<template>
  <div
    class="task-flow-node"
    :class="{ 'task-flow-node--done': data.task.completed }"
    :style="nodeStyle"
  >
    <!-- One source + one target handle per side, stacked exactly on top of
         each other, so an edge can be anchored to whichever side is nearest
         regardless of whether this node is that edge's source or target.
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

const nodeStyle = computed(() => ({
  background: taskStore.appearance.nodeBg,
  border: `1px solid ${taskStore.appearance.nodeBorder}`,
  color: taskStore.appearance.nodeText,
  fontSize: `${taskStore.appearance.fontSize}px`
}));

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

/* MarkdownRenderer wraps plain text in a <p>, and Obsidian's own global CSS
   puts default vertical margin on <p> — that's the extra height rich-text
   mode had that the plain-text branch never did. */
.task-flow-node__label :deep(p) {
  margin: 0;
}
</style>
