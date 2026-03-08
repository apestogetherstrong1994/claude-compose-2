"use client";

import { C } from "@/lib/design-system";
import { Fingerprint } from "lucide-react";
import { StreamingDots } from "@/components/chat/StreamingDots";

const FIELDS = [
  { key: "tone", label: "Tone" },
  { key: "sentences", label: "Sentences" },
  { key: "vocabulary", label: "Vocabulary" },
  { key: "structure", label: "Structure" },
  { key: "signature", label: "Signature" },
];

export function VoicePanel({ voiceProfile, isAnalyzing }) {
  if (isAnalyzing) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        padding: 20,
        color: C.textMuted,
        fontSize: 13,
        fontFamily: C.sans,
      }}>
        <Fingerprint size={20} style={{ color: C.accent }} />
        Analyzing your voice...
        <StreamingDots />
      </div>
    );
  }

  if (!voiceProfile) {
    return (
      <div style={{
        padding: 20,
        textAlign: "center",
        color: C.textMuted,
        fontSize: 13,
        fontFamily: C.sans,
        lineHeight: 1.6,
      }}>
        <Fingerprint size={20} style={{ color: C.textMuted, margin: "0 auto 8px", display: "block", opacity: 0.4 }} />
        Write 2+ paragraphs and Claude will analyze your voice
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 10,
      padding: "4px 0",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginBottom: 4,
        fontSize: 12,
        fontFamily: C.sans,
        color: C.accent,
        fontWeight: 500,
      }}>
        <Fingerprint size={14} />
        Your Voice Profile
      </div>

      {FIELDS.map(({ key, label }) => {
        const value = voiceProfile[key];
        if (!value) return null;
        return (
          <div key={key} style={{ animation: "fadeIn 0.2s ease" }}>
            <div style={{
              fontSize: 10,
              fontFamily: C.sans,
              color: C.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 2,
            }}>
              {label}
            </div>
            <div style={{
              fontSize: 13,
              fontFamily: C.serif,
              color: C.textSec,
              lineHeight: 1.5,
            }}>
              {value}
            </div>
          </div>
        );
      })}
    </div>
  );
}
