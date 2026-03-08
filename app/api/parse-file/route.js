import Anthropic from "@anthropic-ai/sdk";
import mammoth from "mammoth";

export const maxDuration = 60;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    // ── DOCX: parse with mammoth ──────────────────────────────────────────
    if (fileName.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer });
      return Response.json({ text: result.value.trim() });
    }

    // ── PDF: send to Claude vision to extract text with formatting ────────
    if (fileName.endsWith(".pdf")) {
      const base64 = buffer.toString("base64");

      const message = await client.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 8192,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: base64,
                },
              },
              {
                type: "text",
                text: `Extract ALL the text content from this PDF document. Preserve the original paragraph structure — separate paragraphs with double newlines. Preserve headings, bullet points, and numbered lists using plain text formatting. Do NOT add any commentary, summaries, or explanations — output ONLY the extracted text content exactly as written in the document.`,
              },
            ],
          },
        ],
      });

      const extractedText = message.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n\n");

      return Response.json({ text: extractedText.trim() });
    }

    // ── Plain text / other ────────────────────────────────────────────────
    if (fileName.endsWith(".txt") || fileName.endsWith(".md")) {
      const text = buffer.toString("utf-8");
      return Response.json({ text: text.trim() });
    }

    return Response.json(
      { error: "Unsupported file type. Please upload a .pdf, .docx, or .txt file." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Parse file error:", error);
    return Response.json(
      { error: error.message || "Failed to parse file" },
      { status: 500 }
    );
  }
}
