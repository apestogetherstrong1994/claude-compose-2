"use client";

import { useState, useRef, useCallback } from "react";
import { C } from "@/lib/design-system";
import { ClaudeLogo } from "@/components/icons/ClaudeLogo";
import { ArrowRight, FileText, Sparkles, Compass, Upload, Loader2, File } from "lucide-react";

const CARDS = [
  {
    id: "paste",
    icon: FileText,
    title: "Paste existing writing",
    desc: "Bring a draft and build on it together",
  },
  {
    id: "scratch",
    icon: Sparkles,
    title: "Start from a spark",
    desc: "Describe your idea and co-create from scratch",
  },
  {
    id: "explore",
    icon: Compass,
    title: "Just explore",
    desc: "Jump into a blank canvas and see where it goes",
  },
];

export function WelcomeScreen({ onStart }) {
  const [input, setInput] = useState("");
  const [pasteMode, setPasteMode] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [sparkActive, setSparkActive] = useState(false);
  const textareaRef = useRef(null);
  const mainInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleCardClick = (cardId) => {
    if (cardId === "paste") {
      setPasteMode(true);
      setSparkActive(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    } else if (cardId === "explore") {
      onStart({ mode: "explore", description: "", text: "" });
    } else if (cardId === "scratch") {
      setSparkActive(true);
      setPasteMode(false);
      setTimeout(() => mainInputRef.current?.focus(), 50);
    }
  };

  const handleSubmit = () => {
    if (pasteMode && pastedText.trim()) {
      onStart({ mode: "paste", description: input, text: pastedText });
    } else if (input.trim()) {
      onStart({ mode: "scratch", description: input, text: "" });
    }
  };

  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const name = file.name.toLowerCase();
    if (!name.endsWith(".pdf") && !name.endsWith(".docx") && !name.endsWith(".txt") && !name.endsWith(".md")) {
      setUploadError("Please upload a .pdf, .docx, or .txt file");
      return;
    }

    setIsUploading(true);
    setUploadError("");
    setUploadedFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse-file", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to parse file");
      }

      setPastedText(data.text);
    } catch (err) {
      setUploadError(err.message);
      setUploadedFileName("");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, []);

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
    }}>
      <div style={{
        maxWidth: 640,
        width: "100%",
        animation: "fadeIn 0.4s ease",
      }}>
        {/* Logo & headline */}
        <ClaudeLogo size={48} />
        <h1 style={{
          fontFamily: C.serif,
          fontWeight: 300,
          fontSize: 42,
          color: C.text,
          margin: "20px 0 8px 0",
          fontStyle: "italic",
          lineHeight: 1.2,
        }}>
          Write together, not alone
        </h1>
        <p style={{
          fontFamily: C.sans,
          fontSize: 15,
          color: C.textMuted,
          margin: "0 0 36px 0",
          lineHeight: 1.6,
        }}>
          A co-authoring partner that matches your voice and respects your intent.
        </p>

        {/* Quick start cards */}
        {!pasteMode && (
          <div style={{
            display: "flex",
            gap: 12,
            marginBottom: 28,
          }}>
            {CARDS.map(card => {
              const Icon = card.icon;
              const isHighlighted = card.id === "scratch" && sparkActive;
              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  style={{
                    flex: 1,
                    padding: "16px 14px",
                    background: C.bgComposer,
                    border: `1px solid ${isHighlighted ? C.accent : C.border}`,
                    borderRadius: C.radius,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: C.transition,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    boxShadow: isHighlighted ? C.shadow : "none",
                    transform: isHighlighted ? "translateY(-2px)" : "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = C.accent;
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = C.shadow;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = isHighlighted ? C.accent : C.border;
                    e.currentTarget.style.transform = isHighlighted ? "translateY(-2px)" : "translateY(0)";
                    e.currentTarget.style.boxShadow = isHighlighted ? C.shadow : "none";
                  }}
                >
                  <Icon size={18} style={{ color: C.accent }} />
                  <span style={{
                    fontFamily: C.sans,
                    fontSize: 13,
                    fontWeight: 600,
                    color: C.text,
                  }}>
                    {card.title}
                  </span>
                  <span style={{
                    fontFamily: C.sans,
                    fontSize: 12,
                    color: C.textMuted,
                    lineHeight: 1.4,
                  }}>
                    {card.desc}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Paste area (when paste mode is active) */}
        {pasteMode && (
          <div style={{
            marginBottom: 16,
            animation: "slideUp 0.2s ease",
          }}>
            {/* File upload button */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 10,
            }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.md"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  background: C.bgHover,
                  border: `1px solid ${C.border}`,
                  borderRadius: C.radiusSm,
                  color: C.textSec,
                  cursor: isUploading ? "wait" : "pointer",
                  fontFamily: C.sans,
                  fontSize: 13,
                  fontWeight: 500,
                  transition: C.transitionFast,
                }}
                onMouseEnter={(e) => {
                  if (!isUploading) {
                    e.currentTarget.style.borderColor = C.accent;
                    e.currentTarget.style.color = C.accent;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.color = C.textSec;
                }}
              >
                {isUploading ? (
                  <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <Upload size={14} />
                )}
                {isUploading ? "Extracting text..." : "Upload PDF or DOCX"}
              </button>

              {uploadedFileName && !isUploading && (
                <span style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  fontFamily: C.sans,
                  color: C.green || "#8BC34A",
                }}>
                  <File size={12} />
                  {uploadedFileName}
                </span>
              )}
            </div>

            {uploadError && (
              <div style={{
                padding: "6px 10px",
                marginBottom: 8,
                borderRadius: C.radiusSm,
                background: `${C.red || "#ef4444"}15`,
                color: C.red || "#ef4444",
                fontSize: 12,
                fontFamily: C.sans,
              }}>
                {uploadError}
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste your existing writing here, or upload a file above..."
              style={{
                width: "100%",
                minHeight: 160,
                padding: 16,
                background: C.bgComposer,
                border: `1px solid ${C.border}`,
                borderRadius: C.radius,
                color: C.text,
                fontFamily: C.serif,
                fontSize: 15,
                lineHeight: 1.7,
                resize: "vertical",
                outline: "none",
              }}
              onFocus={(e) => e.target.style.borderColor = C.accent}
              onBlur={(e) => e.target.style.borderColor = C.border}
            />
            <button
              onClick={() => { setPasteMode(false); setUploadedFileName(""); setUploadError(""); }}
              style={{
                marginTop: 8,
                padding: "4px 12px",
                background: "transparent",
                border: "none",
                color: C.textMuted,
                cursor: "pointer",
                fontFamily: C.sans,
                fontSize: 12,
              }}
            >
              ← Back to options
            </button>
          </div>
        )}

        {/* Main input */}
        <div style={{
          position: "relative",
          background: C.bgComposer,
          border: `1px solid ${sparkActive && !pasteMode ? C.accent : C.border}`,
          borderRadius: C.radius,
          padding: "14px 48px 14px 18px",
          transition: C.transition,
        }}>
          <textarea
            ref={mainInputRef}
            data-welcome-input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            onFocus={() => { if (!pasteMode) setSparkActive(true); }}
            placeholder={pasteMode
              ? "What would you like to improve about this writing?"
              : "What are you writing? (e.g., A cover letter for..., An essay about..., A short story that...)"
            }
            rows={2}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              color: C.text,
              fontFamily: C.sans,
              fontSize: 15,
              lineHeight: 1.5,
              resize: "none",
              outline: "none",
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() && !pastedText.trim() && !pasteMode}
            style={{
              position: "absolute",
              right: 12,
              bottom: 12,
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: (input.trim() || pastedText.trim()) ? C.accent : C.bgHover,
              border: "none",
              cursor: (input.trim() || pastedText.trim()) ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: C.transitionFast,
            }}
          >
            <ArrowRight size={16} style={{ color: (input.trim() || pastedText.trim()) ? "#fff" : C.textMuted }} />
          </button>
        </div>

        {/* Disclaimer */}
        <p style={{
          textAlign: "center",
          fontFamily: C.sans,
          fontSize: 11,
          color: C.textMuted,
          marginTop: 16,
          opacity: 0.6,
        }}>
          Claude is AI and can make mistakes. Please double-check responses.
        </p>
      </div>
    </div>
  );
}
