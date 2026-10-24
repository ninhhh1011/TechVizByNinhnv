import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('grid uses the scenario dimensions and walls without inventing a missing frame', async () => {
  const vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { GridPathRenderer } = await vite.ssrLoadModule('/src/components/GridPathRenderer.tsx');
    const props = {
      config: { rows: 2, cols: 2, start: [0, 0], end: [1, 1], initialWalls: [[0, 1]] },
      activeNodeIds: new Set(),
      step: { stepIndex: 4, title: 'Frame', explanation: 'No route computed yet', gridData: { current: [0, 0], visited: [], path: [] } },
    };
    const html = renderToStaticMarkup(React.createElement(GridPathRenderer, props));
    assert.equal((html.match(/aria-label="Ô \[/g) || []).length, 4);
    assert.match(html, /Ô \[0, 1\], tường/);
    assert.match(html, /Chưa có đường trong bước này/);
    assert.match(html, /Chưa có dữ liệu trọng số/);
    assert.doesNotMatch(html, /Trọng số f\(n\): BẬT/);
    assert.ok(!html.includes('Tường chắn chặn kín đích'), 'an unfinished frame must not claim no path');
    const missing = renderToStaticMarkup(React.createElement(GridPathRenderer, { ...props, step: { ...props.step, gridData: undefined } }));
    assert.match(missing, /Chưa có dữ liệu lưới cho bước này/);
    const partial = renderToStaticMarkup(React.createElement(GridPathRenderer, { ...props, step: { ...props.step, gridData: { path: [[0, 0], [1, 0]], visited: [[0, 0], [1, 0]] } } }));
    assert.ok(!partial.includes('Đã chạm đích thành công'), 'a path prefix is not arrival');
    assert.ok(partial.includes('1 bước'));
    const exhausted = renderToStaticMarkup(React.createElement(GridPathRenderer, { ...props, step: { ...props.step, gridData: { result: 'no-path', path: [], visited: [[0, 0]] } } }));
    assert.ok(exhausted.includes('không có đường tới đích'));
    assert.ok(!exhausted.includes('Bước này chưa kết luận'));
  } finally {
    await vite.close();
  }
});

test('banner does not invent complexity or use cases when academic metadata is missing', async () => {
  const vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { StorytellerBanner } = await vite.ssrLoadModule('/src/components/StorytellerBanner.tsx');
    const html = renderToStaticMarkup(React.createElement(StorytellerBanner, {
      scenario: { id: 'unknown', title: 'Unknown', category: 'Algorithms', nodes: [], steps: [] },
      step: { stepIndex: 1, title: 'Unknown', explanation: 'No source yet' },
      totalSteps: 1,
    }));
    assert.doesNotMatch(html, /O\(N log N\)|Hệ thống chịu tải|nhất quán cuối cùng/);
    assert.match(html, /Chưa có phân tích được kiểm chứng/);
  } finally {
    await vite.close();
  }
});

test('swarm without a declared target does not draw an invented global optimum', async () => {
  const vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { Swarm2DRenderer } = await vite.ssrLoadModule('/src/components/Swarm2DRenderer.tsx');
    const html = renderToStaticMarkup(React.createElement(Swarm2DRenderer, {
      step: { stepIndex: 1, title: 'Positions', explanation: 'No objective', swarmData: { particles: [{ id: 'p1', x: 50, y: 50 }] } },
    }));
    assert.doesNotMatch(html, /gBest \(50, 50\)|Dẫn đầu:/);
    assert.match(html, /Chưa khai báo mục tiêu/);
    assert.ok(!html.includes('Vòng lặp: #1'), 'frame index is not an iteration count');
  } finally { await vite.close(); }
});

test('flow rejects duplicate packet identities and unknown endpoints visibly', async (t) => {
  const originalError = console.error;
  // SSR checks the error text; browser tests cover the client-only layout effect.
  t.mock.method(console, 'error', (...args) => {
    if (String(args[0]).includes('useLayoutEffect does nothing on the server')) return;
    originalError(...args);
  });
  const vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { FlowGraphRenderer } = await vite.ssrLoadModule('/src/components/FlowGraphRenderer.tsx');
    const packet = { id: 'p', fromNodeId: 'a', toNodeId: 'b', label: 'Message' };
    for (const packets of [[packet, packet], [{ ...packet, toNodeId: 'missing' }]]) {
      const html = renderToStaticMarkup(React.createElement(FlowGraphRenderer, {
        nodes: [{ id: 'a' }, { id: 'b' }], step: { stepIndex: 1, packets }, activeNodeIds: new Set(['a', 'b']), speed: 1,
      }));
      assert.ok(html.includes('Dữ liệu luồng có ID trùng hoặc tham chiếu không hợp lệ.'));
    }
  } finally { await vite.close(); }
});
