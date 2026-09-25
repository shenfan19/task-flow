<template>
  <!-- Screen-space overlay: it does not move with the canvas itself; instead
       every tick is recomputed from the current pan/zoom, so the ruler stays
       pinned to the edge of the view while its dates track the nodes. -->
  <div class="ft-ruler" :class="vertical ? 'ft-ruler--vertical' : 'ft-ruler--horizontal'">
    <div
      v-for="tick in ticks"
      :key="tick.day"
      class="ft-ruler__tick"
      :style="tickStyle(tick.offset)"
    >
      <span class="ft-ruler__label">{{ tick.label }}</span>
    </div>
    <div
      v-if="todayOffset !== null"
      class="ft-ruler__today"
      :style="tickStyle(todayOffset)"
      title="Today"
    ></div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useVueFlow } from '@vue-flow/core';

// {minDay, pxPerDay, direction} as produced by layoutWithTimeAxis; a node's
// center along the flow direction is at sign * (day - minDay) * pxPerDay in
// canvas coordinates.
const props = defineProps({
  info: {
    type: Object,
    required: true
  }
});

const { viewport, dimensions } = useVueFlow();

const DAY_MS = 86400000;
const pad = (n) => String(n).padStart(2, '0');

const vertical = computed(() => props.info.direction === 'TB' || props.info.direction === 'BT');
const sign = computed(() => (props.info.direction === 'BT' || props.info.direction === 'RL' ? -1 : 1));

// Screen position (px from the ruler's start edge) of a given day, and back.
const dayToScreen = (day) => {
  const { x, y, zoom } = viewport.value;
  const canvas = sign.value * (day - props.info.minDay) * props.info.pxPerDay;
  return canvas * zoom + (vertical.value ? y : x);
};
const screenToDay = (s) => {
  const { x, y, zoom } = viewport.value;
  const canvas = (s - (vertical.value ? y : x)) / zoom;
  return props.info.minDay + sign.value * canvas / props.info.pxPerDay;
};

// Tick spacing adapts to how many screen pixels one day currently spans, so
// labels never pile up: days when zoomed in, then Mondays, month starts, and
// finally year starts.
const UNITS = [
  { minPx: 28, isTick: () => true, label: (d) => `${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` },
  { minPx: 5, isTick: (d) => d.getUTCDay() === 1, label: (d) => `${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` },
  { minPx: 1.2, isTick: (d) => d.getUTCDate() === 1, label: (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}` },
  { minPx: 0, isTick: (d) => d.getUTCDate() === 1 && d.getUTCMonth() === 0, label: (d) => `${d.getUTCFullYear()}` }
];

const MAX_DAYS_SCANNED = 40000;

const ticks = computed(() => {
  const length = vertical.value ? dimensions.value.height : dimensions.value.width;
  if (!length) return [];
  const pxPerDayOnScreen = props.info.pxPerDay * viewport.value.zoom;
  const unit = UNITS.find((u) => pxPerDayOnScreen >= u.minPx);

  const a = screenToDay(0);
  const b = screenToDay(length);
  const first = Math.floor(Math.min(a, b));
  const last = Math.min(Math.ceil(Math.max(a, b)), first + MAX_DAYS_SCANNED);

  const result = [];
  for (let day = first; day <= last; day++) {
    const date = new Date(day * DAY_MS);
    if (!unit.isTick(date)) continue;
    result.push({ day, offset: dayToScreen(day), label: unit.label(date) });
  }
  return result;
});

const todayOffset = computed(() => {
  const now = new Date();
  const offset = dayToScreen(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY_MS);
  const length = vertical.value ? dimensions.value.height : dimensions.value.width;
  return offset >= 0 && offset <= length ? offset : null;
});

const tickStyle = (offset) => (vertical.value ? { top: `${offset}px` } : { left: `${offset}px` });
</script>

<style scoped>
.ft-ruler {
  position: absolute;
  z-index: 5;
  pointer-events: none;
  background: rgba(255, 255, 255, 0.85);
  color: #6c757d;
  font-size: 10px;
  overflow: hidden;
}

/* Vertical flows get the ruler on the right edge, horizontal ones along the
   bottom, so it never sits under the button rail in the top-left corner. */
.ft-ruler--vertical {
  top: 0;
  right: 0;
  bottom: 0;
  width: 64px;
  border-left: 1px solid #ced4da;
}

.ft-ruler--horizontal {
  left: 0;
  right: 0;
  bottom: 0;
  height: 26px;
  border-top: 1px solid #ced4da;
}

.ft-ruler__tick,
.ft-ruler__today {
  position: absolute;
}

.ft-ruler--vertical .ft-ruler__tick {
  left: 0;
  width: 8px;
  border-top: 1px solid #adb5bd;
}

.ft-ruler--horizontal .ft-ruler__tick {
  top: 0;
  height: 8px;
  border-left: 1px solid #adb5bd;
}

.ft-ruler__label {
  position: absolute;
  white-space: nowrap;
}

.ft-ruler--vertical .ft-ruler__label {
  left: 11px;
  top: -7px;
}

.ft-ruler--horizontal .ft-ruler__label {
  left: 3px;
  top: 9px;
}

.ft-ruler--vertical .ft-ruler__today {
  left: 0;
  right: 0;
  border-top: 2px solid #d32f2f;
}

.ft-ruler--horizontal .ft-ruler__today {
  top: 0;
  bottom: 0;
  border-left: 2px solid #d32f2f;
}
</style>
