"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Debounced document analysis hook.
 * Calls /api/analyze-document when paragraphs change significantly.
 * Returns outline (per-paragraph summaries) and story elements.
 */
export function useDocumentAnalysis({ paragraphs, writingType }) {
  const [outline, setOutline] = useState([]);
  const [storyElements, setStoryElements] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const timerRef = useRef(null);
  const abortRef = useRef(null);
  const lastWordCountRef = useRef(0);
  const lastParaCountRef = useRef(0);
  // Refs to avoid stale closure issues
  const paragraphsRef = useRef(paragraphs);
  const writingTypeRef = useRef(writingType);
  useEffect(() => { paragraphsRef.current = paragraphs; }, [paragraphs]);
  useEffect(() => { writingTypeRef.current = writingType; }, [writingType]);

  const analyze = useCallback(async () => {
    const paras = paragraphsRef.current;
    const wType = writingTypeRef.current;

    if (!paras || paras.length === 0) return;

    // Cancel in-flight
    if (abortRef.current) abortRef.current.abort();

    const controller = new AbortController();
    abortRef.current = controller;
    setIsAnalyzing(true);

    try {
      const res = await fetch("/api/analyze-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paragraphs: paras.map(p => ({ text: p.text, author: p.author })),
          writingType: wType || "Other",
        }),
        signal: controller.signal,
      });

      const data = await res.json();
      setOutline(data.outline || []);
      setStoryElements(data.elements || null);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Document analysis error:", err);
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  useEffect(() => {
    // Only analyze when there's meaningful content
    const totalWords = paragraphs.reduce((sum, p) => {
      return sum + (p.text ? p.text.split(/\s+/).filter(Boolean).length : 0);
    }, 0);

    if (totalWords < 20) return;

    // Trigger analysis when:
    // - First time we cross 20 words
    // - Paragraph count changed (new paragraph added/removed)
    // - Word count increased by 30+ since last analysis
    const paraCount = paragraphs.length;
    const wordDelta = totalWords - lastWordCountRef.current;
    const paraChanged = paraCount !== lastParaCountRef.current;

    if (wordDelta < 30 && !paraChanged && lastWordCountRef.current > 0) return;

    // Use shorter delay for first analysis (e.g., pasted text), longer for subsequent
    const isFirst = lastWordCountRef.current === 0;
    const delay = isFirst ? 1000 : 5000;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      lastWordCountRef.current = totalWords;
      lastParaCountRef.current = paraCount;
      analyze();
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [paragraphs, writingType, analyze]);

  return { outline, storyElements, isAnalyzing };
}
