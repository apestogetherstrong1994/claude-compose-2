"use client";

import { useState, useCallback, useMemo } from "react";

let nextId = 1;
function genId() {
  return `p_${nextId++}`;
}

export function useDocument(initial = []) {
  const [paragraphs, setParagraphs] = useState(() =>
    initial.length > 0
      ? initial.map(p => ({ ...p, id: p.id || genId() }))
      : [{ id: genId(), text: "", author: "human", status: "active" }]
  );

  const addParagraph = useCallback((afterId, text = "", author = "human") => {
    const newP = { id: genId(), text, author, status: "accepted" };
    setParagraphs(prev => {
      if (!afterId) return [...prev, newP];
      const idx = prev.findIndex(p => p.id === afterId);
      if (idx === -1) return [...prev, newP];
      const next = [...prev];
      next.splice(idx + 1, 0, newP);
      return next;
    });
    return newP.id;
  }, []);

  const updateParagraph = useCallback((id, text) => {
    setParagraphs(prev =>
      prev.map(p => (p.id === id ? { ...p, text, status: "accepted" } : p))
    );
  }, []);

  const deleteParagraph = useCallback((id) => {
    setParagraphs(prev => {
      const filtered = prev.filter(p => p.id !== id);
      if (filtered.length === 0) {
        return [{ id: genId(), text: "", author: "human", status: "active" }];
      }
      return filtered;
    });
  }, []);

  const replaceParagraph = useCallback((id, text, author) => {
    setParagraphs(prev =>
      prev.map(p => (p.id === id ? { ...p, text, author, status: "accepted" } : p))
    );
  }, []);

  const splitParagraph = useCallback((id, offset) => {
    setParagraphs(prev => {
      const idx = prev.findIndex(p => p.id === id);
      if (idx === -1) return prev;
      const para = prev[idx];
      const before = para.text.slice(0, offset);
      const after = para.text.slice(offset);
      const newP = { id: genId(), text: after, author: "human", status: "accepted" };
      const next = [...prev];
      next[idx] = { ...para, text: before };
      next.splice(idx + 1, 0, newP);
      return next;
    });
  }, []);

  const mergeParagraphs = useCallback((id1, id2) => {
    setParagraphs(prev => {
      const idx1 = prev.findIndex(p => p.id === id1);
      const idx2 = prev.findIndex(p => p.id === id2);
      if (idx1 === -1 || idx2 === -1) return prev;
      const merged = {
        ...prev[idx1],
        text: prev[idx1].text + prev[idx2].text,
      };
      const next = [...prev];
      next[idx1] = merged;
      next.splice(idx2, 1);
      return next;
    });
  }, []);

  const initFromText = useCallback((text, author = "human") => {
    const paras = text
      .split(/\n\n+/)
      .map(t => t.trim())
      .filter(Boolean)
      .map(t => ({ id: genId(), text: t, author, status: "accepted" }));
    if (paras.length > 0) {
      setParagraphs(paras);
    }
  }, []);

  const wordCount = useMemo(() => {
    return paragraphs
      .filter(p => p.text)
      .reduce((sum, p) => sum + p.text.split(/\s+/).filter(Boolean).length, 0);
  }, [paragraphs]);

  const authorStats = useMemo(() => {
    const stats = { human: 0, claude: 0, collaborative: 0 };
    paragraphs.forEach(p => {
      if (p.text && stats[p.author] !== undefined) {
        const words = p.text.split(/\s+/).filter(Boolean).length;
        stats[p.author] += words;
      }
    });
    return stats;
  }, [paragraphs]);

  return {
    paragraphs,
    setParagraphs,
    addParagraph,
    updateParagraph,
    deleteParagraph,
    replaceParagraph,
    splitParagraph,
    mergeParagraphs,
    initFromText,
    wordCount,
    authorStats,
  };
}
