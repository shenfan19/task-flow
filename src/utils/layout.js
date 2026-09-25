import dagre from '@dagrejs/dagre';

// Only used as a fallback for a node dagre is asked to place before Vue Flow
// has measured its real rendered size (see TaskGraphView.vue's runAutoLayout,
// which passes each node's actual dimensions when available).
const DEFAULT_NODE_WIDTH = 180;
const DEFAULT_NODE_HEIGHT = 40;

// Runs a hierarchical (dagre) layout over the given nodes/edges and returns
// new {id, x, y} positions. Only called on explicit user action (see the
// "Layout" button in TaskGraphView.vue) so it never fights a manual drag.
// Each node may carry its own {width, height}; using the real rendered size
// rather than one fixed size for every node is what makes a TB/BT column
// actually come out centered instead of visually skewed to one side, since
// task text length varies a lot from node to node.
function runDagre(nodes, edges, direction) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 40, ranksep: 60 });

  nodes.forEach((node) => {
    g.setNode(node.id, sizeOf(node));
  });
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);
  return g;
}

const sizeOf = (node) => ({
  width: node.width || DEFAULT_NODE_WIDTH,
  height: node.height || DEFAULT_NODE_HEIGHT
});

export function layoutWithDagre(nodes, edges, direction = 'TB') {
  const g = runDagre(nodes, edges, direction);

  return nodes.map((node) => {
    const { x, y } = g.node(node.id);
    const { width, height } = sizeOf(node);
    // dagre positions are node centers; Vue Flow positions are top-left corners
    return { id: node.id, x: x - width / 2, y: y - height / 2 };
  });
}

// Minimum clearance kept between two nodes when spreading out ones whose
// dates put them on top of each other.
const MAIN_GAP = 4;
const CROSS_GAP = 20;

// Where an undated task goes on the axis: midway between the latest dated
// task it (transitively) depends on and the earliest dated task that depends
// on it, one day after/before when only one side exists, and a little before
// the earliest date when neither does. Searches stop at the first dated task
// on each path, since anything past it is already bounded by it.
function estimateUndatedDays(nodes, edges, minDay) {
  const dayById = new Map(nodes.map((n) => [n.id, n.day ?? null]));
  const upstream = new Map();
  const downstream = new Map();
  for (const edge of edges) {
    if (!upstream.has(edge.target)) upstream.set(edge.target, []);
    upstream.get(edge.target).push(edge.source);
    if (!downstream.has(edge.source)) downstream.set(edge.source, []);
    downstream.get(edge.source).push(edge.target);
  }

  const nearestDated = (startId, neighbors, pick) => {
    let best = null;
    const seen = new Set([startId]);
    const queue = [...(neighbors.get(startId) || [])];
    while (queue.length) {
      const id = queue.shift();
      if (seen.has(id)) continue;
      seen.add(id);
      const day = dayById.get(id);
      if (day !== null && day !== undefined) {
        best = best === null ? day : pick(best, day);
        continue;
      }
      queue.push(...(neighbors.get(id) || []));
    }
    return best;
  };

  const estimated = new Map();
  for (const node of nodes) {
    if (dayById.get(node.id) !== null) continue;
    const after = nearestDated(node.id, upstream, Math.max);
    const before = nearestDated(node.id, downstream, Math.min);
    let day;
    if (after !== null && before !== null) day = (after + before) / 2;
    else if (after !== null) day = after + 1;
    else if (before !== null) day = before - 1;
    else day = minDay - 2;
    estimated.set(node.id, day);
  }
  return estimated;
}

// Time-axis layout: along the flow direction each node's center sits at its
// date (node.day, a whole-day number, see taskDay in the store), scaled by
// pxPerDay; across it, dagre's ordering is kept so its crossing reduction
// still applies. Nodes that end up overlapping (same or nearby dates) are
// pushed sideways, in dagre's order, until they clear. Returns null when no
// node has a date, so the caller can fall back to the plain layout.
export function layoutWithTimeAxis(nodes, edges, direction = 'TB', pxPerDay = 40) {
  const datedDays = nodes.map((n) => n.day).filter((d) => d !== null && d !== undefined);
  if (datedDays.length === 0) return null;
  const minDay = Math.min(...datedDays);

  const g = runDagre(nodes, edges, direction);
  const vertical = direction === 'TB' || direction === 'BT';
  const sign = direction === 'BT' || direction === 'RL' ? -1 : 1;
  const estimated = estimateUndatedDays(nodes, edges, minDay);

  const items = nodes.map((node) => {
    const { width, height } = sizeOf(node);
    const center = g.node(node.id);
    const day = node.day ?? estimated.get(node.id);
    return {
      id: node.id,
      width,
      height,
      main: sign * (day - minDay) * pxPerDay,
      cross: vertical ? center.x : center.y,
      mainSize: vertical ? height : width,
      crossSize: vertical ? width : height
    };
  });

  items.sort((a, b) => a.cross - b.cross);
  const placed = [];
  for (const item of items) {
    for (let guard = 0; guard < placed.length + 1; guard++) {
      const hit = placed.find((p) =>
        Math.abs(p.main - item.main) < (p.mainSize + item.mainSize) / 2 + MAIN_GAP &&
        Math.abs(p.cross - item.cross) < (p.crossSize + item.crossSize) / 2 + CROSS_GAP
      );
      if (!hit) break;
      item.cross = hit.cross + (hit.crossSize + item.crossSize) / 2 + CROSS_GAP;
    }
    placed.push(item);
  }

  const positions = items.map((item) => {
    const cx = vertical ? item.cross : item.main;
    const cy = vertical ? item.main : item.cross;
    return { id: item.id, x: cx - item.width / 2, y: cy - item.height / 2 };
  });
  return { positions, info: { minDay, pxPerDay, direction } };
}
