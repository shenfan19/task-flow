<template>
  <!-- Shown in the middle of the canvas when no task is on the graph, with
       the reason and a way forward. The canvas around it still pans. -->
  <div class="ft-empty">
    <div class="ft-empty__card">
      <div class="ft-empty__title">{{ text.title }}</div>
      <p v-for="line in text.lines" :key="line">{{ line }}</p>
      <div class="ft-empty__buttons">
        <button v-if="reason === 'no-links'" @click="$emit('show-all')">Show all tasks</button>
        <button v-if="reason === 'no-tasks' || reason === 'no-links'" class="mod-cta" @click="$emit('sample')">Create sample note</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  // 'no-plugin', 'no-tasks', 'no-links' or 'filtered'; see emptyReason in
  // TaskGraphView.vue.
  reason: {
    type: String,
    required: true
  }
});

defineEmits(['show-all', 'sample']);

const TEXTS = {
  'no-plugin': {
    title: 'The Tasks plugin is needed',
    lines: ['Install and enable the Tasks plugin from Settings → Community plugins. Tasks Flowchart draws the tasks it finds.']
  },
  'no-tasks': {
    title: 'No tasks yet',
    lines: ['Tasks are checkbox list items in your notes. A sample note shows how to write them and link them into a flowchart.']
  },
  'no-links': {
    title: 'No linked tasks yet',
    lines: [
      'The graph shows tasks that are linked to each other. Show all tasks, then drag from one node onto another to link them.',
      'A sample note shows a whole linked plan.'
    ]
  },
  filtered: {
    title: 'No tasks match the filters',
    lines: ['Change the filters in File Filters, or choose another profile.']
  }
};

const text = computed(() => TEXTS[props.reason]);
</script>

<style scoped>
.ft-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 5;
}

.ft-empty__card {
  pointer-events: auto;
  max-width: 340px;
  padding: 16px 18px;
  border-radius: 8px;
  border: 1px solid var(--background-modifier-border, #d0d4da);
  background: var(--background-primary, #fff);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  font-size: 13px;
  text-align: center;
}

.ft-empty__title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 6px;
}

.ft-empty__card p {
  margin: 0 0 8px;
  color: var(--text-muted, #666);
}

.ft-empty__buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 4px;
}
</style>
