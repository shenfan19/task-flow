<template>
  <!-- Screen-space overlay like the date ruler: every band is recomputed from
       the current pan/zoom, so the stripes stay under their nodes and the
       labels stay pinned to the edge of the view. -->
  <div class="ft-lanes" :class="vertical ? 'ft-lanes--vertical' : 'ft-lanes--horizontal'">
    <div
      v-for="band in bands"
      :key="band.key"
      class="ft-lanes__band"
      :style="band.style"
    >
      <span
        class="ft-lanes__label"
        :class="{ 'ft-lanes__label--hued': band.hue !== undefined }"
        :style="{ '--lane-hue': band.hue, fontSize: labelSize }"
      >{{ band.label }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useVueFlow } from '@vue-flow/core';
import { useTaskStore } from '../store';
import { PRIORITY_HUES } from '../utils/taskLineEdits';

// {direction, lanes: [{key, label, kind, start, end}]} as produced by
// applyLanes: start and end are canvas coordinates across the flow direction,
// kind is what the lanes group by, tag, file or priority.
const props = defineProps({
  info: {
    type: Object,
    required: true
  }
});

const taskStore = useTaskStore();
const { viewport } = useVueFlow();

const vertical = computed(() => props.info.direction === 'TB' || props.info.direction === 'BT');

// A lane's hue: the tag's own color, the priority level's, or for a note one
// taken from its path so the same note keeps its color.
const hueOf = (lane, tagHues) => {
  if (lane.kind === 'tag') return lane.key ? tagHues.get(lane.key) : undefined;
  if (lane.kind === 'priority') return PRIORITY_HUES[lane.key];
  if (!lane.key) return undefined;
  let hash = 0;
  for (const ch of lane.key) hash = (hash * 31 + ch.codePointAt(0)) % 360;
  return hash;
};

// Labels start from the nodes' font size and grow with the canvas zoom, so
// they stay readable when zoomed in. Zooming out does not shrink them below
// that size; their anchor positions do not move.
const labelSize = computed(() => `${taskStore.appearance.fontSize * Math.max(1, viewport.value.zoom)}px`);

const bands = computed(() => {
  const { x, y, zoom } = viewport.value;
  const offset = vertical.value ? x : y;
  const hues = taskStore.tagHues;
  return props.info.lanes.map((lane) => {
    const from = lane.start * zoom + offset;
    const size = (lane.end - lane.start) * zoom;
    const hue = hueOf(lane, hues);
    const fill = hue === undefined ? 'rgba(128, 128, 128, 0.07)' : `hsla(${hue}, 70%, 55%, 0.08)`;
    return {
      key: lane.key,
      label: lane.label,
      hue,
      style: vertical.value
        ? { left: `${from}px`, width: `${size}px`, background: fill }
        : { top: `${from}px`, height: `${size}px`, background: fill }
    };
  });
});
</script>

<style scoped>
.ft-lanes {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  overflow: hidden;
}

.ft-lanes__band {
  position: absolute;
}

.ft-lanes--vertical .ft-lanes__band {
  top: 0;
  bottom: 0;
  border-left: 1px dashed var(--background-modifier-border, #d9dde3);
}

.ft-lanes--horizontal .ft-lanes__band {
  left: 0;
  right: 0;
  border-top: 1px dashed var(--background-modifier-border, #d9dde3);
}

/* Vertical flows have the date ruler on the right and the button rail at the
   top left, so their labels sit along the bottom; horizontal flows have the
   ruler along the bottom, so their labels sit at the right edge. */
.ft-lanes__label {
  position: absolute;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  padding: 0 6px;
  /* Black on the light theme, white on the dark one, whatever the lane hue.
     Pure black and white rather than --text-normal, which some themes soften
     to a grey that sinks into the band fill. */
  color: #000;
}


.ft-lanes--vertical .ft-lanes__label {
  left: 0;
  bottom: 4px;
}

.ft-lanes--horizontal .ft-lanes__label {
  right: 84px;
  top: 2px;
}
</style>

<style>
/* Unscoped on purpose: a scoped rule under :global() loses its second half. */
.theme-dark .ft-lanes .ft-lanes__label {
  color: #fff;
}

/* Lanes with a hue tint their label: very dark on the light theme, very
   light on the dark one, still far from the faint band fill. */
.ft-lanes .ft-lanes__label--hued {
  color: hsl(var(--lane-hue) 80% 22%);
}

.theme-dark .ft-lanes .ft-lanes__label--hued {
  color: hsl(var(--lane-hue) 90% 84%);
}
</style>
