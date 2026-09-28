<template>
  <!-- One framed card of the left rail: a title bar that folds the card, and
       its controls below. The three panels share it so they line up as one
       column of equal cards. -->
  <div class="ft-card" :class="{ 'ft-card--open': open, 'ft-card--fixed': !collapsible }">
    <div
      class="ft-card__head"
      :role="collapsible ? 'button' : undefined"
      :tabindex="collapsible ? 0 : undefined"
      @click="toggle"
      @keydown.enter.prevent="toggle"
    >
      <span class="ft-card__title">{{ title }}</span>
      <span v-if="collapsible" class="ft-card__chevron">{{ open ? '▲' : '▼' }}</span>
    </div>
    <div v-show="open" class="ft-card__body">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  // A card that cannot be folded is always open.
  collapsible: {
    type: Boolean,
    default: true
  },
  // Whether a foldable card starts unfolded; folded by default, like
  // Obsidian's graph view controls.
  initiallyOpen: {
    type: Boolean,
    default: false
  }
});

const open = ref(!props.collapsible || props.initiallyOpen);

const toggle = () => {
  if (props.collapsible) open.value = !open.value;
};
</script>

<style scoped>
.ft-card {
  width: 250px;
  box-sizing: border-box;
  border-radius: 8px;
  border: 1px solid var(--background-modifier-border, #d0d4da);
  background: var(--background-primary, #fff);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  font-size: 12px;
}

.ft-card__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
}

.ft-card--fixed .ft-card__head {
  cursor: default;
}

.ft-card--open .ft-card__head {
  border-bottom: 1px solid var(--background-modifier-border, #d0d4da);
}

.ft-card__chevron {
  font-size: 10px;
  color: var(--text-muted, #666);
}

/* Long cards (the filters) scroll inside themselves instead of running off
   the bottom of the view. */
.ft-card__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 10px 10px;
  max-height: calc(100vh - 220px);
  overflow-y: auto;
}

/* The panels were written with Bootstrap class names, but bootstrap.css is
   never loaded (see App.vue). These few rules give those names the spacing
   they were meant to have, inside the card only. */
.ft-card__body :deep(.d-flex) {
  display: flex;
  align-items: center;
}

.ft-card__body :deep(.gap-1) {
  gap: 4px;
}

.ft-card__body :deep(.gap-3) {
  gap: 12px;
}

.ft-card__body :deep(.w-100),
.ft-card__body :deep(select),
.ft-card__body :deep(input[type='text']) {
  width: 100%;
  box-sizing: border-box;
}

.ft-card__body :deep(.form-label) {
  display: block;
  margin-bottom: 4px;
  font-weight: 600;
  color: var(--text-muted, #666);
}

.ft-card__body :deep(.form-check) {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ft-card__body :deep(.mb-1),
.ft-card__body :deep(.mb-2),
.ft-card__body :deep(.mb-3),
.ft-card__body :deep(.mt-2) {
  margin: 0;
}
</style>
