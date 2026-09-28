<template>
  <!-- The two actions used most, always in sight at the top of the rail and
       drawn in the accent color, apart from the settings in the cards. -->
  <div class="ft-action-bar">
    <button class="mod-cta" title="Arrange all nodes in the chosen direction" @click="$emit('layout')">Layout</button>
    <button class="mod-cta" title="Fit the whole graph in the view" @click="$emit('overview')">Overview</button>
  </div>
</template>

<script setup>
defineEmits(['layout', 'overview']);
</script>

<style scoped>
.ft-action-bar {
  width: 250px;
  box-sizing: border-box;
  display: flex;
  gap: 6px;
  padding: 6px;
  border-radius: 8px;
  border: 1px solid var(--background-modifier-border, #d0d4da);
  background: var(--background-primary, #fff);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.ft-action-bar button {
  flex: 1 1 0;
  font-weight: 600;
}
</style>
