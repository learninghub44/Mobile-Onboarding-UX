/**
 * Groq API client — routes through the api-server proxy so the
 * GROQ_API_KEY never ships inside the mobile bundle.
 *
 * The api-server's base URL must be set explicitly via
 * EXPO_PUBLIC_API_SERVER_URL (e.g. your Render/Railway URL for the
 * api-server, like https://chamayetu-api.onrender.com). This used to
 * be derived from EXPO_PUBLIC_DOMAIN (= $REPLIT_DEV_DOMAIN) with a
 * hardcoded "/api-server" path — that only works inside Replit's own
 * dev proxy, which routes that path prefix to the api-server service.
 * Outside Replit (a real device, a production build, Codespaces, etc.)
 * that env var is empty, the code silently fell back to
 * http://localhost:8080, and every AI request failed to fetch.
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const API_BASE = process.env.EXPO_PUBLIC_API_SERVER_URL;

export async function chatWithGroq(
  messages: ChatMessage[],
  systemPrompt: string,
  signal?: AbortSignal,
): Promise<string> {
  if (!API_BASE) {
    throw new Error(
      'AI service is not configured. Set EXPO_PUBLIC_API_SERVER_URL to your deployed api-server URL (e.g. in artifacts/mobile/package.json\'s dev script, or your build environment).',
    );
  }

  const response = await fetch(`${API_BASE.replace(/\/$/, '')}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, systemPrompt }),
    signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => `HTTP ${response.status}`);
    throw new Error(`AI service error: ${text}`);
  }

  const data = (await response.json()) as { content?: string; error?: string };
  if (data.error) throw new Error(data.error);
  return data.content ?? '';
}
