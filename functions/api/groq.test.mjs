import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequestPost } from './groq.ts';

let sequence = 0;
const context = (body, headers = {}) => ({
  request: new Request('https://techviz.test/api/groq', { method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': `192.0.2.${++sequence}`, ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) }),
  env: { GROQ_API_KEY: 'server-only-test-key' },
});

test('proxy owns model, prompt and token budget and accepts only a bounded query', async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (_url, options) => {
    calls++;
    const body = JSON.parse(options.body);
    assert.equal(body.model, 'llama-3.3-70b-versatile');
    assert.equal(body.messages.at(-1).content, 'cache invalidation');
    assert.ok(body.messages[0].content.includes('scenarioVersion'));
    assert.ok(body.max_tokens > 0 && body.max_tokens <= 4096);
    assert.ok(options.signal);
    return Response.json({ choices: [{ message: { content: '{"status":"unsupported","reason":"No reviewed capability"}' } }] });
  };
  try {
    assert.equal((await onRequestPost(context({ query: 'cache invalidation' }))).status, 200);
    assert.equal(calls, 1);
    assert.equal((await onRequestPost(context({ query: 'cache', model: 'client-model' }))).status, 400);
    assert.equal((await onRequestPost(context({ query: 'x'.repeat(201) }))).status, 400);
    assert.equal((await onRequestPost(context('{invalid'))).status, 400);
    assert.equal((await onRequestPost(context('x'.repeat(2049), { 'Content-Length': '1' }))).status, 413);
    assert.equal((await onRequestPost(context({ query: 'x' }, { 'Content-Type': 'text/plain' }))).status, 415);
    assert.equal((await onRequestPost(context({ query: 'x' }, { Origin: 'https://other.test' }))).status, 403);
    assert.equal(calls, 1);
  } finally { globalThis.fetch = original; }
});

test('proxy enforces rate limits and hides provider errors and oversized responses', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ choices: [{ message: { content: '{}' } }] });
  try {
    const requestContext = () => context({ query: 'rate' }, { 'CF-Connecting-IP': '198.51.100.1' });
    for (let i = 0; i < 6; i++) assert.equal((await onRequestPost(requestContext())).status, 200);
    const limited = await onRequestPost(requestContext());
    assert.equal(limited.status, 429);
    assert.ok(limited.headers.get('Retry-After'));
    globalThis.fetch = async () => new Response('secret provider diagnostic', { status: 401 });
    const failed = await onRequestPost(context({ query: 'failure' }));
    assert.equal(failed.status, 502);
    assert.ok(!(await failed.text()).includes('secret'));
    globalThis.fetch = async () => new Response('x'.repeat(131073));
    assert.equal((await onRequestPost(context({ query: 'large' }))).status, 502);
    const noKey = context({ query: 'disabled' }); noKey.env = { VITE_GROQ_API_KEY: 'must-not-be-used' };
    assert.equal((await onRequestPost(noKey)).status, 503);
  } finally { globalThis.fetch = original; }
});

test('server deadline cancels a pending provider request', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const original = globalThis.fetch;
  globalThis.fetch = async (_url, options) => new Promise((_resolve, reject) =>
    options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true }));
  try {
    const pending = onRequestPost(context({ query: 'timeout' }));
    await new Promise(setImmediate);
    t.mock.timers.tick(25000);
    assert.equal((await pending).status, 504);
  } finally { globalThis.fetch = original; }
});
