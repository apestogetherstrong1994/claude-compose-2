"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { C } from "@/lib/design-system";
import { Paragraph } from "./Paragraph";
import { FloatingToolbar } from "./FloatingToolbar";
import { AuthorshipBar } from "./AuthorshipBar";
import { useSelection } from "@/lib/use-selection";

export function WritingCanvas({
  paragraphs,
  onParagraphChange,
  onParagraphAdd,
  onParagraphDelete,
  onSplitParagraph,
  onMergeParagraphs,
  onReplaceParagraph,
  onToolAction,
  ghostText,
  ghostParagraphId,
  onAcceptGhost,
  onClearGhost,
  authorStats,
  wordCount,
  autoFocus,
}) {
  const canvasRef = useRef(null);
  const [activeParagraphId, setActiveParagraphId] = useState(null);
  const autoFocused = useRef(false);

  // Auto-focus first paragraph on mount
  useEffect(() => {
    if (autoFocus && !autoFocused.current && canvasRef.current) {
      autoFocused.current = true;
      requestAnimationFrame(() => {
        const firstPara = canvasRef.current?.querySelector("[data-paragraph-id]");
        if (firstPara) {
          firstPara.focus();
          placeCaretAtEnd(firstPara);
        }
      });
    }
  }, [autoFocus]);
  const { selectedText, selectionRect, paragraphId: selParagraphId, clearSelection } = useSelection(canvasRef);

  const handleToolAction = useCallback((action, params = {}) => {
    if (!selectedText || !selParagraphId) return;
    onToolAction?.(action, {
      selectedText,
      paragraphId: selParagraphId,
      ...params,
    });
    // Don't clear selection immediately - let the user see what they selected
    setTimeout(clearSelection, 300);
  }, [selectedText, selParagraphId, onToolAction, clearSelection]);

  const handleKeyDown = useCallback((e, paragraphEl, paragraphId) => {
    // Enter: split paragraph
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const sel = window.getSelection();
      if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const offset = getTextOffset(paragraphEl, range);
        const para = paragraphs.find(p => p.id === paragraphId);
        if (para) {
          onSplitParagraph?.(paragraphId, offset);
          // Focus new paragraph after render
          requestAnimationFrame(() => {
            const idx = paragraphs.findIndex(p => p.id === paragraphId);
            const nextEl = canvasRef.current?.querySelector(`[data-paragraph-id="${paragraphs[idx + 1]?.id}"]`);
            if (nextEl) {
              nextEl.focus();
              placeCaretAtStart(nextEl);
            }
          });
        }
      }
      return;
    }

    // Backspace at start of empty paragraph: delete it
    if (e.key === "Backspace") {
      const para = paragraphs.find(p => p.id === paragraphId);
      if (para && !para.text) {
        e.preventDefault();
        const idx = paragraphs.findIndex(p => p.id === paragraphId);
        if (idx > 0) {
          onParagraphDelete?.(paragraphId);
          requestAnimationFrame(() => {
            const prevEl = canvasRef.current?.querySelector(`[data-paragraph-id="${paragraphs[idx - 1]?.id}"]`);
            if (prevEl) {
              prevEl.focus();
              placeCaretAtEnd(prevEl);
            }
          });
        }
        return;
      }

      // Backspace at start of non-empty: merge with previous
      const sel = window.getSelection();
      if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const offset = getTextOffset(paragraphEl, range);
        if (offset === 0 && paragraphs.findIndex(p => p.id === paragraphId) > 0) {
          e.preventDefault();
          const idx = paragraphs.findIndex(p => p.id === paragraphId);
          const prevPara = paragraphs[idx - 1];
          const cursorPos = prevPara.text.length;
          onMergeParagraphs?.(prevPara.id, paragraphId);
          requestAnimationFrame(() => {
            const prevEl = canvasRef.current?.querySelector(`[data-paragraph-id="${prevPara.id}"]`);
            if (prevEl) {
              prevEl.focus();
              placeCaretAtOffset(prevEl, cursorPos);
            }
          });
          return;
        }
      }
    }

    // Arrow down at end: focus next paragraph
    if (e.key === "ArrowDown") {
      const sel = window.getSelection();
      if (sel.rangeCount > 0) {
        const offset = getTextOffset(paragraphEl, sel.getRangeAt(0));
        const para = paragraphs.find(p => p.id === paragraphId);
        if (para && offset >= para.text.length) {
          const idx = paragraphs.findIndex(p => p.id === paragraphId);
          if (idx < paragraphs.length - 1) {
            e.preventDefault();
            const nextEl = canvasRef.current?.querySelector(`[data-paragraph-id="${paragraphs[idx + 1].id}"]`);
            if (nextEl) {
              nextEl.focus();
              placeCaretAtStart(nextEl);
            }
          }
        }
      }
    }

    // Arrow up at start: focus previous paragraph
    if (e.key === "ArrowUp") {
      const sel = window.getSelection();
      if (sel.rangeCount > 0) {
        const offset = getTextOffset(paragraphEl, sel.getRangeAt(0));
        if (offset === 0) {
          const idx = paragraphs.findIndex(p => p.id === paragraphId);
          if (idx > 0) {
            e.preventDefault();
            const prevEl = canvasRef.current?.querySelector(`[data-paragraph-id="${paragraphs[idx - 1].id}"]`);
            if (prevEl) {
              prevEl.focus();
              placeCaretAtEnd(prevEl);
            }
          }
        }
      }
    }
  }, [paragraphs, onSplitParagraph, onParagraphDelete, onMergeParagraphs]);

  const handleTextChange = useCallback((paragraphId, text) => {
    onParagraphChange?.(paragraphId, text);
    // Clear ghost text on any keystroke
    if (ghostText) onClearGhost?.();
  }, [onParagraphChange, ghostText, onClearGhost]);

  const handleFocus = useCallback((paragraphId) => {
    setActiveParagraphId(paragraphId);
  }, []);

  const handleBlur = useCallback(() => {
    // Small delay so we don't lose activeParagraphId during toolbar clicks
    setTimeout(() => {
      // Don't clear if the toolbar is being clicked
    }, 200);
  }, []);

  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      height: "100%",
      position: "relative",
    }}>
      {/* Scrollable canvas area */}
      <div
        ref={canvasRef}
        data-canvas
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "40px 48px 120px 48px",
        }}
      >
        {paragraphs.map((para) => (
          <Paragraph
            key={para.id}
            paragraph={para}
            isActive={activeParagraphId === para.id}
            ghostText={ghostParagraphId === para.id ? ghostText : null}
            onTextChange={(text) => handleTextChange(para.id, text)}
            onKeyDown={(e, el) => handleKeyDown(e, el, para.id)}
            onFocus={() => handleFocus(para.id)}
            onBlur={handleBlur}
            onAcceptGhost={() => {
              const newId = onAcceptGhost?.();
              if (newId) {
                // Focus the newly created paragraph and place cursor at end
                requestAnimationFrame(() => {
                  const newEl = canvasRef.current?.querySelector(`[data-paragraph-id="${newId}"]`);
                  if (newEl) {
                    newEl.focus();
                    placeCaretAtEnd(newEl);
                  }
                });
              }
            }}
          />
        ))}
      </div>

      {/* Authorship bar at bottom */}
      <AuthorshipBar authorStats={authorStats} wordCount={wordCount} />

      {/* Floating toolbar on selection */}
      <FloatingToolbar
        position={selectionRect ? {
          top: selectionRect.top,
          left: selectionRect.left + selectionRect.width / 2,
        } : null}
        visible={!!selectedText && selectedText.length > 2}
        onAction={handleToolAction}
      />
    </div>
  );
}

// ─── Cursor utilities ───────────────────────────────────────────────────

function getTextOffset(el, range) {
  const preRange = document.createRange();
  preRange.selectNodeContents(el);
  preRange.setEnd(range.startContainer, range.startOffset);
  return preRange.toString().length;
}

function placeCaretAtStart(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(true);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function placeCaretAtEnd(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function placeCaretAtOffset(el, offset) {
  const textNode = el.firstChild;
  if (!textNode) {
    placeCaretAtStart(el);
    return;
  }
  const range = document.createRange();
  const safeOffset = Math.min(offset, textNode.length || 0);
  range.setStart(textNode, safeOffset);
  range.collapse(true);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}
