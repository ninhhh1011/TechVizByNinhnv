import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import fixture from '../phase1/cases.json';
import { makeSnapshots, makeTrace, replay, validateSnapshots } from './poc-core.mjs';
import { ArrayPointerRenderer } from '../../../src/components/ArrayPointerRenderer';
import { FlowGraphRenderer } from '../../../src/components/FlowGraphRenderer';
import '../../../src/index.css';

const selected = Object.fromEntries(fixture.cases.filter(({ id }) => ['A1', 'F1'].includes(id)).map((item) => [item.id, item]));
const button = { padding: '9px 14px', border: '1px solid #94a3b8', borderRadius: 8, background: 'white', cursor: 'pointer' };

function Stage({ id, frame }) {
  if (id === 'A1') {
    const kind = frame.event.split('(')[0];
    const indices = [...frame.event.matchAll(/\d+/g)].map(([value]) => Number(value));
    return <svg viewBox="0 0 360 170" role="img" aria-label={`${frame.event}: array ${frame.array.join(', ')}${frame.sortedIndices ? `, settled index ${frame.sortedIndices.join(', ')}` : ''}`} style={{ width: '100%', maxWidth: 650, background: 'white', borderRadius: 12 }}>
    {kind !== 'initial' && <text data-event={kind} x="180" y="25" textAnchor="middle" fontSize="15" fontWeight="bold">{kind === 'compare' ? 'Compare' : 'Swap'} {indices.join(' ↔ ')}</text>}
    {frame.array.map((value, index) => <g key={index}>
      <rect x={40 + index * 100} y={110 - value * 20} width="68" height={value * 20} fill={indices.includes(index) ? kind === 'compare' ? '#2563eb' : '#e31b23' : '#94a3b8'} stroke={frame.sortedIndices?.includes(index) ? '#f59e0b' : 'none'} strokeWidth="4" rx="4" />
      <text x={74 + index * 100} y="133" textAnchor="middle" fontSize="18">{value}</text>
      <text x={74 + index * 100} y="155" textAnchor="middle" fontSize="12">{index}</text>
    </g>)}
    </svg>;
  }
  const nodes = [
    { id: 'client', x: 18, y: 90 }, { id: 'lb', x: 132, y: 90 },
    { id: 'a', x: 260, y: 28 }, { id: 'b', x: 260, y: 152 },
  ];
  const [, request, from, to] = frame.event.match(/^([^:]+):([^-]+)->(.+)$/) || [];
  const routes = { 'client->lb': ['M 82 110 L 132 110', 107, 94], 'lb->a': ['M 196 110 L 260 48', 225, 74], 'lb->b': ['M 196 110 L 260 172', 225, 148] };
  const route = routes[`${from}->${to}`];
  return <svg viewBox="0 0 360 240" role="img" aria-label={`Request positions ${Object.entries(frame.at).map(([request, at]) => `${request} at ${at}`).join(', ')}`} style={{ width: '100%', maxWidth: 650, background: 'white', borderRadius: 12 }}>
    <path d="M 82 110 L 132 110 M 196 110 L 260 48 M 196 110 L 260 172" stroke="#64748b" strokeWidth="2" fill="none" />
    {route && <><path data-event="send" d={route[0]} stroke="#e31b23" strokeWidth="4" fill="none" /><text x={route[1]} y={route[2]} textAnchor="middle" fontSize="13" fontWeight="bold">{request}</text></>}
    {nodes.map(({ id: node, x, y }) => <g key={node}>
      <rect x={x} y={y} width="64" height="40" fill={Object.values(frame.at).includes(node) ? '#fecaca' : '#e2e8f0'} stroke="#475569" rx="7" />
      <text x={x + 32} y={y + 25} textAnchor="middle" fontSize="14">{node}</text>
    </g>)}
    <text x="180" y="220" textAnchor="middle" fontSize="13">{Object.entries(frame.at).map(([request, at]) => `${request}: ${at}`).join(' · ')}</text>
  </svg>;
}

function LegacyStage({ id, frame, index }) {
  if (id === 'A1') {
    const indices = [...frame.event.matchAll(/\d+/g)].map(([value]) => Number(value));
    return <div style={{ height: 850 }}><ArrayPointerRenderer step={{ stepIndex: index, title: frame.event, explanation: frame.event, arrayData: { array: frame.array, pointers: [], comparingIndices: frame.event.startsWith('compare') ? indices : [], swappedIndices: frame.event.startsWith('swap') ? indices : [], sortedIndices: frame.sortedIndices || [] } }} audioEnabled={false} /></div>;
  }
  const nodes = selected.F1.input.nodes.map((node) => ({ id: node, name: node, role: node, layer: node === 'client' ? 'ingress' : node === 'lb' ? 'compute' : 'egress', status: 'active', icon: 'server', description: node }));
  const [request, route] = frame.event.split(':');
  const [fromNodeId, toNodeId] = route.split('->');
  return <div style={{ height: 850 }}><FlowGraphRenderer nodes={nodes} step={{ stepIndex: index, title: frame.event, explanation: frame.event, packets: [{ id: request, fromNodeId, toNodeId, label: request }] }} activeNodeIds={new Set(nodes.map(({ id: node }) => node))} speed={1} /></div>;
}

function App() {
  const [id, setId] = useState('A1');
  const [mode, setMode] = useState('Snapshot');
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const item = selected[id];
  const frames = useMemo(() => {
    if (mode === 'Event + reducer') return replay(makeTrace(item));
    const result = makeSnapshots(item);
    if (!validateSnapshots(item, result).ok) throw new Error('Snapshot differs from oracle');
    return result;
  }, [item, mode]);
  const frame = frames[index];
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setIndex((value) => value < frames.length - 1 ? value + 1 : value), 500);
    return () => clearInterval(timer);
  }, [playing, frames.length]);
  const change = (nextId, nextMode) => { setPlaying(false); setIndex(0); setId(nextId); setMode(nextMode); };
  return <main style={{ maxWidth: 760, margin: 'auto', padding: 20 }}>
    <h1>TechViz · Phase 2 POC</h1>
    <p>Same P1 cases, two representations. F1 is an illustrative policy trace.</p>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
      {['A1', 'F1'].map((caseId) => <button key={caseId} style={button} aria-pressed={id === caseId} onClick={() => change(caseId, mode)}>{caseId}</button>)}
      {['Legacy renderer', 'Snapshot', 'Event + reducer'].map((candidate) => <button key={candidate} style={button} aria-pressed={mode === candidate} onClick={() => change(id, candidate)}>{candidate}</button>)}
    </div>
    {mode === 'Legacy renderer' ? <LegacyStage id={id} frame={frame} index={index} /> : <Stage id={id} frame={frame} />}
    <div data-testid="frame" aria-live="polite" style={{ marginTop: 10, minHeight: 52 }}>
      <strong>{id} · {mode} · frame {index + 1}/{frames.length} · {frame.event}</strong>
      <div>{id === 'A1' ? frame.array.join(', ') : Object.entries(frame.at).map(([request, at]) => `${request}: ${at}`).join(' · ')}</div>
    </div>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <button style={button} onClick={() => setIndex(Math.max(0, index - 1))}>Previous</button>
      <button style={button} onClick={() => setPlaying(!playing)}>{playing ? 'Pause' : 'Play'}</button>
      <button style={button} onClick={() => setIndex(Math.min(frames.length - 1, index + 1))}>Next</button>
      <input aria-label="Seek frame" type="range" min="0" max={frames.length - 1} value={index} onChange={(event) => setIndex(Number(event.target.value))} />
    </div>
    <p>Status: {item.status}. Source: {item.source}. Limit: {item.limit}</p>
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
