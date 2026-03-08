"use client";

import { useState } from "react";
import { C } from "@/lib/design-system";
import { Lightbulb, Send, Copy, ArrowRight } from "lucide-react";
import { StreamingDots } from "@/components/chat/StreamingDots";

const QUICK_PROMPTS_BY_GENRE = {
  Fiction: [
    "Plot twists I could use here",
    "Ways to deepen this character",
    "Stronger ways to end this scene",
  ],
  Poetry: [
    "Images or metaphors to explore",
    "Alternative structures for this poem",
    "Surprising turns this could take",
  ],
  Essay: [
    "Counterarguments to address",
    "Stronger ways to open this",
    "What's missing from my argument?",
  ],
  "Cover Letter": [
    "Stronger ways to show impact",
    "How to make my opening stand out",
    "Skills I should highlight more",
  ],
  "Blog Post": [
    "Hooks to grab the reader",
    "Angles I haven't considered",
    "Ways to make this more actionable",
  ],
  Email: [
    "Ways to make this more concise",
    "Stronger subject line ideas",
    "How to make my ask clearer",
  ],
  "Non-fiction": [
    "Examples or evidence to include",
    "Structural alternatives for this piece",
    "What's missing from my argument?",
  ],
  Other: [
    "Alternative directions for this piece",
    "Ways to strengthen my opening",
    "What could make this more compelling?",
  ],
};

export function BrainstormPanel({ ideas, isStreaming, onBrainstorm, onInsertIdea, writingType }) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (text) => {
    const p = text || prompt;
    if (!p.trim()) return;
    setPrompt("");
    onBrainstorm(p);
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 12,
      height: "100%",
    }}>
      {/* Quick prompts */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
      }}>
        {(QUICK_PROMPTS_BY_GENRE[writingType] || QUICK_PROMPTS_BY_GENRE.Other).map((qp) => (
          <button
            key={qp}
            onClick={() => handleSubmit(qp)}
            style={{
              padding: "4px 10px",
              background: C.bgHover,
              border: `1px solid ${C.border}`,
              borderRadius: C.radiusPill,
              color: C.textMuted,
              cursor: "pointer",
              fontFamily: C.sans,
              fontSize: 11,
              transition: C.transitionFast,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.accent;
              e.currentTarget.style.color = C.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.color = C.textMuted;
            }}
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Custom prompt input */}
      <div style={{
        display: "flex",
        gap: 6,
      }}>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Ask Claude to brainstorm..."
          style={{
            flex: 1,
            padding: "8px 12px",
            background: C.bgDeep,
            border: `1px solid ${C.border}`,
            borderRadius: C.radiusSm,
            color: C.text,
            fontFamily: C.sans,
            fontSize: 13,
            outline: "none",
          }}
        />
        <button
          onClick={() => handleSubmit()}
          disabled={!prompt.trim()}
          style={{
            padding: "8px 12px",
            background: C.accent,
            border: "none",
            borderRadius: C.radiusSm,
            color: "#fff",
            cursor: prompt.trim() ? "pointer" : "default",
            opacity: prompt.trim() ? 1 : 0.4,
            transition: C.transitionFast,
          }}
        >
          <Send size={14} />
        </button>
      </div>

      {/* Results */}
      {isStreaming && <StreamingDots />}

      <div style={{
        flex: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}>
        {ideas.map((idea, i) => (
          <div
            key={i}
            style={{
              padding: "10px 12px",
              background: C.bgHover,
              border: `1px solid ${C.border}`,
              borderRadius: C.radiusSm,
              fontSize: 13,
              fontFamily: C.serif,
              color: C.text,
              lineHeight: 1.6,
              animation: `fadeIn 0.2s ease ${i * 0.05}s both`,
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              cursor: "pointer",
              transition: C.transitionFast,
            }}
            onClick={() => onInsertIdea?.(idea)}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
            }}
          >
            <Lightbulb size={14} style={{ color: C.yellow, flexShrink: 0, marginTop: 3 }} />
            <span style={{ flex: 1 }}>{idea}</span>
            <ArrowRight size={12} style={{ color: C.textMuted, flexShrink: 0, marginTop: 3 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
