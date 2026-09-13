import dagre from '@dagrejs/dagre';

const NODE_WIDTH = 180;
const NODE_HEIGHT = 40;

// Runs a hierarchical (dagre) layout over the given nodes/edges and returns
// new {id, x, y} positions. Only called on explicit user action (see the
// "auto layout" button in TaskGraphView.vue) so it never fights a manual drag.
export function layoutWithDagre(nodes, edges, direction = 'TB') {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 40, ranksep: 60 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  return nodes.map((node) => {
    const { x, y } = g.node(node.id);
    // dagre positions are node centers; Vue Flow positions are top-left corners
    return { id: node.id, x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 };
  });
}
