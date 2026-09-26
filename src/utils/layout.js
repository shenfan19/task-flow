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

// Minimum clearance kept between two nodes that share a level on the time
// axis, and between one level and the next.
const CROSS_GAP = 20;
const LEVEL_GAP = 60;

// Assigns every node a level along the flow direction for the time axis.
// Dates decide the order only, not the distance: all tasks sharing a date
// share one level, and a later date always sits on a later level than an
// earlier one. Dependencies then push the rest along, so a dependent task
// lands at least one level past the task it depends on, and undated tasks
// between two dated ones spread out between them. A dependency that
// contradicts the dates, or would loop back through them, is skipped here
// (it is still drawn, in red, by the view).
function assignLevels(nodes, edges) {
  const groupOf = new Map();
  const dayOfGroup = new Map();
  for (const node of nodes) {
    const group = node.day === null || node.day === undefined ? `n:${node.id}` : `d:${node.day}`;
    groupOf.set(node.id, group);
    if (group.startsWith('d:')) dayOfGroup.set(group, node.day);
  }
  const groups = [...new Set(groupOf.values())];
  const next = new Map(groups.map((g) => [g, new Set()]));

  const reaches = (from, to) => {
    const seen = new Set([from]);
    const stack = [from];
    while (stack.length) {
      const g = stack.pop();
      if (g === to) return true;
      for (const n of next.get(g)) {
        if (!seen.has(n)) {
          seen.add(n);
          stack.push(n);
        }
      }
    }
    return false;
  };

  const datedGroups = [...dayOfGroup.keys()].sort((a, b) => dayOfGroup.get(a) - dayOfGroup.get(b));
  for (let i = 1; i < datedGroups.length; i++) next.get(datedGroups[i - 1]).add(datedGroups[i]);

  for (const edge of edges) {
    const a = groupOf.get(edge.source);
    const b = groupOf.get(edge.target);
    if (!a || !b || a === b || next.get(a).has(b)) continue;
    if (reaches(b, a)) continue;
    next.get(a).add(b);
  }

  // Longest path from the sources, so every constraint above holds.
  const indegree = new Map(groups.map((g) => [g, 0]));
  for (const g of groups) for (const n of next.get(g)) indegree.set(n, indegree.get(n) + 1);
  const levelOfGroup = new Map(groups.map((g) => [g, 0]));
  const queue = groups.filter((g) => indegree.get(g) === 0);
  while (queue.length) {
    const g = queue.shift();
    for (const n of next.get(g)) {
      levelOfGroup.set(n, Math.max(levelOfGroup.get(n), levelOfGroup.get(g) + 1));
      indegree.set(n, indegree.get(n) - 1);
      if (indegree.get(n) === 0) queue.push(n);
    }
  }

  return { levelOf: (id) => levelOfGroup.get(groupOf.get(id)), dayOfGroup, levelOfGroup };
}

// Time-axis layout. Along the flow direction nodes sit on the levels from
// assignLevels, each level only as far from the previous one as its nodes
// need, so the axis stretches and shrinks with the tasks rather than
// running at a fixed number of pixels per day. Across it, dagre's ordering
// is kept so its crossing reduction still applies, and nodes on the same
// level are pushed sideways until they clear. Returns the positions plus
// {direction, anchors}: one {main, day} per dated level, which is what the
// ruler interpolates its dates between. With no dated node at all, anchors
// is empty.
export function layoutWithTimeAxis(nodes, edges, direction = 'TB') {
  const g = runDagre(nodes, edges, direction);
  const vertical = direction === 'TB' || direction === 'BT';
  const sign = direction === 'BT' || direction === 'RL' ? -1 : 1;
  const { levelOf, dayOfGroup, levelOfGroup } = assignLevels(nodes, edges);

  const items = nodes.map((node) => {
    const { width, height } = sizeOf(node);
    const center = g.node(node.id);
    return {
      id: node.id,
      width,
      height,
      level: levelOf(node.id),
      cross: vertical ? center.x : center.y,
      mainSize: vertical ? height : width,
      crossSize: vertical ? width : height
    };
  });

  const levelCount = Math.max(0, ...items.map((i) => i.level)) + 1;
  const levelSize = Array(levelCount).fill(0);
  for (const item of items) levelSize[item.level] = Math.max(levelSize[item.level], item.mainSize);
  const levelMain = [0];
  for (let l = 1; l < levelCount; l++) {
    levelMain[l] = levelMain[l - 1] + (levelSize[l - 1] + levelSize[l]) / 2 + LEVEL_GAP;
  }

  items.sort((a, b) => a.cross - b.cross);
  const placed = [];
  for (const item of items) {
    for (const p of placed) {
      if (p.level !== item.level) continue;
      const minCross = p.cross + (p.crossSize + item.crossSize) / 2 + CROSS_GAP;
      if (item.cross < minCross) item.cross = minCross;
    }
    placed.push(item);
  }

  const positions = items.map((item) => {
    const main = sign * levelMain[item.level];
    const cx = vertical ? item.cross : main;
    const cy = vertical ? main : item.cross;
    return { id: item.id, x: cx - item.width / 2, y: cy - item.height / 2 };
  });

  const anchors = [...dayOfGroup.entries()]
    .map(([group, day]) => ({ main: sign * levelMain[levelOfGroup.get(group)], day }))
    .sort((a, b) => a.day - b.day);
  return { positions, info: { direction, anchors } };
}
