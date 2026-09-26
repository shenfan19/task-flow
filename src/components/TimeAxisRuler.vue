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

// {direction, anchors} as produced by layoutWithTimeAxis: anchors are
// {main, day} pairs, one per dated level, giving the canvas coordinate along
// the flow direction where that day sits. The axis is elastic: between two
// anchors days are spread evenly over whatever distance the layout left
// between them, so the scale changes from one stretch to the next.
const props = defineProps({
  info: {
    type: Object,
    required: true
  }
});

const { viewport, dimensions } = useVueFlow();

const DAY_MS = 86400000;
const pad = (n) => String(n).padStart(2, '0');
// Scale used past the ends of the axis when there is no neighboring anchor
// to take one from: a single dated level, or none at all (then the axis
// starts at today, at the top/left edge of the graph).
const FALLBACK_PX_PER_DAY = 40;

const todayDay = () => {
  const now = new Date();
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY_MS;
};

const vertical = computed(() => props.info.direction === 'TB' || props.info.direction === 'BT');
const sign = computed(() => (props.info.direction === 'BT' || props.info.direction === 'RL' ? -1 : 1));

const anchors = computed(() =>
  props.info.anchors.length > 0 ? props.info.anchors : [{ main: 0, day: todayDay() }]
);

// Canvas coordinate of a given day: piecewise-linear through the anchors,
// extended past both ends at the slope of the nearest segment. Only needed
// for today's marker, since every labeled tick sits exactly on an anchor.
const dayToMain = (day) => {
  const list = anchors.value;
  let a = list[0];
  let b = { main: a.main + sign.value * FALLBACK_PX_PER_DAY, day: a.day + 1 };
  if (list.length > 1) {
    let i = 1;
    while (i < list.length - 1 && day > list[i].day) i++;
    [a, b] = [list[i - 1], list[i]];
  }
  return a.main + (day - a.day) * (b.main - a.main) / (b.day - a.day);
};

const toScreen = (main) => {
  const { x, y, zoom } = viewport.value;
  return main * zoom + (vertical.value ? y : x);
};

// Only the dates some task on the canvas actually has get a tick; the days
// in between are interpolated positions with no task on them, and labeling
// them would only add noise. When two such dates come too close on screen,
// the later one is skipped so labels never overlap. Labels carry the year
// only when the dates on the canvas span more than one year.
const MIN_LABEL_GAP_VERTICAL = 16;
const MIN_LABEL_GAP_HORIZONTAL = 46;
const MIN_LABEL_GAP_HORIZONTAL_WITH_YEAR = 66;

const yearOf = (day) => new Date(day * DAY_MS).getUTCFullYear();

const ticks = computed(() => {
  const length = vertical.value ? dimensions.value.height : dimensions.value.width;
  if (!length) return [];
  const days = props.info.anchors.map((a) => a.day);
  const withYear = days.length > 0 && yearOf(Math.min(...days)) !== yearOf(Math.max(...days));
  const gap = vertical.value
    ? MIN_LABEL_GAP_VERTICAL
    : withYear ? MIN_LABEL_GAP_HORIZONTAL_WITH_YEAR : MIN_LABEL_GAP_HORIZONTAL;
  const accepted = [];
  for (const { main, day } of props.info.anchors) {
    const offset = toScreen(main);
    if (offset < 0 || offset > length) continue;
    if (accepted.some((t) => Math.abs(t.offset - offset) < gap)) continue;
    const date = new Date(day * DAY_MS);
    const monthDay = `${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
    const label = withYear ? `${date.getUTCFullYear()}-${monthDay}` : monthDay;
    accepted.push({ day, offset, label });
  }
  return accepted;
});

const todayOffset = computed(() => {
  const offset = toScreen(dayToMain(todayDay()));
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
  border-top: 1px solid #0d6efd;
}

.ft-ruler--horizontal .ft-ruler__tick {
  top: 0;
  height: 8px;
  border-left: 1px solid #0d6efd;
}

.ft-ruler__label {
  color: #0d6efd;
  font-weight: 600;
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
