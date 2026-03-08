"use client";

import { useState, useRef, useEffect } from "react";
import { C } from "@/lib/design-system";
import { MessageCircle, X, Send } from "lucide-react";
import { StreamingDots } from "./StreamingDots";
import { InlineMarkdown } from "./InlineMarkdown";

export function ChatDrawer({ messages, isStreaming, onSendMessage, isOpen, onToggle }) {
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const handleSubmit = () => {
    if (!input.trim() || isStreaming) return;
    onSendMessage(input.trim());
    setInput("");
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: C.bgComposer,
          border: `1px solid ${C.border}`,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: C.textSec,
          boxShadow: C.shadow,
          zIndex: 100,
          transition: C.transitionFast,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = C.accent;
          e.currentTarget.style.color = C.accent;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = C.border;
          e.currentTarget.style.color = C.textSec;
        }}
      >
        <MessageCircle size={18} />
      </button>
    );
  }

  return (
    <div style={{
      position: "fixed",
      bottom: 20,
      right: 20,
      width: 360,
      height: 480,
      background: C.bgDeep,
      border: `1px solid ${C.border}`,
      borderRadius: C.radiusLg,
      boxShadow: C.shadowModal,
      display: "flex",
      flexDirection: "column",
      zIndex: 100,
      animation: "slideUp 0.2s ease",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: C.sans,
          fontSize: 13,
          fontWeight: 600,
          color: C.text,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}>
          <MessageCircle size={14} style={{ color: C.accent }} />
          Chat with Claude
        </span>
        <button
          onClick={onToggle}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: C.textMuted,
            padding: 4,
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {messages.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: 24,
            color: C.textMuted,
            fontSize: 13,
            fontFamily: C.sans,
          }}>
            Ask Claude anything about your writing
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "85%",
              padding: "8px 12px",
              background: msg.role === "user" ? C.accentSoft : C.bgHover,
              borderRadius: C.radiusSm,
              fontSize: 13,
              fontFamily: C.sans,
              color: C.text,
              lineHeight: 1.5,
              animation: "fadeIn 0.15s ease",
            }}
          >
            <InlineMarkdown text={msg.content} />
          </div>
        ))}
        {isStreaming && <StreamingDots />}
      </div>

      {/* Input */}
      <div style={{
        padding: "8px 12px",
        borderTop: `1px solid ${C.border}`,
        display: "flex",
        gap: 8,
        flexShrink: 0,
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Ask about your writing..."
          style={{
            flex: 1,
            padding: "8px 12px",
            background: C.bgComposer,
            border: `1px solid ${C.border}`,
            borderRadius: C.radiusSm,
            color: C.text,
            fontFamily: C.sans,
            fontSize: 13,
            outline: "none",
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isStreaming}
          style={{
            padding: "8px 10px",
            background: input.trim() ? C.accent : C.bgHover,
            border: "none",
            borderRadius: C.radiusSm,
            cursor: input.trim() ? "pointer" : "default",
            color: input.trim() ? "#fff" : C.textMuted,
            transition: C.transitionFast,
          }}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
