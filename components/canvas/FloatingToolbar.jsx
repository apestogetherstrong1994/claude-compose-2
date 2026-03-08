"use client";

import { useState } from "react";
import { C } from "@/lib/design-system";
import { RefreshCw, Maximize2, Minimize2, Palette, Eye, Lightbulb } from "lucide-react";

const TOOLS = [
  { id: "rewrite", label: "Rewrite", icon: RefreshCw },
  { id: "expand", label: "Expand", icon: Maximize2 },
  { id: "shorten", label: "Shorten", icon: Minimize2 },
  { id: "tone", label: "Tone", icon: Palette },
  { id: "describe", label: "Describe", icon: Eye },
];

const TONES = [
  "Formal", "Casual", "Confident", "Gentle", "Persuasive", "Poetic", "Direct",
];

export function FloatingToolbar({ position, visible, onAction }) {
  const [showTones, setShowTones] = useState(false);

  if (!visible || !position) return null;

  const toolbarWidth = showTones ? 380 : 320;
  const top = Math.max(8, position.top - 52);
  const left = Math.max(8, Math.min(position.left - toolbarWidth / 2, window.innerWidth - toolbarWidth - 8));

  const handleAction = (toolId) => {
    if (toolId === "tone") {
      setShowTones(!showTones);
      return;
    }
    setShowTones(false);
    onAction(toolId);
  };

  const handleTone = (tone) => {
    setShowTones(false);
    onAction("tone", { tone: tone.toLowerCase() });
  };

  return (
    <div
      style={{
        position: "fixed",
        top,
        left,
        zIndex: 1000,
        animation: "toolbarIn 0.15s ease",
      }}
      onMouseDown={(e) => e.preventDefault()} // Prevent selection loss
    >
      {/* Main toolbar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        background: C.bgDeep,
        border: `1px solid ${C.borderHover}`,
        borderRadius: C.radiusSm,
        padding: "4px 4px",
        boxShadow: C.shadowModal,
      }}>
        {TOOLS.map(tool => {
          const Icon = tool.icon;
          const isActive = tool.id === "tone" && showTones;
          return (
            <button
              key={tool.id}
              onClick={() => handleAction(tool.id)}
              title={tool.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 10px",
                background: isActive ? C.accentSoft : "transparent",
                border: "none",
                borderRadius: 6,
                color: isActive ? C.accent : C.textSec,
                cursor: "pointer",
                fontFamily: C.sans,
                fontSize: 12,
                fontWeight: 500,
                transition: C.transitionFast,
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = C.bgHover;
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
              }}
            >
              <Icon size={14} />
              {tool.label}
            </button>
          );
        })}
      </div>

      {/* Tone sub-menu */}
      {showTones && (
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          marginTop: 4,
          background: C.bgDeep,
          border: `1px solid ${C.borderHover}`,
          borderRadius: C.radiusSm,
          padding: 6,
          boxShadow: C.shadowModal,
          animation: "toolbarIn 0.1s ease",
        }}>
          {TONES.map(tone => (
            <button
              key={tone}
              onClick={() => handleTone(tone)}
              style={{
                padding: "4px 10px",
                background: C.bgHover,
                border: "none",
                borderRadius: C.radiusPill,
                color: C.textSec,
                cursor: "pointer",
                fontFamily: C.sans,
                fontSize: 11,
                fontWeight: 500,
                transition: C.transitionFast,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = C.accentSoft;
                e.currentTarget.style.color = C.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = C.bgHover;
                e.currentTarget.style.color = C.textSec;
              }}
            >
              {tone}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
