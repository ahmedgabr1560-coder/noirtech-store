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
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest", system, messages, max_tokens: maxTokens, temperature: 0.85 })
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error?.message || "Claude request failed");
  const text = (data.content || []).filter(block => block.type === "text").map(block => block.text).join("\n").trim();
  if (!text) throw new Error("Claude returned no text");
  return text;
}

export async function resilientChat(system, messages, maxTokens = 450) {
  try { return { reply: await openaiChat(system, messages, maxTokens), provider: "openai" }; }
  catch (openaiError) {
    try { return { reply: await claudeChat(system, messages, maxTokens), provider: "claude" }; }
    catch (claudeError) {
      console.error("AI providers failed", { openai: openaiError.message, claude: claudeError.message });
      throw new Error("All AI providers failed");
    }
  }
}
