import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  systemPrompt: string;
}

interface GroqResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message: string };
}

router.post("/chat", async (req: Request, res: Response) => {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    res.status(500).json({ error: "GROQ_API_KEY is not configured on the server." });
    return;
  }

  const { messages, systemPrompt } = req.body as ChatRequest;

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: "messages must be an array." });
    return;
  }

  const groqMessages: ChatMessage[] = [
    ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
    ...messages.slice(-20), // keep last 20 turns for context window safety
  ];

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: groqMessages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    const data = (await groqRes.json()) as GroqResponse;

    if (!groqRes.ok) {
      const errMsg = data.error?.message ?? `Groq returned HTTP ${groqRes.status}`;
      res.status(502).json({ error: errMsg });
      return;
    }

    const content = data.choices?.[0]?.message?.content ?? "";
    res.json({ content });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(502).json({ error: `Failed to reach Groq API: ${message}` });
  }
});

export default router;
