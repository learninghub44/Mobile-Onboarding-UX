/**
 * Groq API client — routes through the api-server proxy so the
 * GROQ_API_KEY never ships inside the mobile bundle.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// EXPO_PUBLIC_DOMAIN is injected by the dev command: EXPO_PUBLIC_DOMAIN=$REPLIT_DEV_DOMAIN
const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;
const API_BASE = DOMAIN
  ? `https://${DOMAIN}/api-server`
  : 'http://localhost:8080';

export async function chatWithGroq(
  messages: ChatMessage[],
  systemPrompt: string,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch(`${API_BASE}/api/ai/chat`, {
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
