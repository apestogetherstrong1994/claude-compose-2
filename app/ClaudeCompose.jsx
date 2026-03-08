"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { C } from "@/lib/design-system";
import { useDocument } from "@/lib/use-document";
import { useAIAction } from "@/lib/use-ai-action";
import { useDocumentAnalysis } from "@/lib/use-document-analysis";
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
  const openingTriggeredRef = useRef(false);

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
    addSuggestion,
    fetchGhostText,
    fetchOpeningSuggestion,
    clearGhostText,
    acceptSuggestion,
    rejectSuggestion,
    sendChatMessage,
    setBrainstormIdeas,
  } = useAIAction({ paragraphs, voiceProfile: null, projectConfig, ghostLength });

  // ─── Document analysis (outline + story elements) ─────────────────
  const {
    outline,
    storyElements,
    isAnalyzing: isAnalyzingDocument,
  } = useDocumentAnalysis({
    paragraphs,
    writingType: projectConfig?.writingType,
  });

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

    const substantialParagraphs = paragraphs.filter(p => p.text.length > 30);
    if (substantialParagraphs.length >= 2) {
      voiceAnalyzedRef.current = true;
      setIsAnalyzingVoice(true);
      dispatchAction("analyze_voice").then(() => setIsAnalyzingVoice(false));
    }
  }, [paragraphs, phase, dispatchAction]);

  // ─── Opening paragraph for "Start from a Spark" ─────────────────
  useEffect(() => {
    if (phase !== "writing" || openingTriggeredRef.current) return;
    if (startData?.mode !== "scratch" || !startData?.description) return;

    // Wait a tick for the first paragraph to be rendered
    openingTriggeredRef.current = true;
    const timer = setTimeout(() => {
      const firstPara = paragraphs[0];
      if (firstPara && !firstPara.text) {
        fetchOpeningSuggestion(firstPara.id, startData.description);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [phase, startData, paragraphs, fetchOpeningSuggestion]);

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
      if (suggestion.originalText && para.text.includes(suggestion.originalText)) {
        // Selection-based: splice the suggestion into the paragraph, replacing only the selected portion
        const newText = para.text.replace(suggestion.originalText, suggestion.text);
        replaceParagraph(targetId, newText, "collaborative");
      } else {
        // Full-paragraph replacement (e.g., from chat suggestions)
        replaceParagraph(targetId, suggestion.text, "claude");
      }
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
      if (suggestion.originalText && para.text.includes(suggestion.originalText)) {
        // Selection-based: splice the edited text into the paragraph, replacing only the selected portion
        const newText = para.text.replace(suggestion.originalText, editedText);
        replaceParagraph(targetId, newText, "collaborative");
      } else {
        replaceParagraph(targetId, editedText, "collaborative");
      }
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
    let focusId = ghostParagraphId;

    if (para) {
      // Strip markdown headers and echoed text
      let cleanGhost = ghostText.replace(/^#[^\n]*\n+/, "");

      if (!para.text) {
        // Opening case: empty paragraph — replace it with the ghost text
        // Check if the opening itself contains paragraph breaks
        const parts = cleanGhost.trim().split(/\n\n+/);
        replaceParagraph(ghostParagraphId, parts[0].trim(), "claude");
        let lastId = ghostParagraphId;
        for (let i = 1; i < parts.length; i++) {
          lastId = addParagraph(lastId, parts[i].trim(), "claude");
        }
        focusId = lastId;
      } else {
        cleanGhost = cleanGhost.trim();

        // Strip any repeated paragraph text the model may have echoed back
        const trimmedPara = para.text.trimEnd();
        if (cleanGhost.startsWith(trimmedPara)) {
          cleanGhost = cleanGhost.slice(trimmedPara.length).trimStart();
        }

        // Determine if the current paragraph is "complete" and ghost should start a new paragraph
        const sentenceCount = (para.text.match(/[.!?]["']?\s/g) || []).length + (para.text.match(/[.!?]["']?$/) ? 1 : 0);
        const wordCount = para.text.split(/\s+/).filter(Boolean).length;
        const paragraphComplete = para.text.length > 0 && (sentenceCount >= 3 || wordCount >= 60);

        const parts = cleanGhost.split(/\n\n+/);

        if (paragraphComplete) {
          // Paragraph is complete — add ghost text as new paragraph(s)
          let lastId = ghostParagraphId;
          for (const part of parts) {
            if (part.trim()) {
              lastId = addParagraph(lastId, part.trim(), "claude");
            }
          }
          focusId = lastId;
        } else {
          // Paragraph is mid-thought — append first part inline
          const needsSpace = para.text.length > 0 && !para.text.endsWith(" ")
            && parts[0].length > 0 && !parts[0].startsWith(" ");
          const appendedText = para.text + (needsSpace ? " " : "") + parts[0];
          replaceParagraph(ghostParagraphId, appendedText, "collaborative");

          // Any remaining parts become new paragraphs
          let lastId = ghostParagraphId;
          for (let i = 1; i < parts.length; i++) {
            if (parts[i].trim()) {
              lastId = addParagraph(lastId, parts[i].trim(), "claude");
            }
          }
          focusId = lastId;
        }
      }
    }
    clearGhostText();

    // Trigger next ghost text after a short delay (enables tab-tab-tab composing)
    const targetId = focusId;
    setTimeout(() => {
      fetchGhostText(targetId);
    }, 100);

    return focusId;
  }, [ghostText, ghostParagraphId, paragraphs, addParagraph, replaceParagraph, clearGhostText, fetchGhostText]);

  // ─── Brainstorm ──────────────────────────────────────────────────
  const handleBrainstorm = useCallback((prompt) => {
    setBrainstormIdeas([]);
    dispatchAction("brainstorm", { prompt });
  }, [dispatchAction, setBrainstormIdeas]);

  const handleInsertIdea = useCallback((idea) => {
    addSuggestion({
      type: "brainstorm",
      text: idea,
      target: "_new",
      originalText: "",
      reasoning: "From brainstorm",
    });
  }, [addSuggestion]);

  // ─── Render phases ────────────────────────────────────────────────
  if (phase === "welcome") {
    return <WelcomeScreen onStart={handleWelcomeStart} />;
  }

  if (phase === "context") {
    return (
      <ContextSetup
        description={startData?.description || ""}
        text={startData?.text || ""}
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
          outline={outline}
          storyElements={storyElements}
          isAnalyzingDocument={isAnalyzingDocument}
          writingType={projectConfig?.writingType}
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
