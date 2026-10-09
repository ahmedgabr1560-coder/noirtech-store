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
  const key = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY2;
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

export async function openrouterSearchChat(system, messages, maxTokens = 650) {
  const key = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY2;
  if (!key) throw new Error("OPENROUTER_API_KEY is not configured");
  const model = process.env.OPENROUTER_SEARCH_MODEL || "perplexity/sonar";
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "HTTP-Referer": "https://noirtech-store.vercel.app",
      "X-Title": "NoirTech Live Price Search"
    },
    body: JSON.stringify({ model, messages: [{ role: "system", content: system }, ...messages], max_tokens: maxTokens, temperature: 0.25 })
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error?.message || "OpenRouter search request failed");
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenRouter search returned no text");
  const citations = Array.isArray(data.citations) ? data.citations.filter(Boolean).slice(0, 5) : [];
  return { text, citations };
}

export async function geminiChat(system, messages, maxTokens = 450) {
  const key = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY2;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
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
  // ابدأ بالمحركات المتاحة عادةً للمتجر، حتى لا نضيع وقت الطلب في مفتاح OpenAI منتهي.
  const providers = [
    ["openrouter", openrouterChat],
    ["gemini", geminiChat],
    ["openai", openaiChat],
    ["claude", claudeChat]
  ].filter(([name]) => ({ openrouter: process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY2, gemini: process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY2, openai: process.env.OPENAI_API_KEY, claude: process.env.ANTHROPIC_API_KEY }[name]));
  const errors = {};
  for (const [provider, fn] of providers) {
    try { return { reply: await fn(system, messages, maxTokens), provider }; }
    catch (error) { errors[provider] = error.message; }
  }
  console.error("AI providers failed", errors);
  throw new Error("لم يعمل أي محرك ذكاء اصطناعي: " + Object.values(errors).join(" | "));
}
