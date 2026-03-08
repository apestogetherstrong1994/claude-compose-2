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
  const mountedRef = useRef(false);
  const ghostSpanRef = useRef(null);

  // Set initial text on mount (once only — never let React manage contentEditable children)
  useEffect(() => {
    if (ref.current && !mountedRef.current) {
      mountedRef.current = true;
      if (paragraph.text) {
        ref.current.innerText = paragraph.text;
      }
    }
  }, []);

  // Sync text from state only when paragraph changes EXTERNALLY
  // (e.g. accepting a suggestion, merging paragraphs)
  useEffect(() => {
    if (!mountedRef.current) return;
    if (ref.current && paragraph.text !== lastTextRef.current) {
      // Strip any ghost span before comparing/updating
      const ghost = ref.current.querySelector("[data-ghost]");
      if (ghost) { ghost.remove(); ghostSpanRef.current = null; }
      const currentText = ref.current.innerText;
      if (currentText !== paragraph.text) {
        ref.current.innerText = paragraph.text;
      }
      lastTextRef.current = paragraph.text;
    }
  }, [paragraph.text]);

  // Inject ghost text inline inside the contentEditable (after paragraph text sync effect)
  // Reuses the same DOM span across streaming chunks to avoid flicker.
  useEffect(() => {
    if (!ref.current) return;

    if (ghostText && isActive) {
      // Strip any repeated paragraph text the model may have echoed back
      const paraText = paragraph.text || "";
      let displayGhost = ghostText;
      // Strip markdown headers (e.g. "# Opening Paragraph\n\n")
      displayGhost = displayGhost.replace(/^#[^\n]*\n+/, "");
      if (paraText.length > 0) {
        const trimmedPara = paraText.trimEnd();
        const trimmedGhost = displayGhost.trimStart();
        if (trimmedGhost.startsWith(trimmedPara)) {
          displayGhost = trimmedGhost.slice(trimmedPara.length);
        }
      }

      const needsSpace = paraText.length > 0 && !paraText.endsWith(" ") && !paraText.endsWith("\n")
        && displayGhost.length > 0 && !displayGhost.startsWith(" ");
      const finalText = (needsSpace ? " " : "") + displayGhost;

      // Reuse existing ghost span if it's still in the DOM, otherwise create one
      let ghostSpan = ghostSpanRef.current;
      if (!ghostSpan || !ref.current.contains(ghostSpan)) {
        // Create fresh ghost span
        ghostSpan = document.createElement("span");
        ghostSpan.setAttribute("data-ghost", "true");
        ghostSpan.contentEditable = "false";
        ghostSpan.style.cssText = `color:${C.textMuted};opacity:0.4;pointer-events:none;animation:ghostFade 0.3s ease;`;
        ghostSpanRef.current = ghostSpan;
        ref.current.appendChild(ghostSpan);
      }

      // Update text content — find or create the text node (first child before badge)
      const badge = ghostSpan.querySelector("[data-ghost-badge]");
      if (!badge) {
        // First render: set text + create badge
        ghostSpan.textContent = finalText;
        const badgeEl = document.createElement("span");
        badgeEl.setAttribute("data-ghost-badge", "true");
        badgeEl.style.cssText = `display:inline-block;margin-left:8px;padding:1px 6px;background:${C.bgHover};border-radius:4px;font-size:11px;font-family:${C.sans};color:${C.textMuted};vertical-align:middle;`;
        badgeEl.textContent = "Tab";
        ghostSpan.appendChild(badgeEl);
      } else {
        // Subsequent renders: update only the text node, keep badge
        ghostSpan.firstChild.textContent = finalText;
      }
    } else {
      // No ghost text — clean up
      if (ghostSpanRef.current && ref.current.contains(ghostSpanRef.current)) {
        ghostSpanRef.current.remove();
      }
      ghostSpanRef.current = null;
    }
  }, [ghostText, isActive, paragraph.text]);

  const handleInput = useCallback(() => {
    if (ref.current) {
      // Strip ghost span before reading text content
      const ghost = ref.current.querySelector("[data-ghost]");
      if (ghost) { ghost.remove(); ghostSpanRef.current = null; }
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
      />

      {/* Author indicator on hover */}
      {paragraph.author !== "human" && paragraph.text && (
        <div
          data-author-label
          style={{
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
        >
          {authorLabel[paragraph.author]}
        </div>
      )}
    </div>
  );
}
