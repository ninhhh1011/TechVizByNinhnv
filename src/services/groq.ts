import { parseCandidate, type ScenarioResult } from './scenarioContract';

export async function generateScenarioWithGroq(userQuery: string): Promise<ScenarioResult> {
  if (!userQuery.trim() || userQuery.length > 200) return { status: 'error', reason: 'Chủ đề phải có từ 1 đến 200 ký tự.' };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 28000);
  try {
    const response = await fetch('/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ query: userQuery }),
    });
    if (!response.ok) return { status: 'error', reason: `Dịch vụ AI trả về HTTP ${response.status}.` };
    const reader = response.body?.getReader();
    if (!reader) return { status: 'error', reason: 'Phản hồi AI trống.' };
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 131072) {
        await reader.cancel();
        return { status: 'error', reason: 'Phản hồi AI quá lớn.' };
      }
      chunks.push(value);
    }
    const body = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
    let payload;
    try { payload = JSON.parse(new TextDecoder().decode(body)); }
    catch { return { status: 'error', reason: 'Phản hồi dịch vụ AI không phải JSON hợp lệ.' }; }
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') return { status: 'error', reason: 'Phản hồi AI trống.' };
    try {
      const candidate = JSON.parse(content);
      if (candidate?.status === 'unsupported' && typeof candidate.reason === 'string' && candidate.reason.trim() && candidate.reason.length <= 500) return { status: 'unsupported', reason: candidate.reason };
      return parseCandidate(candidate);
    } catch {
      return { status: 'error', reason: 'Phản hồi AI không phải JSON hợp lệ.' };
    }
  } catch (err) {
    return { status: 'error', reason: err instanceof Error && err.name === 'AbortError' ? 'AI quá thời gian chờ 28 giây.' : 'Không kết nối được dịch vụ AI.' };
  } finally {
    clearTimeout(timeout);
  }
}
