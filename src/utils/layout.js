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
export function layoutWithDagre(nodes, edges, direction = 'TB') {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 40, ranksep: 60 });

  const sizeOf = (node) => ({
    width: node.width || DEFAULT_NODE_WIDTH,
    height: node.height || DEFAULT_NODE_HEIGHT
  });

  nodes.forEach((node) => {
    g.setNode(node.id, sizeOf(node));
  });
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  return nodes.map((node) => {
    const { x, y } = g.node(node.id);
    const { width, height } = sizeOf(node);
    // dagre positions are node centers; Vue Flow positions are top-left corners
    return { id: node.id, x: x - width / 2, y: y - height / 2 };
  });
}
