import type { SwarmParticle, TreeNodeItem } from '../types/simulation';

export function pickBestParticle(particles: SwarmParticle[], objective?: 'min' | 'max'): SwarmParticle | null {
  if (objective) {
    if (!particles.length || particles.some((p) => !Number.isFinite(p.fitness))) return null;
    return particles.reduce((best, p) => (objective === 'min' ? p.fitness! < best.fitness! : p.fitness! > best.fitness!) ? p : best);
  }
  const declared = particles.filter((p) => p.isBest);
  return declared.length === 1 ? declared[0] : null;
}

export function layoutTree(nodes: TreeNodeItem[]): Map<string, { x: number; y: number; node: TreeNodeItem; depth: number }> {
  const positions = new Map<string, { x: number; y: number; node: TreeNodeItem; depth: number }>();
  const ids = new Set(nodes.map((node) => node.id));
  const roots = nodes.filter((node) => !node.parentId);
  if (ids.size !== nodes.length || roots.length !== 1 || nodes.some((node) => node.parentId && !ids.has(node.parentId))) return positions;

  let cursor = 0;
  const getSideOrder = (n: TreeNodeItem) => (n.side === 'left' ? -1 : n.side === 'right' ? 1 : 0);

  const visit = (node: TreeNodeItem, depth: number): number => {
    const children = nodes
      .filter((child) => child.parentId === node.id)
      .sort((a, b) => getSideOrder(a) - getSideOrder(b) || a.id.localeCompare(b.id));

    if (children.length === 0) {
      const x = cursor++;
      positions.set(node.id, { x, y: 0, node, depth });
      return x;
    }

    const hasSide = children.some((c) => c.side === 'left' || c.side === 'right');
    if (!hasSide) {
      const childX = children.map((child) => visit(child, depth + 1));
      const x = (childX[0] + childX[childX.length - 1]) / 2;
      positions.set(node.id, { x, y: 0, node, depth });
      return x;
    }

    const leftChildren = children.filter((c) => c.side === 'left');
    const rightChildren = children.filter((c) => c.side === 'right');
    const centerChildren = children.filter((c) => !c.side);

    const leftX = leftChildren.map((c) => visit(c, depth + 1));
    let nodeX: number;
    if (rightChildren.length === 0 && centerChildren.length === 0) {
      nodeX = cursor++;
    } else if (leftChildren.length === 0 && centerChildren.length === 0) {
      nodeX = cursor++;
      rightChildren.map((c) => visit(c, depth + 1));
    } else {
      const centerX = centerChildren.map((c) => visit(c, depth + 1));
      const rightX = rightChildren.map((c) => visit(c, depth + 1));
      const allChildX = [...leftX, ...centerX, ...rightX];
      nodeX = (allChildX[0] + allChildX[allChildX.length - 1]) / 2;
    }

    positions.set(node.id, { x: nodeX, y: 0, node, depth });
    return nodeX;
  };

  visit(roots[0], 0);
  if (positions.size !== nodes.length) return new Map();

  const xs = [...positions.values()].map((p) => p.x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const maxDepth = Math.max(...[...positions.values()].map((position) => position.depth));

  positions.forEach((position) => {
    position.x = maxX === minX ? 50 : 12 + ((position.x - minX) / (maxX - minX)) * 76;
    position.y = maxDepth === 0 ? 50 : 16 + (position.depth / maxDepth) * 68;
  });

  return positions;
}
