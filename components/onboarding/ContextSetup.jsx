"use client";

import { useState, useEffect } from "react";
import { C } from "@/lib/design-system";
import { ClaudeLogo } from "@/components/icons/ClaudeLogo";
import { ArrowRight } from "lucide-react";

const WRITING_TYPES = [
  "Essay", "Fiction", "Cover Letter", "Blog Post", "Email", "Non-fiction", "Poetry", "Other",
];

function detectWritingType(description) {
  const lower = (description || "").toLowerCase();
  if (lower.includes("cover letter") || lower.includes("resume")) return "Cover Letter";
  if (lower.includes("essay")) return "Essay";
  if (lower.includes("story") || lower.includes("fiction") || lower.includes("novel") || lower.includes("chapter")) return "Fiction";
  if (lower.includes("blog") || lower.includes("post")) return "Blog Post";
  if (lower.includes("email")) return "Email";
  if (lower.includes("poem") || lower.includes("poetry")) return "Poetry";
  if (lower.includes("article") || lower.includes("report")) return "Non-fiction";
  return null;
}

export function ContextSetup({ description, onComplete, onSkip }) {
  const [title, setTitle] = useState("");
  const [writingType, setWritingType] = useState(null);
  const [audience, setAudience] = useState("");
  const [contextNotes, setContextNotes] = useState("");

  useEffect(() => {
    const detected = detectWritingType(description);
    if (detected) setWritingType(detected);
  }, [description]);

  const handleComplete = () => {
    onComplete({
      title,
      writingType: writingType || "Other",
      audience,
      contextNotes,
    });
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      backgroundImage: C.grid,
      backgroundSize: "60px 60px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
      animation: "fadeIn 0.3s ease",
    }}>
      <div style={{ maxWidth: 500, width: "100%" }}>
        <ClaudeLogo size={32} />
        <h2 style={{
          fontFamily: C.serif,
          fontWeight: 300,
          fontSize: 28,
          color: C.text,
          margin: "16px 0 4px 0",
          fontStyle: "italic",
        }}>
          Quick context
        </h2>
        <p style={{
          fontFamily: C.sans,
          fontSize: 14,
          color: C.textMuted,
          margin: "0 0 28px 0",
        }}>
          Help Claude understand your project. All fields are optional.
        </p>

        {/* Writing type pills */}
        <label style={{
          display: "block",
          fontSize: 12,
          fontFamily: C.sans,
          color: C.textMuted,
          marginBottom: 8,
          fontWeight: 500,
        }}>
          What kind of writing?
        </label>
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          marginBottom: 20,
        }}>
          {WRITING_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setWritingType(type)}
              style={{
                padding: "6px 14px",
                background: writingType === type ? C.accentSoft : C.bgComposer,
                border: `1px solid ${writingType === type ? C.accent : C.border}`,
                borderRadius: C.radiusPill,
                color: writingType === type ? C.accent : C.textSec,
                cursor: "pointer",
                fontFamily: C.sans,
                fontSize: 13,
                fontWeight: 500,
                transition: C.transitionFast,
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Title */}
        <InputField
          label="Title (optional)"
          value={title}
          onChange={setTitle}
          placeholder="e.g., Why I Want to Join Anthropic"
        />

        {/* Audience */}
        <InputField
          label="Who is this for? (optional)"
          value={audience}
          onChange={setAudience}
          placeholder="e.g., Hiring manager at Anthropic"
        />

        {/* Context */}
        <label style={{
          display: "block",
          fontSize: 12,
          fontFamily: C.sans,
          color: C.textMuted,
          marginBottom: 6,
          fontWeight: 500,
        }}>
          Anything else Claude should know? (optional)
        </label>
        <textarea
          value={contextNotes}
          onChange={(e) => setContextNotes(e.target.value)}
          placeholder="Key points, reference material, constraints..."
          rows={3}
          style={{
            width: "100%",
            padding: "10px 14px",
            background: C.bgComposer,
            border: `1px solid ${C.border}`,
            borderRadius: C.radiusSm,
            color: C.text,
            fontFamily: C.sans,
            fontSize: 14,
            lineHeight: 1.5,
            resize: "vertical",
            outline: "none",
            marginBottom: 24,
          }}
        />

        {/* Actions */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={handleComplete}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 20px",
              background: C.accent,
              border: "none",
              borderRadius: C.radiusSm,
              color: "#fff",
              cursor: "pointer",
              fontFamily: C.sans,
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Start writing <ArrowRight size={16} />
          </button>
          <button
            onClick={onSkip}
            style={{
              padding: "10px 20px",
              background: "transparent",
              border: `1px solid ${C.border}`,
              borderRadius: C.radiusSm,
              color: C.textMuted,
              cursor: "pointer",
              fontFamily: C.sans,
              fontSize: 14,
            }}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: "block",
        fontSize: 12,
        fontFamily: C.sans,
        color: C.textMuted,
        marginBottom: 6,
        fontWeight: 500,
      }}>
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "10px 14px",
          background: C.bgComposer,
          border: `1px solid ${C.border}`,
          borderRadius: C.radiusSm,
          color: C.text,
          fontFamily: C.sans,
          fontSize: 14,
          outline: "none",
        }}
      />
    </div>
  );
}
