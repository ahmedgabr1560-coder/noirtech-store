export async function openaiChat(system, messages, maxTokens = 450) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not configured");
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "system", content: system }, ...messages], max_tokens: maxTokens, temperature: 0.85 })
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error?.message || "OpenAI request failed");
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenAI returned no text");
  return text;
}

export async function claudeChat(system, messages, maxTokens = 450) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not configured");
  const headers = { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" };
  let model = process.env.ANTHROPIC_MODEL;
  if (!model) {
    try {
      const modelsResponse = await fetch("https://api.anthropic.com/v1/models?limit=100", { headers });
      const modelsData = await modelsResponse.json();
      const available = (modelsData.data || []).map(item => item.id).filter(id => /claude/i.test(id));
      model = available.find(id => /haiku/i.test(id)) || available.find(id => /sonnet/i.test(id)) || available[0];
    } catch (_) {}
  }
  model = model || "claude-3-5-haiku-latest";
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers,
    body: JSON.stringify({ model, system, messages, max_tokens: maxTokens, temperature: 0.85 })
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error?.message || `Claude request failed (${model})`);
  const text = (data.content || []).filter(block => block.type === "text").map(block => block.text).join("\n").trim();
  if (!text) throw new Error("Claude returned no text");
  return text;
}

export async function openrouterChat(system, messages, maxTokens = 450) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not configured");
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "HTTP-Referer": "https://noirtech-store.vercel.app",
      "X-Title": "NoirTech Store"
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
      messages: [{ role: "system", content: system }, ...messages],
      max_tokens: maxTokens,
      temperature: 0.85
    })
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error?.message || "OpenRouter request failed");
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenRouter returned no text");
  return text;
}

export async function geminiChat(system, messages, maxTokens = 450) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const contents = messages.map(message => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: String(message.content || "") }]
  }));
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.85 }
    })
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error?.message || `Gemini request failed (${model})`);
  const text = (data.candidates?.[0]?.content?.parts || []).map(part => part.text || "").join("\n").trim();
  if (!text) throw new Error("Gemini returned no text");
  return text;
}

export async function resilientChat(system, messages, maxTokens = 450) {
  try { return { reply: await openaiChat(system, messages, maxTokens), provider: "openai" }; }
  catch (openaiError) {
    try { return { reply: await claudeChat(system, messages, maxTokens), provider: "claude" }; }
    catch (claudeError) {
      try { return { reply: await openrouterChat(system, messages, maxTokens), provider: "openrouter" }; }
      catch (openrouterError) {
        try { return { reply: await geminiChat(system, messages, maxTokens), provider: "gemini" }; }
        catch (geminiError) {
          console.error("AI providers failed", { openai: openaiError.message, claude: claudeError.message, openrouter: openrouterError.message, gemini: geminiError.message });
          throw new Error("All AI providers failed");
        }
      }
    }
  }
}
