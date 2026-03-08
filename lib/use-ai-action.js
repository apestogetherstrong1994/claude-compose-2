"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { streamFromAPI } from "./streaming";
import { parseSuggestions, parseStreamingSuggestion, parseIdeas, parseStreamingIdeas, parseVoiceProfile, stripStructuredBlocks } from "./parsers";

let suggestionId = 1;

export function useAIAction({ paragraphs, voiceProfile, projectConfig, ghostLength = "sentence" }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [ghostText, setGhostText] = useState(null);
  const [ghostParagraphId, setGhostParagraphId] = useState(null);
  const [brainstormIdeas, setBrainstormIdeas] = useState([]);
  const [currentVoiceProfile, setCurrentVoiceProfile] = useState(voiceProfile || null);
  const [chatMessages, setChatMessages] = useState([]);

  const abortRef = useRef(null);
  const ghostAbortRef = useRef(null);
  const ghostTimerRef = useRef(null);

  // Use refs for latest values to avoid stale closures
  const paragraphsRef = useRef(paragraphs);
  const voiceRef = useRef(currentVoiceProfile);
  const configRef = useRef(projectConfig);
  const chatRef = useRef(chatMessages);
  useEffect(() => { paragraphsRef.current = paragraphs; }, [paragraphs]);
  useEffect(() => { voiceRef.current = currentVoiceProfile; }, [currentVoiceProfile]);
  useEffect(() => { configRef.current = projectConfig; }, [projectConfig]);
  useEffect(() => { chatRef.current = chatMessages; }, [chatMessages]);
  const ghostLengthRef = useRef(ghostLength);
  useEffect(() => { ghostLengthRef.current = ghostLength; }, [ghostLength]);

  const dispatchAction = useCallback(async (toolType, toolParams = {}) => {
    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }

    setIsStreaming(true);
    setStreamingText("");

    let accumulated = "";

    const controller = await streamFromAPI("/api/compose", {
      documentParagraphs: paragraphsRef.current,
      voiceProfile: voiceRef.current,
      projectConfig: configRef.current,
      toolType,
      toolParams,
      messages: toolType === "chat" ? chatRef.current : undefined,
    }, {
      onText: (text) => {
        accumulated += text;
        setStreamingText(accumulated);

        // For brainstorm, parse ideas as they stream
        if (toolType === "brainstorm") {
          const ideas = parseStreamingIdeas(accumulated);
          if (ideas.length > 0) setBrainstormIdeas(ideas);
        }
      },
      onDone: () => {
        setIsStreaming(false);
        setStreamingText("");

        // Parse final result based on tool type
        if (toolType === "brainstorm") {
          const ideas = parseIdeas(accumulated);
          if (ideas.length > 0) setBrainstormIdeas(ideas);
          // Also capture any text after [/IDEAS]
          const afterIdeas = stripStructuredBlocks(accumulated);
          if (afterIdeas) {
            setBrainstormIdeas(prev => [...prev, `💡 ${afterIdeas}`]);
          }
        } else if (toolType === "analyze_voice") {
          const profile = parseVoiceProfile(accumulated);
          if (profile) setCurrentVoiceProfile(profile);
        } else if (toolType === "continue") {
          // Ghost text is handled separately
        } else if (toolType === "chat") {
          const newSuggestions = parseSuggestions(accumulated);
          if (newSuggestions.length > 0) {
            setSuggestions(prev => [
              ...prev,
              ...newSuggestions.map(s => ({
                ...s,
                id: `s_${suggestionId++}`,
                originalText: toolParams?.selectedText || "",
                status: "pending",
              })),
            ]);
          }
          // Add assistant message to chat
          const cleanText = stripStructuredBlocks(accumulated);
          if (cleanText) {
            setChatMessages(prev => [...prev, { role: "assistant", content: cleanText }]);
          }
        } else {
          // Tool actions: parse suggestions
          const newSuggestions = parseSuggestions(accumulated);
          if (newSuggestions.length > 0) {
            setSuggestions(prev => [
              ...prev,
              ...newSuggestions.map(s => ({
                ...s,
                id: `s_${suggestionId++}`,
                originalText: toolParams?.selectedText || "",
                status: "pending",
              })),
            ]);
          }
        }
      },
      onError: (error) => {
        setIsStreaming(false);
        setStreamingText("");
        console.error("AI action error:", error);
      },
    });

    abortRef.current = controller;
  }, []);

  const fetchGhostText = useCallback((paragraphId) => {
    // Clear existing ghost
    if (ghostTimerRef.current) clearTimeout(ghostTimerRef.current);
    if (ghostAbortRef.current) ghostAbortRef.current.abort();
    setGhostText(null);
    setGhostParagraphId(null);

    // Wait 1 second of inactivity
    ghostTimerRef.current = setTimeout(async () => {
      let accumulated = "";

      const controller = await streamFromAPI("/api/compose", {
        documentParagraphs: paragraphsRef.current,
        voiceProfile: voiceRef.current,
        projectConfig: configRef.current,
        toolType: "continue",
        toolParams: { ghostLength: ghostLengthRef.current },
      }, {
        onText: (text) => {
          accumulated += text;
          setGhostText(accumulated);
          setGhostParagraphId(paragraphId);
        },
        onDone: () => {
          // Ghost text stays visible
        },
        onError: () => {
          setGhostText(null);
          setGhostParagraphId(null);
        },
      });

      ghostAbortRef.current = controller;
    }, 1000);
  }, []);

  const clearGhostText = useCallback(() => {
    if (ghostTimerRef.current) clearTimeout(ghostTimerRef.current);
    if (ghostAbortRef.current) ghostAbortRef.current.abort();
    setGhostText(null);
    setGhostParagraphId(null);
  }, []);

  const acceptSuggestion = useCallback((id) => {
    setSuggestions(prev => prev.filter(s => s.id !== id));
  }, []);

  const rejectSuggestion = useCallback((id) => {
    setSuggestions(prev => prev.filter(s => s.id !== id));
  }, []);

  const sendChatMessage = useCallback((content) => {
    setChatMessages(prev => [...prev, { role: "user", content }]);
    dispatchAction("chat", { prompt: content });
  }, [dispatchAction]);

  return {
    suggestions,
    isStreaming,
    streamingText,
    ghostText,
    ghostParagraphId,
    brainstormIdeas,
    voiceProfile: currentVoiceProfile,
    chatMessages,
    dispatchAction,
    fetchGhostText,
    clearGhostText,
    acceptSuggestion,
    rejectSuggestion,
    sendChatMessage,
    setBrainstormIdeas,
  };
}
