import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function getElementsInstruction(writingType) {
  switch (writingType) {
    case "Fiction":
    case "Poetry":
      return `
4. "elements": An object tracking story elements found in the text:
   - "characters": array of { "name": string, "description": string (1-5 words: role or key trait) }. Only named or clearly distinct characters.
   - "settings": array of { "name": string, "description": string (1-5 words) }. Physical places, time periods, or worlds.
   - "themes": array of strings. Core themes or motifs (2-4 words each). Only include if clearly present.
   If no elements are found for a category, use an empty array.`;

    case "Cover Letter":
      return `
4. "elements": An object tracking cover letter elements found in the text:
   - "experience": array of { "name": string, "description": string (1-5 words) }. Past roles, companies, or positions mentioned.
   - "skills": array of strings. Skills, competencies, or strengths highlighted (2-4 words each).
   - "themes": array of strings. Core messages or value propositions being conveyed (2-4 words each).
   If no elements are found for a category, use an empty array.`;

    case "Essay":
    case "Non-fiction":
    case "Blog Post":
      return `
4. "elements": An object tracking argumentative/informational elements found in the text:
   - "arguments": array of { "name": string, "description": string (1-5 words) }. Main arguments, claims, or key points made.
   - "evidence": array of { "name": string, "description": string (1-5 words) }. Specific examples, data, anecdotes, or evidence cited.
   - "themes": array of strings. Core themes, topics, or threads (2-4 words each).
   If no elements are found for a category, use an empty array.`;

    case "Email":
      return `
4. "elements": An object tracking email elements found in the text:
   - "keyPoints": array of { "name": string, "description": string (1-5 words) }. Main points or requests being made.
   - "actionItems": array of strings. Specific actions requested or proposed (2-5 words each).
   - "themes": array of strings. Core topics being discussed (2-4 words each).
   If no elements are found for a category, use an empty array.`;

    case "Other":
    default:
      // Auto-detect: tell the model to figure out what's relevant
      return `
4. "detectedType": a string — your best guess at the writing type. One of: "Fiction", "Poetry", "Essay", "Cover Letter", "Blog Post", "Email", "Non-fiction".
5. "elements": An object tracking elements relevant to the detected writing type.
   - If fiction/poetry: include "characters" (array of { "name": string, "description": string }), "settings" (array of { "name": string, "description": string }), "themes" (array of strings).
   - If essay/non-fiction/blog: include "arguments" (array of { "name": string, "description": string }), "evidence" (array of { "name": string, "description": string }), "themes" (array of strings).
   - If cover letter: include "experience" (array of { "name": string, "description": string }), "skills" (array of strings), "themes" (array of strings).
   - If email: include "keyPoints" (array of { "name": string, "description": string }), "actionItems" (array of strings), "themes" (array of strings).
   If no elements are found for a category, use an empty array.`;
  }
}

function validateNameDescArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map(item => ({
      name: item.name || "",
      description: item.description || "",
    }))
    .filter(item => item.name);
}

function validateStringArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.filter(item => typeof item === "string" && item.length > 0);
}

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

    const elementsInstruction = getElementsInstruction(writingType);

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

    // Validate elements — support all possible element types
    let elements = null;
    if (result.elements && typeof result.elements === "object") {
      const e = result.elements;
      elements = {};

      // Fiction/Poetry elements
      if (e.characters) elements.characters = validateNameDescArray(e.characters);
      if (e.settings) elements.settings = validateNameDescArray(e.settings);

      // Essay/Non-fiction elements
      if (e.arguments) elements.arguments = validateNameDescArray(e.arguments);
      if (e.evidence) elements.evidence = validateNameDescArray(e.evidence);

      // Cover Letter elements
      if (e.experience) elements.experience = validateNameDescArray(e.experience);
      if (e.skills) elements.skills = validateStringArray(e.skills);

      // Email elements
      if (e.keyPoints) elements.keyPoints = validateNameDescArray(e.keyPoints);
      if (e.actionItems) elements.actionItems = validateStringArray(e.actionItems);

      // Universal
      if (e.themes) elements.themes = validateStringArray(e.themes);

      // If everything is empty, null out
      const hasContent = Object.values(elements).some(v =>
        Array.isArray(v) && v.length > 0
      );
      if (!hasContent) elements = null;
    }

    // Pass along detectedType if the model provided one (for "Other" genre)
    const detectedType = result.detectedType || null;

    return Response.json({ outline, elements, detectedType });
  } catch (error) {
    console.error("Analyze document error:", error);
    return Response.json({ error: error.message || "Analysis failed" }, { status: 500 });
  }
}
