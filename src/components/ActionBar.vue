<template>
  <!-- The two actions used most, always in sight at the top of the rail and
       drawn in the accent color, and Reset, which clears highlights and
       focus, with the task search under them. Framed like the cards below but
       with no title, so the Profile row under it, the one control with no
       frame, stands out. -->
  <div class="ft-action-bar">
    <div class="ft-action-buttons">
      <button class="mod-cta" title="Arrange all nodes in the chosen direction" @click="$emit('layout')">Layout</button>
      <button class="mod-cta" title="Fit the whole graph in the view" @click="$emit('overview')">Overview</button>
      <button title="Clear every highlight and the focus" @click="$emit('reset')">Reset</button>
    </div>
    <!-- Search: matching nodes are lit on the graph and the rest fade. Enter
         jumps to the next match, Shift+Enter to the previous, Esc clears. -->
    <div class="ft-search-row">
      <div class="ft-search-field">
      <input
        type="text"
        class="ft-search-input"
        placeholder="Search tasks"
        title="Searches task text, tags and note names. Enter jumps to the next match, Esc clears."
        :value="search"
        @input="$emit('update:search', $event.target.value)"
        @keydown.enter.prevent="$emit('next-hit', $event.shiftKey ? -1 : 1)"
        @keydown.esc="$emit('update:search', '')"
      >
      <!-- A span rather than a button, like the tag chips: Obsidian's global
           button styles would paint a frame around it. -->
      <span
        v-if="search"
        class="ft-search-clear"
        role="button"
        tabindex="0"
        aria-label="Clear search"
        title="Clear search"
        @click="clear"
        @keydown.enter.prevent="clear"
      >×</span>
      </div>
      <span v-if="search.trim()" class="ft-search-count">{{ searchCount }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  search: { type: String, default: '' },
  searchCount: { type: Number, default: 0 }
});
const emit = defineEmits(['layout', 'overview', 'reset', 'update:search', 'next-hit']);

const clear = () => emit('update:search', '');
</script>

<style scoped>
.ft-action-bar {
  width: 250px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 6px;
  border-radius: 8px;
  border: 1px solid var(--background-modifier-border, #d0d4da);
  background: var(--background-primary, #fff);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.ft-action-buttons {
  display: flex;
  gap: 6px;
}

.ft-action-buttons button {
  flex: 1 1 0;
  font-weight: 600;
}

.ft-search-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ft-search-field {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  display: flex;
}

.ft-search-input {
  width: 100%;
  padding-right: 24px;
}

.ft-search-clear {
  position: absolute;
  top: 50%;
  right: 6px;
  transform: translateY(-50%);
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  color: var(--text-muted, #666);
}

.ft-search-clear:hover {
  color: var(--text-normal, #222);
}

.ft-search-count {
  font-size: 0.8rem;
  color: var(--text-muted, #666);
  white-space: nowrap;
}
</style>
