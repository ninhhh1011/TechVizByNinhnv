export function makeTrace(item) {
  if (item.id === 'U1') return {
    scenarioVersion: 1, topic: item.topic, status: 'unsupported', source: item.source,
    entities: [], relations: [], initialState: null, events: [], annotations: [], encoding: null,
  };
  if (item.id === 'A1') {
    const array = [...item.input.array];
    const events = [];
    for (let index = 0; index < array.length - 1; index++) {
      events.push({ type: 'compare', indices: [index, index + 1] });
      if (array[index] > array[index + 1]) {
        events.push({ type: 'swap', indices: [index, index + 1] });
        [array[index], array[index + 1]] = [array[index + 1], array[index]];
      }
    }
    return {
      scenarioVersion: 1, topic: item.topic, status: 'verified-simulation', source: item.source,
      entities: item.input.array.map((_, index) => ({ id: `cell-${index}`, kind: 'cell' })),
      relations: [], initialState: { array: [...item.input.array] }, events,
      annotations: [{ eventIndex: 0, entityId: 'cell-0', text: 'Compare adjacent values' }], encoding: 'array',
    };
  }
  if (item.id === 'F1') {
    const [client, lb, ...backends] = item.input.nodes;
    const healthy = backends.filter((id) => item.input.healthy.includes(id));
    const events = item.input.requests.flatMap((request, index) => [
      { type: 'send', request, from: client, to: lb },
      { type: 'send', request, from: lb, to: healthy[index % healthy.length] },
    ]);
    return {
      scenarioVersion: 1, topic: item.topic, status: 'illustrative', source: item.source,
      entities: item.input.nodes.map((id) => ({ id, kind: 'node' })),
      relations: [
        { from: client, to: lb },
        ...backends.map((id) => ({ from: lb, to: id })),
      ],
      initialState: { at: Object.fromEntries(item.input.requests.map((id) => [id, client])) },
      events, annotations: [{ eventIndex: 0, entityId: lb, text: 'First request reaches the balancer' }], encoding: 'flow',
    };
  }
  throw new Error(`POC case not supported: ${item.id}`);
}

export function screenAiProposal(value) {
  return {
    scenarioVersion: 1,
    topic: typeof value?.topic === 'string' && value.topic.trim() ? value.topic.trim().slice(0, 120) : 'Unverified topic',
    status: 'unsupported', source: 'AI proposal without a reviewed capability',
    entities: [], relations: [], initialState: null, events: [], annotations: [], encoding: null,
  };
}

export function makeSnapshots(item) {
  if (item.id === 'A1') return item.frames.map(({ event, array, sortedIndices }) => ({ event, array: [...array], ...(sortedIndices ? { sortedIndices: [...sortedIndices] } : {}) }));
  if (item.id === 'F1') {
    const at = Object.fromEntries(item.input.requests.map((request) => [request, item.input.nodes[0]]));
    return item.frames.map((frame) => {
      at[frame.request] = frame.at;
      return { event: frame.event, at: { ...at }, request: frame.request };
    });
  }
  throw new Error(`POC case not supported: ${item.id}`);
}

export function validateSnapshots(item, frames) {
  if (!Array.isArray(frames) || !['A1', 'F1'].includes(item?.id)) return { ok: false, reason: 'unsupported snapshot case' };
  return JSON.stringify(frames) === JSON.stringify(replay(makeTrace(item))) ? { ok: true } : { ok: false, reason: 'snapshot differs from oracle' };
}

export function validateTrace(trace) {
  const fail = (reason) => ({ ok: false, reason });
  if (!trace || trace.scenarioVersion !== 1 || !trace.topic || !trace.source) return fail('version, topic or source');
  if (!['verified-simulation', 'illustrative', 'unsupported'].includes(trace.status)) return fail('status');
  if (!Array.isArray(trace.entities) || !Array.isArray(trace.relations) || !Array.isArray(trace.events) || !Array.isArray(trace.annotations)) return fail('collections');
  if (trace.status === 'unsupported') return trace.entities.length === 0 && trace.relations.length === 0 && trace.events.length === 0 && trace.annotations.length === 0 && trace.initialState === null && trace.encoding === null ? { ok: true } : fail('unsupported has simulation');
  if (trace.entities.some((entity) => !entity || typeof entity !== 'object') || trace.relations.some((relation) => !relation || typeof relation !== 'object') || trace.events.some((event) => !event || typeof event !== 'object')) return fail('malformed entries');
  const ids = trace.entities.map(({ id }) => id);
  if (!ids.length || ids.some((id) => typeof id !== 'string' || !id) || new Set(ids).size !== ids.length) return fail('entity ids');
  if (trace.relations.some(({ from, to }) => !ids.includes(from) || !ids.includes(to))) return fail('relation endpoint');
  if (!trace.events.length) return fail('empty events');
  if (trace.annotations.some((annotation) => !annotation || !Number.isInteger(annotation.eventIndex) || annotation.eventIndex < 0 || annotation.eventIndex >= trace.events.length || !ids.includes(annotation.entityId) || typeof annotation.text !== 'string' || !annotation.text)) return fail('annotation anchor');
  if (trace.encoding === 'array' && trace.status === 'verified-simulation') {
    const array = trace.initialState?.array;
    if (!Array.isArray(array) || !array.length || array.length !== ids.length || array.some((n) => typeof n !== 'number' || !Number.isFinite(n))) return fail('array state');
    if (trace.events.some((event) => !['compare', 'swap'].includes(event.type) || Object.keys(event).some((key) => !['type', 'indices'].includes(key)) || !Array.isArray(event.indices) || event.indices.length !== 2 || event.indices.some((i) => !Number.isInteger(i) || i < 0 || i >= array.length) || event.indices[1] !== event.indices[0] + 1)) return fail('array event');
    if (JSON.stringify(trace.events) !== JSON.stringify(makeTrace({ id: 'A1', input: { array }, topic: trace.topic, source: trace.source }).events)) return fail('bubble-sort order');
  } else if (trace.encoding === 'flow' && trace.status === 'illustrative') {
    const at = trace.initialState?.at;
    if (!at || typeof at !== 'object' || Object.values(at).some((id) => !ids.includes(id))) return fail('flow state');
    const edges = new Set(trace.relations.map(({ from, to }) => `${from}->${to}`));
    const positions = { ...at };
    for (const event of trace.events) {
      if (event.type !== 'send' || Object.keys(event).some((key) => !['type', 'request', 'from', 'to'].includes(key)) || !Object.hasOwn(positions, event.request) || positions[event.request] !== event.from || !edges.has(`${event.from}->${event.to}`)) return fail('flow event/order');
      positions[event.request] = event.to;
    }
    const [client, lb] = [trace.relations[0]?.from, trace.relations[0]?.to];
    const backends = trace.relations.filter(({ from }) => from === lb).map(({ to }) => to);
    const requests = Object.keys(at);
    if (!client || !lb || !backends.length || JSON.stringify(trace.events) !== JSON.stringify(makeTrace({ id: 'F1', input: { nodes: [client, lb, ...backends], healthy: backends, requests }, topic: trace.topic, source: trace.source }).events)) return fail('round-robin order');
  } else return fail('encoding/status');
  return { ok: true };
}

export function replay(trace) {
  const verdict = validateTrace(trace);
  if (!verdict.ok) throw new Error(verdict.reason);
  if (trace.status === 'unsupported') return [];
  if (trace.encoding === 'array') {
    const array = [...trace.initialState.array];
    const frames = [{ event: 'initial', array: [...array] }];
    for (const { type, indices } of trace.events) {
      if (type === 'swap') [array[indices[0]], array[indices[1]]] = [array[indices[1]], array[indices[0]]];
      frames.push({ event: `${type}(${indices.join(',')})`, array: [...array] });
    }
    frames.at(-1).sortedIndices = [array.length - 1];
    return frames;
  }
  const at = { ...trace.initialState.at };
  return trace.events.map(({ request, from, to }) => {
    at[request] = to;
    return { event: `${request}:${from}->${to}`, at: { ...at }, request };
  });
}
