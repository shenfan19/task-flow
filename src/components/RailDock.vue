<template>
  <!-- The one frame around the whole control column. Its header has the fold
       button (a gear when folded, a dash when open) on the left. Folded, the
       header also carries Layout, the action used most, so it stays one click
       away; open, Layout is the first row of the body. The header is the
       handle to drag it by, and the position and open state are remembered. -->
  <div ref="root" class="ft-left-rail ft-dock" :class="{ 'ft-dock--open': open }" :style="{ left: pos.x + 'px', top: pos.y + 'px' }">
    <div class="ft-dock__head" title="Drag to move" @pointerdown="startDrag">
      <button
        class="ft-dock__toggle clickable-icon"
        :title="open ? 'Fold the controls' : 'Open the controls (drag to move)'"
        @click="onToggleClick"
      >{{ open ? '–' : '⚙' }}</button>
      <span v-if="open" class="ft-dock__grip">⋯⋯</span>
      <button
        v-else
        class="ft-dock__action mod-cta"
        title="Arrange the nodes, then fit the graph in the view"
        @pointerdown.stop
        @click="$emit('layout')"
      >Layout</button>
    </div>
    <div v-if="open" class="ft-dock__body">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';

defineEmits(['layout']);

const STORAGE_KEY = 'task-flow-dock';
const MARGIN = 4;
const DRAG_THRESHOLD = 4;

const load = () => {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
};

const saved = load();
const open = ref(saved.open ?? true);
const pos = reactive({ x: Number.isFinite(saved.x) ? saved.x : 12, y: Number.isFinite(saved.y) ? saved.y : 12 });
const root = ref(null);

const save = () => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ open: open.value, x: pos.x, y: pos.y }));
  } catch {
    // Storage can be unavailable; the dock then just forgets its place.
  }
};

// Keeps at least the top-left corner reachable inside the view.
const clamp = () => {
  const parent = root.value?.offsetParent;
  if (!parent) return;
  const w = root.value.offsetWidth;
  pos.x = Math.min(Math.max(MARGIN, pos.x), Math.max(MARGIN, parent.clientWidth - Math.min(w, 60) - MARGIN));
  pos.y = Math.min(Math.max(MARGIN, pos.y), Math.max(MARGIN, parent.clientHeight - 40 - MARGIN));
};

const setOpen = (value) => {
  open.value = value;
  save();
};

let drag = null;
let justDragged = false;

const startDrag = (event) => {
  if (event.button !== 0) return;
  drag = { x: event.clientX, y: event.clientY, px: pos.x, py: pos.y, moved: false };
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', endDrag);
};

const onMove = (event) => {
  if (!drag) return;
  const dx = event.clientX - drag.x;
  const dy = event.clientY - drag.y;
  if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
  drag.moved = true;
  pos.x = drag.px + dx;
  pos.y = drag.py + dy;
  clamp();
};

const endDrag = () => {
  window.removeEventListener('pointermove', onMove);
  window.removeEventListener('pointerup', endDrag);
  if (drag?.moved) {
    justDragged = true;
    save();
    // The click that follows the release belongs to the drag.
    setTimeout(() => { justDragged = false; }, 0);
  }
  drag = null;
};

const onToggleClick = () => {
  if (!justDragged) setOpen(!open.value);
};

onMounted(() => {
  clamp();
  window.addEventListener('resize', clamp);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', clamp);
  window.removeEventListener('pointermove', onMove);
  window.removeEventListener('pointerup', endDrag);
});
</script>

<style scoped>
.ft-dock {
  position: absolute;
  z-index: 1000;
  box-sizing: border-box;
  border-radius: 8px;
  border: 1px solid var(--background-modifier-border, #d0d4da);
  background: var(--background-primary, #fff);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.ft-dock--open {
  width: 262px;
}

/* The header is the same folded and open, so folding changes only what hangs
   below it; the toggle and Layout stay where they are. */
.ft-dock__head {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 4px 0 0;
  cursor: grab;
  user-select: none;
}

.ft-dock--open .ft-dock__head {
  border-bottom: 1px solid var(--background-modifier-border, #d0d4da);
}

.ft-dock__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 30px;
  height: 30px;
  padding: 0;
  font-size: 16px;
  cursor: grab;
  background: none;
  border: none;
  box-shadow: none;
}

/* Frameless like the old rail buttons: a light tint at rest, stronger under
   the pointer, accent color for Layout. */
.ft-dock__grip {
  flex: 1 1 auto;
  text-align: center;
  letter-spacing: 2px;
  line-height: 1;
  color: var(--text-faint, #999);
}

.ft-dock__action {
  flex: none;
  height: 24px;
  padding: 0 10px;
  font-weight: 600;
  cursor: pointer;
  color: var(--text-normal, #222);
  background: color-mix(in srgb, var(--text-normal, #222) 9%, transparent);
  border: none;
  box-shadow: none;
}

/* The text keeps the normal color: the accent tint is only behind it, so
   Layout never reads dimmer than the rest of the panel. */
.ft-dock__action.mod-cta {
  background: color-mix(in srgb, var(--interactive-accent, #5b6ee1) 22%, transparent);
}

.ft-dock__action:hover {
  background: color-mix(in srgb, var(--text-normal, #222) 16%, transparent);
}

.ft-dock__action.mod-cta:hover {
  background: color-mix(in srgb, var(--interactive-accent, #5b6ee1) 26%, transparent);
}

.ft-dock__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 6px 6px 8px;
}
</style>
