<template>
  <!-- The two actions used most, always in sight at the top of the rail and
       drawn in the accent color, set apart from the cards by having no
       frame of their own, and Reset, which clears highlights and focus. -->
  <div class="ft-action-bar">
    <button class="mod-cta" title="Arrange all nodes in the chosen direction" @click="$emit('layout')">Layout</button>
    <button class="mod-cta" title="Fit the whole graph in the view" @click="$emit('overview')">Overview</button>
    <button title="Clear every highlight and the focus" @click="$emit('reset')">Reset</button>
  </div>
</template>

<script setup>
defineEmits(['layout', 'overview', 'reset']);
</script>

<style scoped>
.ft-action-bar {
  width: 250px;
  box-sizing: border-box;
  display: flex;
  gap: 6px;
}

.ft-action-bar button {
  flex: 1 1 0;
  font-weight: 600;
}
</style>
