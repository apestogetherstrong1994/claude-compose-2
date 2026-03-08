"use client";

import { useRef, useEffect, useCallback } from "react";
import { C } from "@/lib/design-system";

const authorBorder = {
  human: "transparent",
  claude: C.purple,
  collaborative: C.blue,
};

const authorLabel = {
  human: "you",
  claude: "Claude",
  collaborative: "collaborative",
};

export function Paragraph({
  paragraph,
  isActive,
  ghostText,
  onTextChange,
  onKeyDown,
  onFocus,
  onBlur,
  onAcceptGhost,
}) {
  const ref = useRef(null);
  const lastTextRef = useRef(paragraph.text);

  // Sync text from state only when paragraph changes externally
  useEffect(() => {
    if (ref.current && paragraph.text !== lastTextRef.current) {
      // Only update innerHTML if text actually changed externally
      const currentText = ref.current.innerText;
      if (currentText !== paragraph.text) {
        ref.current.innerText = paragraph.text;
      }
      lastTextRef.current = paragraph.text;
    }
  }, [paragraph.text]);

  const handleInput = useCallback(() => {
    if (ref.current) {
      const text = ref.current.innerText;
      lastTextRef.current = text;
      onTextChange?.(text);
    }
  }, [onTextChange]);

  const handleKeyDown = useCallback((e) => {
    // Tab to accept ghost text
    if (e.key === "Tab" && ghostText) {
      e.preventDefault();
      onAcceptGhost?.();
      return;
    }

    // Pass to parent for Enter/Backspace handling
    onKeyDown?.(e, ref.current);
  }, [ghostText, onAcceptGhost, onKeyDown]);

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  }, []);

  const borderColor = authorBorder[paragraph.author] || "transparent";
  const isEmpty = !paragraph.text;

  return (
    <div style={{ position: "relative", marginBottom: 2 }}>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-paragraph-id={paragraph.id}
        data-placeholder={isEmpty ? "Start writing..." : ""}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        onPaste={handlePaste}
        style={{
          fontFamily: C.serif,
          fontSize: 17,
          lineHeight: 1.85,
          color: C.text,
          padding: "6px 0 6px 16px",
          borderLeft: `3px solid ${borderColor}`,
          outline: "none",
          whiteSpace: "pre-wrap",
          wordWrap: "break-word",
          minHeight: 32,
          transition: "border-color 0.2s ease",
          position: "relative",
        }}
      >
        {paragraph.text}
      </div>

      {/* Ghost text (tab-to-continue) */}
      {ghostText && isActive && (
        <span
          style={{
            color: C.textMuted,
            opacity: 0.4,
            fontFamily: C.serif,
            fontSize: 17,
            lineHeight: 1.85,
            pointerEvents: "none",
            paddingLeft: 16,
            display: "block",
            animation: "ghostFade 0.3s ease",
          }}
        >
          {ghostText}
          <span style={{
            display: "inline-block",
            marginLeft: 8,
            padding: "1px 6px",
            background: C.bgHover,
            borderRadius: 4,
            fontSize: 11,
            fontFamily: C.sans,
            color: C.textMuted,
            verticalAlign: "middle",
          }}>
            Tab
          </span>
        </span>
      )}

      {/* Author indicator on hover */}
      {paragraph.author !== "human" && paragraph.text && (
        <div style={{
          position: "absolute",
          top: 4,
          right: 0,
          fontSize: 10,
          fontFamily: C.sans,
          color: borderColor,
          opacity: 0,
          transition: "opacity 0.15s ease",
          pointerEvents: "none",
        }}
        className="author-label"
        >
          {authorLabel[paragraph.author]}
        </div>
      )}

      <style jsx>{`
        div:hover .author-label {
          opacity: 0.7 !important;
        }
      `}</style>
    </div>
  );
}
