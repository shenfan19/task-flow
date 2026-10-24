<template>
  <!-- The first row of the open panel: Layout, which arranges the nodes and
       fits them in the view, large and in the accent tint, and Reset, which
       clears highlights and focus, smaller beside it. Frameless, inside the
       dock's single frame. -->
  <div class="ft-action-buttons">
    <button class="ft-layout mod-cta" title="Arrange all nodes in the chosen direction, then fit the graph in the view" @click="$emit('layout')">Layout</button>
    <button class="ft-reset" title="Clear every highlight and the focus" @click="$emit('reset')">Reset</button>
  </div>
</template>

<script setup>
defineEmits(['layout', 'reset']);
</script>

<style scoped>
.ft-action-buttons {
  display: flex;
  gap: 4px;
  width: 100%;
  box-sizing: border-box;
}

/* No frame on the buttons: a light tint at rest, stronger under the pointer.
   Layout takes most of the row and keeps the normal text color. */
.ft-action-buttons button {
  border: none;
  box-shadow: none;
  color: var(--text-normal, #222);
  background: color-mix(in srgb, var(--text-normal, #222) 9%, transparent);
}

.ft-action-buttons button:hover {
  background: color-mix(in srgb, var(--text-normal, #222) 16%, transparent);
}

.ft-layout {
  flex: 3 1 0;
  font-weight: 600;
}

.ft-layout.mod-cta {
  background: color-mix(in srgb, var(--interactive-accent, #5b6ee1) 22%, transparent);
}

.ft-layout.mod-cta:hover {
  background: color-mix(in srgb, var(--interactive-accent, #5b6ee1) 32%, transparent);
}

.ft-reset {
  flex: 1 1 0;
  font-size: var(--font-ui-smaller, 12px);
  color: var(--text-muted, #666);
}
</style>
