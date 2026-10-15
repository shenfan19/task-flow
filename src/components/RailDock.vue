<template>
  <!-- The one frame around the whole control column. Open, it is a single
       card whose header is the handle to drag it by; folded, it is a small
       gear button at the same spot. Both can be dragged, and the position and
       open state are remembered. -->
  <div ref="root" class="ft-left-rail ft-dock" :class="{ 'ft-dock--open': open }" :style="{ left: pos.x + 'px', top: pos.y + 'px' }">
    <button
      v-if="!open"
      class="ft-dock__gear clickable-icon"
      title="Tasks Flowchart controls (drag to move)"
      @pointerdown="startDrag"
      @click="onGearClick"
    >⚙</button>
    <template v-else>
      <div class="ft-dock__head" title="Drag to move" @pointerdown="startDrag">
        <span class="ft-dock__grip">⋯⋯</span>
        <button class="ft-dock__fold clickable-icon" title="Fold the controls" @pointerdown.stop @click="setOpen(false)">–</button>
      </div>
      <div class="ft-dock__body">
        <slot />
      </div>
    </template>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';

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

const onGearClick = () => {
  if (!justDragged) setOpen(true);
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

.ft-dock__gear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  font-size: 16px;
  cursor: grab;
  background: none;
  border: none;
  box-shadow: none;
}

.ft-dock__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 4px 2px 28px;
  cursor: grab;
  user-select: none;
  border-bottom: 1px solid var(--background-modifier-border, #d0d4da);
}

.ft-dock__grip {
  flex: 1 1 auto;
  text-align: center;
  letter-spacing: 2px;
  line-height: 1;
  color: var(--text-faint, #999);
}

.ft-dock__fold {
  width: 22px;
  height: 22px;
  padding: 0;
  background: none;
  border: none;
  box-shadow: none;
}

.ft-dock__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 6px 6px 8px;
}
</style>
