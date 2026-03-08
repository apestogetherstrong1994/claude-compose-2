"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { C } from "@/lib/design-system";
import { useDocument } from "@/lib/use-document";
import { useAIAction } from "@/lib/use-ai-action";
import { WelcomeScreen } from "@/components/onboarding/WelcomeScreen";
import { ContextSetup } from "@/components/onboarding/ContextSetup";
import { TopBar } from "@/components/shared/TopBar";
import { WritingCanvas } from "@/components/canvas/WritingCanvas";
import { SuggestionPanel } from "@/components/sidebar/SuggestionPanel";
import { ChatDrawer } from "@/components/chat/ChatDrawer";

export default function ClaudeCompose() {
  // ─── Phase state ──────────────────────────────────────────────────
  const [phase, setPhase] = useState("welcome"); // welcome | context | writing
  const [startData, setStartData] = useState(null); // { mode, description, text }
  const [projectConfig, setProjectConfig] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false);
  const [ghostLength, setGhostLength] = useState("sentence"); // sentence | paragraph | passage
  const voiceAnalyzedRef = useRef(false);

  // ─── Document hook ────────────────────────────────────────────────
  const {
    paragraphs,
    addParagraph,
    updateParagraph,
    deleteParagraph,
    replaceParagraph,
    splitParagraph,
    mergeParagraphs,
    initFromText,
    wordCount,
    authorStats,
  } = useDocument();

  // ─── AI Action hook ───────────────────────────────────────────────
  const {
    suggestions,
    isStreaming,
    streamingText,
    ghostText,
    ghostParagraphId,
    brainstormIdeas,
    voiceProfile,
    chatMessages,
    dispatchAction,
    fetchGhostText,
    clearGhostText,
    acceptSuggestion,
    rejectSuggestion,
    sendChatMessage,
    setBrainstormIdeas,
  } = useAIAction({ paragraphs, voiceProfile: null, projectConfig, ghostLength });

  // ─── Phase transitions ────────────────────────────────────────────
  const handleWelcomeStart = useCallback((data) => {
    setStartData(data);
    if (data.mode === "explore") {
      // Skip context, go straight to writing
      setPhase("writing");
    } else {
      setPhase("context");
    }
  }, []);

  const handleContextComplete = useCallback((config) => {
    setProjectConfig(config);
    if (startData?.text) {
      initFromText(startData.text);
    }
    setPhase("writing");
  }, [startData, initFromText]);

  const handleContextSkip = useCallback(() => {
    setProjectConfig({
      writingType: "Other",
      title: "",
      audience: "",
      contextNotes: startData?.description || "",
    });
    if (startData?.text) {
      initFromText(startData.text);
    }
    setPhase("writing");
  }, [startData, initFromText]);

  // ─── Voice analysis trigger ───────────────────────────────────────
  useEffect(() => {
    if (phase !== "writing" || voiceAnalyzedRef.current) return;

    const humanParagraphs = paragraphs.filter(p => p.author === "human" && p.text.length > 30);
    if (humanParagraphs.length >= 2) {
      voiceAnalyzedRef.current = true;
      setIsAnalyzingVoice(true);
      dispatchAction("analyze_voice").then(() => setIsAnalyzingVoice(false));
    }
  }, [paragraphs, phase, dispatchAction]);

  // ─── Tool action handler ──────────────────────────────────────────
  const handleToolAction = useCallback((action, params) => {
    dispatchAction(action, params);
  }, [dispatchAction]);

  // ─── Suggestion accept/reject/edit ────────────────────────────────
  const handleAcceptSuggestion = useCallback((suggestion) => {
    // Find the paragraph by target
    const targetId = suggestion.target;
    const para = paragraphs.find(p => p.id === targetId);

    if (para) {
      // Replace the paragraph text
      replaceParagraph(targetId, suggestion.text, "claude");
    } else {
      // Add as new paragraph at end
      addParagraph(null, suggestion.text, "claude");
    }
    acceptSuggestion(suggestion.id);
  }, [paragraphs, replaceParagraph, addParagraph, acceptSuggestion]);

  const handleEditSuggestion = useCallback((suggestion, editedText) => {
    const targetId = suggestion.target;
    const para = paragraphs.find(p => p.id === targetId);

    if (para) {
      replaceParagraph(targetId, editedText, "collaborative");
    } else {
      addParagraph(null, editedText, "collaborative");
    }
    acceptSuggestion(suggestion.id);
  }, [paragraphs, replaceParagraph, addParagraph, acceptSuggestion]);

  // ─── Ghost text (tab-to-continue) ────────────────────────────────
  const handleParagraphChange = useCallback((id, text) => {
    updateParagraph(id, text);
    // Trigger ghost text fetch when user pauses
    if (text.length > 20) {
      fetchGhostText(id);
    }
  }, [updateParagraph, fetchGhostText]);

  const handleAcceptGhost = useCallback(() => {
    if (!ghostText || !ghostParagraphId) return null;
    const para = paragraphs.find(p => p.id === ghostParagraphId);
    let newId = null;
    if (para) {
      // Add ghost as new paragraph after the current one
      newId = addParagraph(ghostParagraphId, ghostText.trim(), "claude");
    }
    clearGhostText();
    return newId;
  }, [ghostText, ghostParagraphId, paragraphs, addParagraph, clearGhostText]);

  // ─── Brainstorm ──────────────────────────────────────────────────
  const handleBrainstorm = useCallback((prompt) => {
    setBrainstormIdeas([]);
    dispatchAction("brainstorm", { prompt });
  }, [dispatchAction, setBrainstormIdeas]);

  const handleInsertIdea = useCallback((idea) => {
    const lastPara = paragraphs[paragraphs.length - 1];
    addParagraph(lastPara?.id, idea, "collaborative");
  }, [paragraphs, addParagraph]);

  // ─── Render phases ────────────────────────────────────────────────
  if (phase === "welcome") {
    return <WelcomeScreen onStart={handleWelcomeStart} />;
  }

  if (phase === "context") {
    return (
      <ContextSetup
        description={startData?.description || ""}
        onComplete={handleContextComplete}
        onSkip={handleContextSkip}
      />
    );
  }

  // ─── Writing phase ────────────────────────────────────────────────
  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      background: C.bg,
    }}>
      <TopBar projectConfig={projectConfig} />

      <div style={{
        flex: 1,
        display: "flex",
        overflow: "hidden",
      }}>
        {/* Main canvas */}
        <WritingCanvas
          paragraphs={paragraphs}
          onParagraphChange={handleParagraphChange}
          onParagraphAdd={addParagraph}
          onParagraphDelete={deleteParagraph}
          onSplitParagraph={splitParagraph}
          onMergeParagraphs={mergeParagraphs}
          onReplaceParagraph={replaceParagraph}
          onToolAction={handleToolAction}
          ghostText={ghostText}
          ghostParagraphId={ghostParagraphId}
          onAcceptGhost={handleAcceptGhost}
          onClearGhost={clearGhostText}
          authorStats={authorStats}
          wordCount={wordCount}
          autoFocus
        />

        {/* Suggestion sidebar */}
        <SuggestionPanel
          suggestions={suggestions}
          isStreaming={isStreaming}
          streamingText={streamingText}
          onAcceptSuggestion={handleAcceptSuggestion}
          onRejectSuggestion={(id) => rejectSuggestion(id)}
          onEditSuggestion={handleEditSuggestion}
          brainstormIdeas={brainstormIdeas}
          onBrainstorm={handleBrainstorm}
          onInsertIdea={handleInsertIdea}
          voiceProfile={voiceProfile}
          isAnalyzingVoice={isAnalyzingVoice}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(prev => !prev)}
          ghostLength={ghostLength}
          onGhostLengthChange={setGhostLength}
        />
      </div>

      {/* Chat drawer */}
      <ChatDrawer
        messages={chatMessages}
        isStreaming={isStreaming}
        onSendMessage={sendChatMessage}
        isOpen={chatOpen}
        onToggle={() => setChatOpen(prev => !prev)}
      />
    </div>
  );
}
