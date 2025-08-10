import { OpenAI } from "openai";

export default async function handler(req, res) {
  // TEMP during setup: allow any origin so Squarespace works
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    // Handle both parsed and raw body
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    const { sessionId, user } = body || {};
    if (!sessionId || !user) return res.status(400).json({ error: "sessionId and user are required" });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const ESBY_SYSTEM = `
You are Esby Oracle: ritual-sensitive, cozy, storybook voice, emotionally grounded.
Offer one card per session. Rich prose, clear imagery. Gentle pacing. No hustle.
Keep it human and kind.`;

    // Non-streaming: simple full reply
    const response = await client.responses.create({
      model: "gpt-4o-mini", // you can use gpt-4o as well
      input: [
        { role: "system", content: ESBY_SYSTEM },
        { role: "user", content: user }
      ]
    });

    const text = response.output_text ?? "Hmm, I’m quiet today.";
    return res.status(200).json({ text });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
