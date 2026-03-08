"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export function useSelection(canvasRef) {
  const [selectedText, setSelectedText] = useState("");
  const [selectionRect, setSelectionRect] = useState(null);
  const [paragraphId, setParagraphId] = useState(null);
  const debounceRef = useRef(null);

  const clearSelection = useCallback(() => {
    setSelectedText("");
    setSelectionRect(null);
    setParagraphId(null);
  }, []);

  useEffect(() => {
    const handleSelectionChange = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        const sel = window.getSelection();

        if (!sel || sel.isCollapsed || !sel.toString().trim()) {
          clearSelection();
          return;
        }

        // Check if selection is within our canvas
        const range = sel.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const canvas = canvasRef?.current;

        if (!canvas || !canvas.contains(container)) {
          clearSelection();
          return;
        }

        // Find the paragraph element
        const findParagraph = (node) => {
          let el = node.nodeType === 3 ? node.parentElement : node;
          while (el && !el.dataset?.paragraphId) {
            el = el.parentElement;
          }
          return el;
        };

        const paraEl = findParagraph(range.startContainer);
        if (!paraEl) {
          clearSelection();
          return;
        }

        const text = sel.toString().trim();
        if (!text) {
          clearSelection();
          return;
        }

        const rect = range.getBoundingClientRect();
        setSelectedText(text);
        setSelectionRect(rect);
        setParagraphId(paraEl.dataset.paragraphId);
      }, 200);
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [canvasRef, clearSelection]);

  return { selectedText, selectionRect, paragraphId, clearSelection };
}
