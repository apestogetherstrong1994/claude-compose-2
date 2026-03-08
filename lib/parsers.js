// ─── Response parsers for Claude's structured output ─────────────────────

export function parseSuggestions(text) {
  const suggestions = [];
  const regex = /\[SUGGESTION\]\s*([\s\S]*?)\[\/SUGGESTION\]/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const block = match[1];
    const suggestion = {};

    const typeMatch = block.match(/type:\s*(.+)/);
    const targetMatch = block.match(/target:\s*(.+)/);
    const reasoningMatch = block.match(/reasoning:\s*(.+)/);
    const textMatch = block.match(/text:\s*([\s\S]*?)$/);

    if (typeMatch) suggestion.type = typeMatch[1].trim();
    if (targetMatch) suggestion.target = targetMatch[1].trim();
    if (reasoningMatch) suggestion.reasoning = reasoningMatch[1].trim();
    if (textMatch) suggestion.text = textMatch[1].trim();

    if (suggestion.text) suggestions.push(suggestion);
  }

  return suggestions;
}

export function parseStreamingSuggestion(text) {
  // Check for partial (still-streaming) suggestion block
  const openIdx = text.lastIndexOf("[SUGGESTION]");
  const closeIdx = text.lastIndexOf("[/SUGGESTION]");

  if (openIdx === -1) return null;
  if (closeIdx > openIdx) return null; // It's complete, use parseSuggestions instead

  const partial = text.slice(openIdx + 12);
  const suggestion = {};

  const typeMatch = partial.match(/type:\s*(.+)/);
  const targetMatch = partial.match(/target:\s*(.+)/);
  const reasoningMatch = partial.match(/reasoning:\s*(.+)/);
  const textMatch = partial.match(/text:\s*([\s\S]*?)$/);

  if (typeMatch) suggestion.type = typeMatch[1].trim();
  if (targetMatch) suggestion.target = targetMatch[1].trim();
  if (reasoningMatch) suggestion.reasoning = reasoningMatch[1].trim();
  if (textMatch) suggestion.text = textMatch[1].trim();

  return suggestion.text ? suggestion : null;
}

export function parseIdeas(text) {
  const match = text.match(/\[IDEAS\]\s*([\s\S]*?)\[\/IDEAS\]/);
  if (!match) return [];

  return match[1]
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.startsWith("- "))
    .map(l => l.slice(2).trim())
    .filter(Boolean);
}

export function parseStreamingIdeas(text) {
  const startIdx = text.indexOf("[IDEAS]");
  if (startIdx === -1) return [];

  const content = text.slice(startIdx + 7);
  return content
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.startsWith("- "))
    .map(l => l.slice(2).trim())
    .filter(Boolean);
}

export function parseVoiceProfile(text) {
  const match = text.match(/\[VOICE_PROFILE\]\s*\n([\s\S]*?)\[\/VOICE_PROFILE\]/);
  if (!match) return null;

  const block = match[1];
  const profile = {};

  const fields = ["tone", "sentences", "vocabulary", "structure", "signature"];
  for (const field of fields) {
    const fieldMatch = block.match(new RegExp(`${field}:\\s*(.+)`));
    if (fieldMatch) profile[field] = fieldMatch[1].trim();
  }

  return Object.keys(profile).length > 0 ? profile : null;
}

export function stripStructuredBlocks(text) {
  return text
    .replace(/\[SUGGESTION\][\s\S]*?\[\/SUGGESTION\]/g, "")
    .replace(/\[VOICE_PROFILE\][\s\S]*?\[\/VOICE_PROFILE\]/g, "")
    .replace(/\[IDEAS\][\s\S]*?\[\/IDEAS\]/g, "")
    .replace(/\[SUGGESTION\][\s\S]*$/, "")
    .replace(/\[VOICE_PROFILE\][\s\S]*$/, "")
    .replace(/\[IDEAS\][\s\S]*$/, "")
    .trim();
}
