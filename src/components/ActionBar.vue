<template>
  <!-- The two actions used most, always in sight at the top of the rail and
       drawn in the accent color, and Reset, which clears highlights and
       focus. Frameless, inside the dock's single frame. -->
  <div class="ft-action-bar">
    <div class="ft-action-buttons">
      <button class="mod-cta" title="Arrange all nodes in the chosen direction" @click="$emit('layout')">Layout</button>
      <button class="mod-cta" title="Fit the whole graph in the view" @click="$emit('overview')">Overview</button>
      <button title="Clear every highlight and the focus" @click="$emit('reset')">Reset</button>
    </div>
  </div>
</template>

<script setup>
defineEmits(['layout', 'overview', 'reset']);
</script>

<style scoped>
.ft-action-bar {
  width: 100%;
  box-sizing: border-box;
}

.ft-action-buttons {
  display: flex;
  gap: 4px;
}

/* No frame on the buttons: a light tint at rest, stronger under the pointer. */
.ft-action-buttons button {
  flex: 1 1 0;
  font-weight: 600;
  background: color-mix(in srgb, var(--text-normal, #222) 9%, transparent);
  border: none;
  box-shadow: none;
  color: var(--text-normal, #222);
}

.ft-action-buttons button.mod-cta {
  color: var(--interactive-accent, #5b6ee1);
  background: color-mix(in srgb, var(--interactive-accent, #5b6ee1) 14%, transparent);
}

.ft-action-buttons button:hover {
  background: color-mix(in srgb, var(--text-normal, #222) 16%, transparent);
}

.ft-action-buttons button.mod-cta:hover {
  background: color-mix(in srgb, var(--interactive-accent, #5b6ee1) 26%, transparent);
}
</style>
