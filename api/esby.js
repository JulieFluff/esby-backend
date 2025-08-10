import { OpenAI } from "openai";

export default async function handler(req, res) {
  // CORS: allow your Squarespace domain to call this endpoint
  res.setHeader("Access-Control-Allow-Origin", "https://YOUR-DOMAIN.com");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { sessionId, user } = req.body || {};
  if (!sessionId || !user) return res.status(400).json({ error: "sessionId and user are required" });

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const ESBY_SYSTEM = `
You are Esby Oracle: ritual-sensitive, cozy, storybook voice, emotionally grounded.
Offer one card per session. Rich prose, clear imagery. Gentle pacing. No hustle.
Keep it human and kind.`;

  // Start Server-Sent Events stream
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = await client.responses.stream({
      model: "gpt-4o", // pick the model you prefer
      input: [
        { role: "system", content: ESBY_SYSTEM },
        { role: "user", content: user }
      ],
    });

    stream.on("content.delta", (delta) => {
      res.write(`data: ${delta}\n\n`);
    });
    stream.on("end", () => {
      res.write("data: [DONE]\n\n");
      res.end();
    });
    stream.on("error", (err) => {
      console.error(err);
      res.write("data: [ERROR]\n\n");
      res.end();
    });

    await stream.consume();
  } catch (e) {
    console.error(e);
    res.status(500).end();
  }
}
