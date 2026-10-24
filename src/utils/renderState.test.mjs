import assert from 'node:assert/strict';
import test from 'node:test';
import { layoutTree, pickBestParticle } from './renderState.ts';

test('swarm best follows the declared objective, never geometric distance', () => {
  const particles = [{ id: 'near', x: 50, y: 50, fitness: 5 }, { id: 'far', x: 0, y: 0, fitness: 1 }];
  assert.equal(pickBestParticle(particles), null);
  assert.equal(pickBestParticle(particles, 'min')?.id, 'far');
  assert.equal(pickBestParticle(particles, 'max')?.id, 'near');
  assert.equal(pickBestParticle(particles.map((p) => ({ ...p, fitness: undefined })), 'max'), null);
  assert.equal(pickBestParticle([{ ...particles[0], isBest: true }, particles[1]])?.id, 'near');
  assert.equal(pickBestParticle(particles.map((p) => ({ ...p, isBest: true }))), null);
});

test('tree layout follows parent subtrees and is stable when input order changes', () => {
  const nodes = [
    { id: 'root', label: 'root', level: 9 },
    { id: 'a', parentId: 'root', label: 'a', level: 0 },
    { id: 'b', parentId: 'root', label: 'b', level: 0 },
    { id: 'a1', parentId: 'a', label: 'a1', level: 0 },
    { id: 'a2', parentId: 'a', label: 'a2', level: 0 },
    { id: 'b1', parentId: 'b', label: 'b1', level: 0 },
  ];
  const positions = layoutTree(nodes);
  assert.equal(positions.size, nodes.length);
  assert.ok(positions.get('a2').x < positions.get('b1').x);
  assert.equal(positions.get('a').x, (positions.get('a1').x + positions.get('a2').x) / 2);
  assert.ok(positions.get('root').y < positions.get('a').y);
  for (const [id, position] of layoutTree([...nodes].reverse())) assert.deepEqual(position, positions.get(id));
  assert.equal(layoutTree([...nodes, nodes[0]]).size, 0);
  assert.equal(layoutTree([{ ...nodes[0], parentId: 'missing' }]).size, 0);
  assert.equal(layoutTree([{ ...nodes[0], parentId: 'a' }, nodes[1]]).size, 0);
});

test('ordered tree keeps declared left/right sides even for unary branches and renamed IDs', () => {
  const nodes = [
    { id: 'root', label: '4', value: 4, level: 0 },
    { id: 'z', label: '2', value: 2, parentId: 'root', side: 'left', level: 1 },
    { id: 'a', label: '3', value: 3, parentId: 'z', side: 'right', level: 2 },
  ];
  const positions = layoutTree(nodes);
  assert.ok(positions.get('z').x < positions.get('root').x);
  assert.ok(positions.get('a').x > positions.get('z').x);
  const siblings = layoutTree([nodes[0], nodes[1], { ...nodes[2], parentId: 'root' }]);
  assert.ok(siblings.get('z').x < siblings.get('root').x);
  assert.ok(siblings.get('a').x > siblings.get('root').x);
});
