import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request) {
  try {
    const { paragraphs, writingType } = await request.json();

    if (!paragraphs || paragraphs.length === 0) {
      return Response.json({ outline: [], elements: null });
    }

    // Build document text with paragraph indices
    const docText = paragraphs
      .map((p, i) => `[Paragraph ${i + 1}] ${p.text}`)
      .join("\n\n");

    // Determine if we should track story elements
    const isFiction = ["Fiction", "Poetry"].includes(writingType);
    const isNarrative = ["Fiction", "Poetry", "Non-fiction", "Essay", "Blog Post"].includes(writingType);

    const elementsInstruction = isFiction
      ? `
4. "elements": An object tracking story elements found in the text:
   - "characters": array of { "name": string, "description": string (1-5 words: role or key trait) }. Only named or clearly distinct characters.
   - "settings": array of { "name": string, "description": string (1-5 words) }. Physical places, time periods, or worlds.
   - "themes": array of strings. Core themes or motifs (2-4 words each). Only include if clearly present.
   If no elements are found for a category, use an empty array.`
      : isNarrative
      ? `
4. "elements": An object tracking key elements:
   - "themes": array of strings. Core themes, arguments, or topics (2-4 words each).
   - "characters": empty array.
   - "settings": empty array.`
      : `
4. "elements": null`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: "You analyze documents and return structured JSON. Output ONLY valid JSON, no other text.",
      messages: [
        {
          role: "user",
          content: `Analyze this ${writingType || "writing"} and return a JSON object:

1. "outline": an array with one entry per paragraph. Each entry is an object:
   - "index": paragraph number (1-based)
   - "summary": a concise 4-10 word summary of that paragraph's main point or action
   - "type": one of "intro", "argument", "evidence", "transition", "climax", "dialogue", "description", "conclusion", "other"
${elementsInstruction}

Document:
"""
${docText}
"""

Return ONLY the JSON object.`,
        },
      ],
    });

    const content = response.content?.[0]?.text || "{}";

    let result;
    try {
      const cleaned = content.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim();
      result = JSON.parse(cleaned);
    } catch {
      result = { outline: [], elements: null };
    }

    // Validate outline
    const outline = Array.isArray(result.outline)
      ? result.outline.map(item => ({
          index: item.index || 0,
          summary: item.summary || "",
          type: item.type || "other",
        }))
      : [];

    // Validate elements
    let elements = null;
    if (result.elements && typeof result.elements === "object") {
      elements = {
        characters: Array.isArray(result.elements.characters)
          ? result.elements.characters.map(c => ({
              name: c.name || "",
              description: c.description || "",
            })).filter(c => c.name)
          : [],
        settings: Array.isArray(result.elements.settings)
          ? result.elements.settings.map(s => ({
              name: s.name || "",
              description: s.description || "",
            })).filter(s => s.name)
          : [],
        themes: Array.isArray(result.elements.themes)
          ? result.elements.themes.filter(t => typeof t === "string" && t.length > 0)
          : [],
      };
      // If all empty, null out
      if (elements.characters.length === 0 && elements.settings.length === 0 && elements.themes.length === 0) {
        elements = null;
      }
    }

    return Response.json({ outline, elements });
  } catch (error) {
    console.error("Analyze document error:", error);
    return Response.json({ error: error.message || "Analysis failed" }, { status: 500 });
  }
}
