import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request) {
  try {
    const { text } = await request.json();

    if (!text || text.trim().length < 20) {
      return Response.json({ writingType: null, title: "", audience: "" });
    }

    // Use a fast model to analyze the text — only need first ~2000 chars
    const sample = text.slice(0, 2000);

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system: `You analyze writing samples and return structured metadata. Output ONLY valid JSON, no other text.`,
      messages: [
        {
          role: "user",
          content: `Analyze this writing sample and return a JSON object with three fields:

1. "writingType": one of exactly these values: "Essay", "Fiction", "Cover Letter", "Blog Post", "Email", "Non-fiction", "Poetry", "Other"
2. "title": a suggested title for this piece (short, 3-8 words). If the text already has a clear title or subject, use that.
3. "audience": who this appears to be written for (e.g., "Hiring manager", "General readers", "Academic audience", "Tech professionals"). Keep it concise, 2-5 words.

Writing sample:
"""
${sample}
"""

Return ONLY the JSON object, nothing else.`,
        },
      ],
    });

    const content = response.content?.[0]?.text || "{}";

    // Parse the JSON response
    let result;
    try {
      // Handle potential markdown code fences
      const cleaned = content.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim();
      result = JSON.parse(cleaned);
    } catch {
      result = { writingType: null, title: "", audience: "" };
    }

    // Validate writingType
    const validTypes = ["Essay", "Fiction", "Cover Letter", "Blog Post", "Email", "Non-fiction", "Poetry", "Other"];
    if (!validTypes.includes(result.writingType)) {
      result.writingType = null;
    }

    return Response.json({
      writingType: result.writingType || null,
      title: result.title || "",
      audience: result.audience || "",
    });
  } catch (error) {
    console.error("Analyze context error:", error);
    return Response.json(
      { writingType: null, title: "", audience: "", error: error.message },
      { status: 200 } // Don't fail — just return empty
    );
  }
}
