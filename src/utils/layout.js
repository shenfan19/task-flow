import dagre from '@dagrejs/dagre';

// Only used as a fallback for a node dagre is asked to place before Vue Flow
// has measured its real rendered size (see TaskGraphView.vue's runAutoLayout,
// which passes each node's actual dimensions when available).
const DEFAULT_NODE_WIDTH = 180;
const DEFAULT_NODE_HEIGHT = 40;

const COMPONENT_GAP = 80;

const sizeOf = (node) => ({
  width: node.width || DEFAULT_NODE_WIDTH,
  height: node.height || DEFAULT_NODE_HEIGHT
});

// Splits the nodes into groups that are linked to each other, in the order
// the first node of each group appears in `nodes`, so the order does not
// depend on anything but the input.
function connectedComponents(nodes, edges) {
  const parent = new Map(nodes.map((node) => [node.id, node.id]));
  const find = (id) => {
    while (parent.get(id) !== id) {
      parent.set(id, parent.get(parent.get(id)));
      id = parent.get(id);
    }
    return id;
  };
  for (const edge of edges) {
    if (!parent.has(edge.source) || !parent.has(edge.target)) continue;
    parent.set(find(edge.source), find(edge.target));
  }
  const groups = new Map();
  for (const node of nodes) {
    const root = find(node.id);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(node);
  }
  return [...groups.values()];
}

// Runs a hierarchical (dagre) layout over the given nodes/edges, one linked
// group at a time, and returns a Map of node id -> {x, y} center. Every group
// is laid out on its own, then the groups are set side by side across the
// flow direction in input order, all starting at 0 along it. A change to one
// group therefore cannot move the nodes of another, and unrelated tasks
// cannot pull a chain out of line. Each node may carry its own {width,
// height}; using the real rendered size rather than one fixed size for every
// node is what makes a TB/BT column actually come out centered instead of
// visually skewed to one side, since task text length varies a lot from node
// to node.
function runDagre(nodes, edges, direction) {
  const vertical = direction === 'TB' || direction === 'BT';
  const centers = new Map();
  let cursor = 0;

  for (const group of connectedComponents(nodes, edges)) {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: direction, nodesep: 40, ranksep: 60 });
    const ids = new Set(group.map((node) => node.id));
    group.forEach((node) => g.setNode(node.id, sizeOf(node)));
    edges.forEach((edge) => {
      if (edge.source !== edge.target && ids.has(edge.source) && ids.has(edge.target)) {
        g.setEdge(edge.source, edge.target);
      }
    });
    dagre.layout(g);

    let minCross = Infinity;
    let maxCross = -Infinity;
    for (const node of group) {
      const { x, y } = g.node(node.id);
      const { width, height } = sizeOf(node);
      const cross = vertical ? x : y;
      const half = (vertical ? width : height) / 2;
      minCross = Math.min(minCross, cross - half);
      maxCross = Math.max(maxCross, cross + half);
    }
    for (const node of group) {
      const { x, y } = g.node(node.id);
      centers.set(node.id, vertical ? { x: x - minCross + cursor, y } : { x, y: y - minCross + cursor });
    }
    cursor += maxCross - minCross + COMPONENT_GAP;
  }
  return centers;
}

export function layoutWithDagre(nodes, edges, direction = 'TB') {
  const centers = runDagre(nodes, edges, direction);

  return nodes.map((node) => {
    const { x, y } = centers.get(node.id);
    const { width, height } = sizeOf(node);
    // dagre positions are node centers; Vue Flow positions are top-left corners
    return { id: node.id, x: Math.round(x - width / 2), y: Math.round(y - height / 2) };
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

// Moves the nodes of each level apart just far enough that none touches
// another, as little as possible and symmetrically: a crowd is spread out
// around where it was, instead of everything being pushed the same way, which
// stacked up from level to level into a slant. Within a level the order given
// by dagre is kept; the new centers minimise the total squared move under the
// spacing rule (pool adjacent violators on the gaps removed).
function spreadLevels(items) {
  const byLevel = new Map();
  for (const item of items) {
    if (!byLevel.has(item.level)) byLevel.set(item.level, []);
    byLevel.get(item.level).push(item);
  }
  for (const row of byLevel.values()) {
    row.sort((a, b) => a.cross - b.cross);
    // offset[i]: distance from row[0]'s center to row[i]'s once packed.
    const offset = [0];
    for (let i = 1; i < row.length; i++) {
      offset[i] = offset[i - 1] + (row[i - 1].crossSize + row[i].crossSize) / 2 + CROSS_GAP;
    }
    // y[i] = cross[i] - offset[i] has to be non-decreasing; pool blocks that are not.
    const blocks = [];
    row.forEach((item, i) => {
      blocks.push({ sum: item.cross - offset[i], count: 1 });
      while (blocks.length > 1) {
        const last = blocks[blocks.length - 1];
        const prev = blocks[blocks.length - 2];
        if (prev.sum / prev.count <= last.sum / last.count) break;
        blocks.splice(blocks.length - 2, 2, { sum: prev.sum + last.sum, count: prev.count + last.count });
      }
    });
    let i = 0;
    for (const block of blocks) {
      for (let k = 0; k < block.count; k++, i++) row[i].cross = block.sum / block.count + offset[i];
    }
  }
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
  const centers = runDagre(nodes, edges, direction);
  const vertical = direction === 'TB' || direction === 'BT';
  const sign = direction === 'BT' || direction === 'RL' ? -1 : 1;
  const { levelOf, dayOfGroup, levelOfGroup } = assignLevels(nodes, edges);

  const items = nodes.map((node) => {
    const { width, height } = sizeOf(node);
    const center = centers.get(node.id);
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

  spreadLevels(items);

  const positions = items.map((item) => {
    const main = sign * levelMain[item.level];
    const cx = vertical ? item.cross : main;
    const cy = vertical ? main : item.cross;
    return { id: item.id, x: Math.round(cx - item.width / 2), y: Math.round(cy - item.height / 2) };
  });

  const anchors = [...dayOfGroup.entries()]
    .map(([group, day]) => ({ main: sign * levelMain[levelOfGroup.get(group)], day }))
    .sort((a, b) => a.day - b.day);
  return { positions, info: { direction, anchors } };
}

// A long link and the shorter ones next to it can look like one: with a -> b,
// b -> c and a -> c, a node b on or near the straight line from a to c puts
// a -> b and b -> c along a -> c, and it can no longer be told which way the
// flow goes. A link that only passes behind a node, or runs diagonally well
// clear of the others, is left alone.
const MIN_SEPARATION_RATIO = 0.35;
const MIN_SEPARATION = 40;
const SIDE_GAP = 24;
const SIDE_TRIES = 6;
const SEPARATE_PASSES = 3;

// Moves the nodes in the middle of such a link aside, together, to the
// nearest free spot, so that each is at least about a third of its width from
// the long link. `positions` are {id, x, y} top-left corners, `nodes` carry
// the sizes and `edges` the source and target ids. Returns new positions;
// nothing else is moved.
export function separateOverlappingLinks(positions, nodes, edges, direction = 'TB') {
  const vertical = direction === 'TB' || direction === 'BT';
  const size = new Map(nodes.map((node) => [node.id, sizeOf(node)]));
  const pos = new Map(positions.map((p) => [p.id, { x: p.x, y: p.y }]));
  const linked = new Set();
  for (const edge of edges) {
    linked.add(`${edge.source}\u0000${edge.target}`);
    linked.add(`${edge.target}\u0000${edge.source}`);
  }

  const crossOf = (id) => (vertical ? pos.get(id).x + size.get(id).width / 2 : pos.get(id).y + size.get(id).height / 2);
  const mainOf = (id) => (vertical ? pos.get(id).y + size.get(id).height / 2 : pos.get(id).x + size.get(id).width / 2);
  const crossSize = (id) => (vertical ? size.get(id).width : size.get(id).height);
  const separationOf = (id) => Math.max(MIN_SEPARATION, crossSize(id) * MIN_SEPARATION_RATIO);
  const overlaps = (id, shift, others) => {
    const a = pos.get(id);
    const sa = size.get(id);
    const ax = a.x + (vertical ? shift : 0);
    const ay = a.y + (vertical ? 0 : shift);
    return others.some((other) => {
      const b = pos.get(other);
      const sb = size.get(other);
      return ax < b.x + sb.width + SIDE_GAP / 2 && ax + sa.width + SIDE_GAP / 2 > b.x
        && ay < b.y + sb.height + SIDE_GAP / 2 && ay + sa.height + SIDE_GAP / 2 > b.y;
    });
  };

  const known = (edge) => pos.has(edge.source) && pos.has(edge.target);
  const longFirst = [...edges].filter(known).sort(
    (a, b) => Math.abs(mainOf(b.target) - mainOf(b.source)) - Math.abs(mainOf(a.target) - mainOf(a.source))
  );

  for (let pass = 0; pass < SEPARATE_PASSES; pass++) {
    let moved = false;
    for (const { source, target } of longFirst) {
      const lo = Math.min(mainOf(source), mainOf(target));
      const hi = Math.max(mainOf(source), mainOf(target));
      if (hi - lo < 1) continue;
      // Signed distance across the flow from the straight line source -> target.
      const offsetOf = (id) => {
        const along = (mainOf(id) - mainOf(source)) / (mainOf(target) - mainOf(source));
        return crossOf(id) - (crossOf(source) + (crossOf(target) - crossOf(source)) * along);
      };
      const near = [...pos.keys()].filter(
        (id) => id !== source && id !== target && mainOf(id) > lo && mainOf(id) < hi && Math.abs(offsetOf(id)) < separationOf(id)
      );
      if (!near.length) continue;

      // A node near the line only needs to move when a link of its own runs
      // along it, to the two ends or to another node close to it.
      const close = new Set([source, target, ...near]);
      const involved = near.filter((id) => [...close].some((other) => other !== id && linked.has(`${id}\u0000${other}`)));
      if (!involved.length) continue;

      // The shift that puts every one of them on side `sign` at its own
      // minimum distance or more.
      const shiftFor = (sign) => sign * Math.max(...involved.map((id) => separationOf(id) - sign * offsetOf(id)));
      const mean = involved.reduce((sum, id) => sum + offsetOf(id), 0) / involved.length;
      const first = mean < -2 ? -1 : 1;
      const widest = Math.max(...involved.map(crossSize));
      const others = [...pos.keys()].filter((id) => !involved.includes(id));
      let shift = shiftFor(first);
      search: for (let k = 0; k < SIDE_TRIES; k++) {
        for (const sign of [first, -first]) {
          const candidate = shiftFor(sign) + sign * k * (widest + SIDE_GAP);
          if (!involved.some((id) => overlaps(id, candidate, others))) {
            shift = candidate;
            break search;
          }
        }
      }
      for (const id of involved) {
        const p = pos.get(id);
        if (vertical) p.x += Math.round(shift);
        else p.y += Math.round(shift);
      }
      moved = true;
    }
    if (!moved) break;
  }

  return positions.map((p) => ({ ...p, x: pos.get(p.id).x, y: pos.get(p.id).y }));
}
