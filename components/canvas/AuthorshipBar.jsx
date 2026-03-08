"use client";

import { C } from "@/lib/design-system";

export function AuthorshipBar({ authorStats, wordCount }) {
  const total = authorStats.human + authorStats.claude + authorStats.collaborative;
  if (total === 0) return null;

  const segments = [
    { key: "human", color: C.text, label: "You", count: authorStats.human },
    { key: "collaborative", color: C.blue, label: "Collaborative", count: authorStats.collaborative },
    { key: "claude", color: C.purple, label: "Claude", count: authorStats.claude },
  ].filter(s => s.count > 0);

  return (
    <div style={{
      padding: "8px 48px",
      borderTop: `1px solid ${C.border}`,
      display: "flex",
      alignItems: "center",
      gap: 16,
      flexShrink: 0,
    }}>
      {/* Bar */}
      <div style={{
        flex: 1,
        height: 4,
        borderRadius: 2,
        background: C.bgHover,
        display: "flex",
        overflow: "hidden",
        maxWidth: 200,
      }}>
        {segments.map(seg => (
          <div key={seg.key} style={{
            width: `${(seg.count / total) * 100}%`,
            background: seg.color,
            opacity: 0.6,
            transition: "width 0.3s ease",
          }} />
        ))}
      </div>

      {/* Labels */}
      <div style={{
        display: "flex",
        gap: 12,
        fontSize: 11,
        fontFamily: C.sans,
        color: C.textMuted,
      }}>
        {segments.map(seg => (
          <span key={seg.key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: seg.color, opacity: 0.6,
            }} />
            {seg.label} {Math.round((seg.count / total) * 100)}%
          </span>
        ))}
        <span style={{ marginLeft: 4 }}>
          {wordCount} words
        </span>
      </div>
    </div>
  );
}
