export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders(request.headers.get("Origin"))
      });
    }

    if (url.pathname === "/health") {
      return json({ ok: true, name: "bestie-worker" }, request);
    }

    if (url.pathname === "/chat" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const userMsg = String(body.message || "").slice(0, 4000);

      if (!userMsg.trim()) return json({ reply: "Kuch bolo na 🙂" }, request);

      const systemPrompt = `
You are "Bestie", a warm, caring AI best-friend companion.
Style: Hinglish-friendly, casual, supportive, not robotic. Use emojis lightly.
Rules:
- Never encourage isolation from real people. Encourage healthy offline relationships.
- Be honest you're an AI when relevant.
- If user expresses self-harm/crisis: be supportive, encourage immediate professional help and reaching trusted person.
- No manipulation, no guilt, no pressure.
      `.trim();

      const reply = await callGemini(env.GEMINI_API_KEY, systemPrompt, userMsg);

      return json({ reply }, request);
    }

    return new Response("Not found", { status: 404, headers: corsHeaders(request.headers.get("Origin")) });
  }
};

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
  };
}

function json(obj, request) {
  return new Response(JSON.stringify(obj), {
    headers: { "content-type": "application/json", ...corsHeaders(request.headers.get("Origin")) }
  });
}

async function callGemini(apiKey, systemPrompt, userMsg) {
  if (!apiKey) return "Setup missing: GEMINI_API_KEY Cloudflare me add karo.";

  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
    encodeURIComponent(apiKey);

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          { text: `SYSTEM:\n${systemPrompt}\n\nUSER:\n${userMsg}` }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 350
    }
  };

  const r = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!r.ok) {
    const errText = await r.text().catch(() => "");
    return `Gemini error (${r.status}).`;
  }

  const data = await r.json();
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "";
  return text.trim() || "Hmm… main samajh nahi paayi.";
}
