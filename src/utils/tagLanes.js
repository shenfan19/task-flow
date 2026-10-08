// Tag lanes: a second pass over positions that layoutWithDagre or
// layoutWithTimeAxis already produced. It only changes the coordinate across
// the flow direction (x in TB/BT, y in LR/RL), so the time axis and every
// node's level along the flow stay exactly as they were. Each node gets one
// lane, its primary tag, and lanes become side-by-side columns (rows in
// LR/RL).
//
// Modes:
//   auto   lanes ordered by where their nodes already sat, then neighbors
//          swapped while that shortens the links between lanes
//   alpha  lanes in tag order A-Z, a fixed order that never reshuffles
//   size   biggest lane first
//   soft   lane order as auto, but nodes are only pulled toward their lane's
//          center, so dagre's own arrangement still shows through
export const LANE_MODES = ['default', 'auto', 'alpha', 'size', 'soft'];
export const LANE_PRIMARIES = ['common', 'rare', 'first'];

const DEFAULT_NODE_WIDTH = 180;
const DEFAULT_NODE_HEIGHT = 40;
const CROSS_GAP = 20;
const LANE_GAP = 40;
const LANE_PAD = 16;
const MAIN_GAP = 4;
const SOFT_KEEP = 0.3; // share of a node's offset from its lane center that soft mode keeps
const NO_TAG = '';

// Which of a node's tags decides its lane: the one most nodes share, the one
// fewest share, or simply the first on the task line. A node without tags
// goes to the last lane.
const primaryTagOf = (tags, counts, primary) => {
  if (!tags || tags.length === 0) return NO_TAG;
  if (primary === 'first') return tags[0];
  const sign = primary === 'rare' ? 1 : -1;
  return [...tags].sort((a, b) => sign * (counts.get(a) - counts.get(b)) || a.localeCompare(b))[0];
};

// Orders lanes by the average cross position of their nodes, then swaps
// neighboring lanes while the total of (links x lane distance) between
// connected lanes goes down.
const orderLanesAuto = (laneTags, meanCross, laneEdges) => {
  const order = [...laneTags].sort((a, b) => meanCross.get(a) - meanCross.get(b) || a.localeCompare(b));
  const cost = () => {
    const pos = new Map(order.map((t, i) => [t, i]));
    let total = 0;
    for (const [key, n] of laneEdges) {
      const [a, b] = key.split('\u0000');
      total += n * Math.abs(pos.get(a) - pos.get(b));
    }
    return total;
  };
  let best = cost();
  for (let pass = 0; pass < 50; pass++) {
    let improved = false;
    for (let i = 0; i + 1 < order.length; i++) {
      [order[i], order[i + 1]] = [order[i + 1], order[i]];
      const c = cost();
      if (c < best) {
        best = c;
        improved = true;
      } else {
        [order[i], order[i + 1]] = [order[i + 1], order[i]];
      }
    }
    if (!improved) break;
  }
  return order;
};

// Pushes nodes sideways until none overlaps another whose stretch along the
// flow direction overlaps its own.
const clearOverlaps = (items) => {
  const sorted = [...items].sort((a, b) => a.cross - b.cross);
  const placed = [];
  for (const item of sorted) {
    for (const p of placed) {
      if (Math.abs(p.main - item.main) >= (p.mainSize + item.mainSize) / 2 + MAIN_GAP) continue;
      const minCross = p.cross + (p.crossSize + item.crossSize) / 2 + CROSS_GAP;
      if (item.cross < minCross) item.cross = minCross;
    }
    placed.push(item);
  }
};

// nodes: [{id, tags, width, height}], edges: [{source, target}], positions:
// [{id, x, y}] top-left, as returned by the layouts in layout.js. Returns the
// new positions plus {direction, lanes: [{tag, start, end}]}, the bands along
// the cross axis that LaneBands.vue draws. info is null in 'default' mode.
export function applyTagLanes(positions, nodes, edges, direction, mode = 'default', primary = 'common') {
  if (!LANE_MODES.includes(mode) || mode === 'default' || nodes.length === 0) {
    return { positions, info: null };
  }
  const vertical = direction === 'TB' || direction === 'BT';
  const posOf = new Map(positions.map((p) => [p.id, p]));
  const tagCounts = new Map();
  for (const n of nodes) for (const t of n.tags ?? []) tagCounts.set(t, (tagCounts.get(t) || 0) + 1);

  const items = nodes.map((n) => {
    const { x, y } = posOf.get(n.id);
    const width = n.width || DEFAULT_NODE_WIDTH;
    const height = n.height || DEFAULT_NODE_HEIGHT;
    return {
      id: n.id,
      width,
      height,
      tag: primaryTagOf(n.tags, tagCounts, primary),
      cross: vertical ? x + width / 2 : y + height / 2,
      main: vertical ? y + height / 2 : x + width / 2,
      crossSize: vertical ? width : height,
      mainSize: vertical ? height : width
    };
  });

  const byLane = new Map();
  for (const item of items) {
    if (!byLane.has(item.tag)) byLane.set(item.tag, []);
    byLane.get(item.tag).push(item);
  }
  const named = [...byLane.keys()].filter((t) => t !== NO_TAG);

  let order;
  if (mode === 'alpha') {
    order = named.sort((a, b) => a.localeCompare(b));
  } else if (mode === 'size') {
    order = named.sort((a, b) => byLane.get(b).length - byLane.get(a).length || a.localeCompare(b));
  } else {
    const meanCross = new Map(
      named.map((t) => [t, byLane.get(t).reduce((s, i) => s + i.cross, 0) / byLane.get(t).length])
    );
    const laneOfNode = new Map(items.map((i) => [i.id, i.tag]));
    const laneEdges = new Map();
    for (const e of edges) {
      const a = laneOfNode.get(e.source);
      const b = laneOfNode.get(e.target);
      if (a === undefined || b === undefined || a === b || a === NO_TAG || b === NO_TAG) continue;
      const key = [a, b].sort().join('\u0000');
      laneEdges.set(key, (laneEdges.get(key) || 0) + 1);
    }
    order = orderLanesAuto(named, meanCross, laneEdges);
  }
  if (byLane.has(NO_TAG)) order.push(NO_TAG);

  // Inside a lane, nodes whose stretches along the flow overlap go on
  // separate tracks side by side; the lane is as wide as its tracks.
  const lanes = [];
  let cursor = 0;
  for (const tag of order) {
    const members = byLane.get(tag).sort((a, b) => a.main - b.main);
    const trackEnds = [];
    for (const item of members) {
      let track = trackEnds.findIndex((end) => end + MAIN_GAP <= item.main - item.mainSize / 2);
      if (track === -1) {
        track = trackEnds.length;
        trackEnds.push(0);
      }
      trackEnds[track] = item.main + item.mainSize / 2;
      item.track = track;
    }
    const trackWidth = Math.max(...members.map((i) => i.crossSize)) + CROSS_GAP;
    const width = trackEnds.length * trackWidth + 2 * LANE_PAD;
    lanes.push({ tag, start: cursor, end: cursor + width, trackWidth, members });
    cursor += width + LANE_GAP;
  }

  for (const lane of lanes) {
    const center = (lane.start + lane.end) / 2;
    const mean = lane.members.reduce((s, i) => s + i.cross, 0) / lane.members.length;
    for (const item of lane.members) {
      if (mode === 'soft') {
        item.cross = center + (item.cross - mean) * SOFT_KEEP;
      } else {
        item.cross = lane.start + LANE_PAD + (item.track + 0.5) * lane.trackWidth;
      }
    }
  }

  let bands = lanes.map((l) => ({ tag: l.tag, start: l.start, end: l.end }));
  if (mode === 'soft') {
    clearOverlaps(items);
    bands = lanes.map((l) => ({
      tag: l.tag,
      start: Math.min(...l.members.map((i) => i.cross - i.crossSize / 2)) - LANE_PAD,
      end: Math.max(...l.members.map((i) => i.cross + i.crossSize / 2)) + LANE_PAD
    }));
  }

  // Lanes start at cross 0; shifting so the first band sits at its own left
  // edge keeps the graph near where it was instead of drifting off screen.
  const origin = Math.min(...positions.map((p) => (vertical ? p.x : p.y)));
  const shift = origin - bands[0].start;
  return {
    positions: items.map((item) => ({
      id: item.id,
      x: (vertical ? item.cross + shift : item.main) - item.width / 2,
      y: (vertical ? item.main : item.cross + shift) - item.height / 2
    })),
    info: {
      direction,
      lanes: bands.map((b) => ({ tag: b.tag, start: b.start + shift, end: b.end + shift }))
    }
  };
}
