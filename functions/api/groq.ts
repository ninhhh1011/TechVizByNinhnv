interface PagesContext {
  request: Request;
  env: {
    VITE_GROQ_API_KEY?: string;
    GROQ_API_KEY?: string;
    [key: string]: any;
  };
}

const CANDIDATE_MODELS = [
  'llama-3.3-70b-versatile',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
  'llama-3.1-8b-instant',
  'llama-3.1-70b-versatile',
];

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const apiKey = (context.env.VITE_GROQ_API_KEY || context.env.GROQ_API_KEY || '').trim();

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: {
          message:
            'Chưa tìm thấy Groq API Key trong biến môi trường Cloudflare. Vui lòng thêm VITE_GROQ_API_KEY hoặc GROQ_API_KEY trong Cloudflare Pages Settings -> Variables and secrets.',
        },
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  try {
    const body: any = await context.request.json().catch(() => ({}));
    const messages = body.messages || [];
    const requestedModel = body.model || 'llama-3.3-70b-versatile';
    const temperature = body.temperature ?? 0.2;
    const responseFormat = body.response_format ?? { type: 'json_object' };

    const modelsToTry = [
      requestedModel,
      ...CANDIDATE_MODELS.filter((m) => m !== requestedModel),
    ];

    let lastError = '';

    for (const model of modelsToTry) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages,
            response_format: responseFormat,
            temperature,
          }),
        });

        if (groqRes.ok) {
          const data = await groqRes.text();
          return new Response(data, {
            status: 200,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }

        const errData: any = await groqRes.json().catch(() => ({}));
        lastError = errData?.error?.message || `HTTP ${groqRes.status}`;

        // Nếu lỗi 401 hoặc 429 dừng sớm
        if (groqRes.status === 401 || groqRes.status === 429) {
          return new Response(JSON.stringify(errData), {
            status: groqRes.status,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }
      } catch (err: any) {
        lastError = err?.message || String(err);
      }
    }

    return new Response(
      JSON.stringify({ error: { message: `Không thể kết nối mô hình Groq AI: ${lastError}` } }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: { message: error?.message || 'Lỗi xử lý serverless function' } }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
