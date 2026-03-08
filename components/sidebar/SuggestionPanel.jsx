"use client";

import { useState } from "react";
import { C } from "@/lib/design-system";
import { Sparkles, Lightbulb, Fingerprint, ChevronLeft, ChevronRight } from "lucide-react";
import { SuggestionCard } from "./SuggestionCard";
import { BrainstormPanel } from "./BrainstormPanel";
import { VoicePanel } from "./VoicePanel";
import { parseStreamingSuggestion } from "@/lib/parsers";

const TABS = [
  { id: "suggestions", label: "Suggestions", icon: Sparkles },
  { id: "brainstorm", label: "Brainstorm", icon: Lightbulb },
  { id: "voice", label: "Voice", icon: Fingerprint },
];

export function SuggestionPanel({
  suggestions,
  isStreaming,
  streamingText,
  onAcceptSuggestion,
  onRejectSuggestion,
  onEditSuggestion,
  brainstormIdeas,
  onBrainstorm,
  onInsertIdea,
  voiceProfile,
  isAnalyzingVoice,
  isOpen,
  onToggle,
}) {
  const [activeTab, setActiveTab] = useState("suggestions");

  return (
    <div style={{
      width: isOpen ? 340 : 44,
      flexShrink: 0,
      borderLeft: `1px solid ${C.border}`,
      background: C.bg,
      display: "flex",
      transition: "width 0.2s ease",
      height: "100%",
      overflow: "hidden",
    }}>
      {/* Collapse/expand toggle */}
      <button
        onClick={onToggle}
        style={{
          width: 44,
          flexShrink: 0,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          paddingTop: 16,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: C.textMuted,
          transition: C.transitionFast,
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = C.text}
        onMouseLeave={(e) => e.currentTarget.style.color = C.textMuted}
      >
        {isOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Panel content */}
      {isOpen && (
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          paddingRight: 16,
        }}>
          {/* Tabs */}
          <div style={{
            display: "flex",
            gap: 2,
            padding: "12px 0 8px 0",
            borderBottom: `1px solid ${C.border}`,
            flexShrink: 0,
          }}>
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const count = tab.id === "suggestions" ? suggestions.length : 0;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "6px 10px",
                    background: isActive ? C.accentSoft : "transparent",
                    border: "none",
                    borderRadius: 6,
                    color: isActive ? C.accent : C.textMuted,
                    cursor: "pointer",
                    fontFamily: C.sans,
                    fontSize: 12,
                    fontWeight: 500,
                    transition: C.transitionFast,
                  }}
                >
                  <Icon size={13} />
                  {tab.label}
                  {count > 0 && (
                    <span style={{
                      width: 16, height: 16,
                      borderRadius: "50%",
                      background: C.accent,
                      color: "#fff",
                      fontSize: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "12px 0",
          }}>
            {activeTab === "suggestions" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {suggestions.length === 0 && !isStreaming && (
                  <div style={{
                    padding: 20,
                    textAlign: "center",
                    color: C.textMuted,
                    fontSize: 13,
                    fontFamily: C.sans,
                    lineHeight: 1.6,
                  }}>
                    <Sparkles size={20} style={{ opacity: 0.4, margin: "0 auto 8px", display: "block" }} />
                    Select text in your document and use the toolbar to get AI suggestions
                  </div>
                )}
                {/* Show streaming preview while generating */}
                {isStreaming && streamingText && (() => {
                  const partial = parseStreamingSuggestion(streamingText);
                  return partial ? (
                    <SuggestionCard
                      key="streaming"
                      suggestion={partial}
                      isStreaming={true}
                    />
                  ) : (
                    <div style={{
                      padding: 16,
                      textAlign: "center",
                      color: C.textMuted,
                      fontSize: 13,
                      fontFamily: C.sans,
                    }}>
                      <div style={{
                        width: 20, height: 20,
                        border: `2px solid ${C.accent}`,
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                        margin: "0 auto 8px",
                      }} />
                      Composing...
                    </div>
                  );
                })()}
                {suggestions.map(s => (
                  <SuggestionCard
                    key={s.id}
                    suggestion={s}
                    onAccept={() => onAcceptSuggestion(s)}
                    onReject={() => onRejectSuggestion(s.id)}
                    onEdit={(text) => onEditSuggestion(s, text)}
                    isStreaming={false}
                  />
                ))}
              </div>
            )}

            {activeTab === "brainstorm" && (
              <BrainstormPanel
                ideas={brainstormIdeas}
                isStreaming={isStreaming}
                onBrainstorm={onBrainstorm}
                onInsertIdea={onInsertIdea}
              />
            )}

            {activeTab === "voice" && (
              <VoicePanel
                voiceProfile={voiceProfile}
                isAnalyzing={isAnalyzingVoice}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
