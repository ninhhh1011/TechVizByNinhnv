interface PagesContext {
  request: Request;
  env: { GROQ_API_KEY?: string };
}

const MODEL = 'llama-3.3-70b-versatile';
const PROMPT_VERSION = 'proposal-v1';
const PROMPT = 'Return one JSON object. For an unsupported topic return {status:"unsupported",reason:"short explanation in Vietnamese"}. Otherwise propose scenarioVersion:1, title, rendererType, nodes, steps and provenance with source and limits. Each step needs stepIndex, title, explanation and renderer data. Never claim verification. Do not invent missing mechanics, complexity or data. A proposal will be validated and never grants simulation status by itself.';
const windows = new Map<string, { count: number; expires: number }>();
const json = (value: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers } });
const failure = (message: string, status: number, headers?: Record<string, string>) => json({ error: { message } }, status, headers);

async function readBounded(response: Request | Response, limit: number, signal: AbortSignal): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let size = 0;
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    while (true) {
      if (signal.aborted) throw new Error('timeout');
      const { value, done } = await reader.read();
      if (signal.aborted) throw new Error('timeout');
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new Error('size'); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return new TextDecoder().decode(bytes);
  } finally {
    signal.removeEventListener('abort', cancel);
    reader.releaseLock();
  }
}

export async function onRequestPost({ request, env }: PagesContext): Promise<Response> {
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) return failure('Origin không được phép.', 403);
  if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json') return failure('Yêu cầu application/json.', 415);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  let stage: 'input' | 'provider' = 'input';
  try {
    let body;
    try { body = JSON.parse(await readBounded(request, 2048, controller.signal)); }
    catch (error) {
      if (controller.signal.aborted) return failure('Yêu cầu quá thời gian chờ.', 408);
      return failure('Nội dung yêu cầu không hợp lệ.', error instanceof Error && error.message === 'size' ? 413 : 400);
    }
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some((key) => key !== 'query') || typeof body.query !== 'string' || !body.query.trim() || body.query.length > 200) return failure('Chủ đề phải có từ 1 đến 200 ký tự.', 400);
    const apiKey = env.GROQ_API_KEY?.trim();
    if (!apiKey) return failure('Dịch vụ AI chưa được cấu hình.', 503);
    const now = Date.now();
    for (const [key, window] of windows) if (window.expires <= now) windows.delete(key);
    const key = request.headers.get('CF-Connecting-IP') || 'local';
    const window = windows.get(key) ?? { count: 0, expires: now + 60000 };
    if (window.count >= 6 || (!windows.has(key) && windows.size >= 10000)) return failure('Đã đạt giới hạn yêu cầu. Vui lòng thử lại sau.', 429, { 'Retry-After': '60' });
    window.count++;
    // shortcut: per-isolate limit only, add an edge rate rule before public AI rollout.
    windows.set(key, window);
    stage = 'provider';
    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({ model: MODEL, messages: [{ role: 'system', content: PROMPT }, { role: 'user', content: body.query.trim() }], response_format: { type: 'json_object' }, temperature: 0.2, max_tokens: 4096 }),
    });
    if (!upstream.ok) {
      await upstream.body?.cancel();
      return failure('Dịch vụ AI tạm thời không khả dụng.', upstream.status === 429 ? 429 : 502, upstream.status === 429 ? { 'Retry-After': '60' } : {});
    }
    const payload = JSON.parse(await readBounded(upstream, 131072, controller.signal));
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') return failure('Phản hồi AI không hợp lệ.', 502);
    return json({ choices: [{ message: { content } }], provenance: { provider: 'groq', model: MODEL, promptVersion: PROMPT_VERSION, capability: 'unreviewed-proposal' } });
  } catch {
    return failure(controller.signal.aborted ? 'Dịch vụ AI quá thời gian chờ.' : 'Không xử lý được phản hồi AI.', controller.signal.aborted ? 504 : stage === 'provider' ? 502 : 400);
  } finally {
    clearTimeout(timeout);
  }
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: { Allow: 'POST, OPTIONS' } });
}
