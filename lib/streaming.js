// ─── Reusable SSE streaming utility ─────────────────────────────────────

export async function streamFromAPI(url, body, { onText, onDone, onError }) {
  const controller = new AbortController();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: "Request failed" }));
      onError?.(err.error || "Request failed");
      return controller;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();

        if (data === "[DONE]") {
          onDone?.();
          return controller;
        }

        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "text" && parsed.text) {
            onText?.(parsed.text);
          } else if (parsed.type === "error") {
            onError?.(parsed.error);
            return controller;
          }
        } catch (e) {
          // Ignore parse errors in stream
        }
      }
    }

    onDone?.();
  } catch (err) {
    if (err.name !== "AbortError") {
      onError?.(err.message);
    }
  }

  return controller;
}
