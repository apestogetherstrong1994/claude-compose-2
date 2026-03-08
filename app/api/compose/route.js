import Anthropic from "@anthropic-ai/sdk";
import { getSystemPrompt } from "@/lib/prompts";

export const maxDuration = 60;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const TOKEN_LIMITS = {
  rewrite: 2048,
  expand: 2048,
  shorten: 1024,
  tone: 2048,
  describe: 2048,
  continue: 512,
  continue_paragraph: 1024,
  continue_passage: 2048,
  brainstorm: 2048,
  analyze_voice: 1024,
  chat: 4096,
};

export async function POST(request) {
  try {
    const { messages, documentParagraphs, voiceProfile, projectConfig, toolType, toolParams } = await request.json();

    const systemPrompt = getSystemPrompt(toolType || "chat", {
      documentParagraphs,
      voiceProfile,
      projectConfig,
      toolParams,
    });

    // Build messages array
    let formattedMessages = [];

    if (messages?.length > 0) {
      // Window to last 10 messages
      const windowed = messages.length > 10 ? messages.slice(-10) : messages;
      const trimmed = windowed[0]?.role === "assistant" ? windowed.slice(1) : windowed;
      formattedMessages = trimmed.map(msg => ({
        role: msg.role,
        content: msg.content || "",
      }));
    }

    // For tool actions, create a single user message
    if (toolType && toolType !== "chat") {
      const actionMessage = buildActionMessage(toolType, toolParams);
      formattedMessages = [{ role: "user", content: actionMessage }];
    }

    if (formattedMessages.length === 0) {
      formattedMessages = [{ role: "user", content: "Hello" }];
    }

    // For continue, adjust token limit based on ghostLength
    let tokenKey = toolType;
    if (toolType === "continue" && toolParams?.ghostLength) {
      const gl = toolParams.ghostLength;
      if (gl === "paragraph") tokenKey = "continue_paragraph";
      else if (gl === "passage") tokenKey = "continue_passage";
    }
    const maxTokens = TOKEN_LIMITS[tokenKey] || 4096;

    const stream = await client.messages.stream({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: formattedMessages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta") {
              if (event.delta?.text) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "text", text: event.delta.text })}\n\n`)
                );
              }
            } else if (event.type === "message_start") {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "start", model: event.message?.model })}\n\n`)
              );
            } else if (event.type === "message_stop") {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "stop" })}\n\n`)
              );
            } else if (event.type === "message_delta") {
              const deltaData = {};
              if (event.usage) deltaData.usage = event.usage;
              if (event.delta?.stop_reason) deltaData.stopReason = event.delta.stop_reason;
              if (Object.keys(deltaData).length > 0) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "message_delta", ...deltaData })}\n\n`)
                );
              }
            }
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (err) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", error: err.message })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Compose API error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

function buildActionMessage(toolType, toolParams) {
  switch (toolType) {
    case "rewrite":
      return `Please rewrite this selected text to make it stronger: "${toolParams?.selectedText}"`;
    case "expand":
      return `Please expand this text with more detail: "${toolParams?.selectedText}"`;
    case "shorten":
      return `Please make this text more concise: "${toolParams?.selectedText}"`;
    case "tone":
      return `Please rewrite this text with a ${toolParams?.tone} tone: "${toolParams?.selectedText}"`;
    case "describe":
      return `Please enrich this text with more descriptive detail: "${toolParams?.selectedText}"`;
    case "continue": {
      const gl = toolParams?.ghostLength || "sentence";
      if (gl === "passage") return `Please continue writing the next 2-3 paragraphs naturally.`;
      if (gl === "paragraph") return `Please continue writing the next full paragraph naturally.`;
      return `Please continue writing the next 1-3 sentences naturally.`;
    }
    case "brainstorm":
      return toolParams?.prompt || "Help me brainstorm ideas.";
    case "analyze_voice":
      return `Please analyze my writing voice and generate a voice profile.`;
    default:
      return toolParams?.prompt || "Hello";
  }
}
