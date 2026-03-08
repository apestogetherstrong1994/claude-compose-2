"use client";

import { useState } from "react";
import { C } from "@/lib/design-system";
import { Check, X, Pencil } from "lucide-react";

const typeBadgeColor = {
  rewrite: C.accent,
  expand: C.blue,
  shorten: C.green,
  tone: C.purple,
  describe: C.yellow,
  revision: C.accent,
};

export function SuggestionCard({ suggestion, onAccept, onReject, onEdit, isStreaming }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(suggestion.text || "");

  const badgeColor = typeBadgeColor[suggestion.type] || C.accent;

  const handleEdit = () => {
    setIsEditing(true);
    setEditedText(suggestion.text || "");
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    onEdit?.(editedText);
  };

  return (
    <div style={{
      background: C.bgComposer,
      border: `1px solid ${C.border}`,
      borderRadius: C.radius,
      padding: 16,
      animation: "slideUp 0.2s ease",
      transition: C.transition,
    }}>
      {/* Header: type badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{
          padding: "2px 8px",
          borderRadius: C.radiusPill,
          background: `${badgeColor}20`,
          color: badgeColor,
          fontSize: 10,
          fontWeight: 600,
          fontFamily: C.sans,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}>
          {suggestion.type}
        </span>
      </div>

      {/* Reasoning */}
      {suggestion.reasoning && (
        <p style={{
          margin: "0 0 10px 0",
          fontSize: 13,
          fontFamily: C.sans,
          color: C.textMuted,
          fontStyle: "italic",
          lineHeight: 1.5,
        }}>
          {suggestion.reasoning}
        </p>
      )}

      {/* Original text (for rewrites) */}
      {suggestion.originalText && suggestion.type === "rewrite" && (
        <div style={{
          padding: "8px 10px",
          marginBottom: 8,
          background: C.bgHover,
          borderRadius: C.radiusSm,
          fontSize: 13,
          fontFamily: C.serif,
          color: C.textMuted,
          lineHeight: 1.6,
          textDecoration: "line-through",
          opacity: 0.6,
        }}>
          {suggestion.originalText}
        </div>
      )}

      {/* Suggested text */}
      {isEditing ? (
        <textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          style={{
            width: "100%",
            minHeight: 80,
            padding: 10,
            background: C.bgDeep,
            border: `1px solid ${C.borderHover}`,
            borderRadius: C.radiusSm,
            color: C.text,
            fontFamily: C.serif,
            fontSize: 14,
            lineHeight: 1.7,
            resize: "vertical",
            outline: "none",
          }}
          autoFocus
        />
      ) : (
        <div style={{
          padding: "8px 10px",
          background: `${badgeColor}08`,
          borderRadius: C.radiusSm,
          borderLeft: `2px solid ${badgeColor}40`,
          fontSize: 14,
          fontFamily: C.serif,
          color: C.text,
          lineHeight: 1.7,
          whiteSpace: "pre-wrap",
        }}>
          {suggestion.text}
          {isStreaming && (
            <span style={{
              display: "inline-block",
              width: 2,
              height: 16,
              background: C.accent,
              marginLeft: 2,
              animation: "pulse 1s ease-in-out infinite",
              verticalAlign: "text-bottom",
            }} />
          )}
        </div>
      )}

      {/* Action buttons */}
      {!isStreaming && (
        <div style={{
          display: "flex",
          gap: 6,
          marginTop: 10,
        }}>
          {isEditing ? (
            <>
              <ActionBtn icon={Check} label="Save" color={C.green} onClick={handleSaveEdit} />
              <ActionBtn icon={X} label="Cancel" color={C.textMuted} onClick={() => setIsEditing(false)} />
            </>
          ) : (
            <>
              <ActionBtn icon={Check} label="Accept" color={C.green} onClick={onAccept} />
              <ActionBtn icon={X} label="Reject" color={C.red} onClick={onReject} />
              <ActionBtn icon={Pencil} label="Edit" color={C.textSec} onClick={handleEdit} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ActionBtn({ icon: Icon, label, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "5px 10px",
        background: "transparent",
        border: `1px solid ${C.border}`,
        borderRadius: 6,
        color,
        cursor: "pointer",
        fontFamily: C.sans,
        fontSize: 11,
        fontWeight: 500,
        transition: C.transitionFast,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = C.bgHover;
        e.currentTarget.style.borderColor = C.borderHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.borderColor = C.border;
      }}
    >
      <Icon size={12} />
      {label}
    </button>
  );
}
