"use client";

import { C } from "@/lib/design-system";
import { ClaudeLogo } from "@/components/icons/ClaudeLogo";

export function TopBar({ projectConfig, onGoHome }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "8px 20px",
      borderBottom: `1px solid ${C.border}`,
      background: C.bg,
      flexShrink: 0,
      height: 48,
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <button
          onClick={onGoHome}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            transition: C.transitionFast,
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.7"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
          title="Back to home"
        >
          <ClaudeLogo size={22} />
          <span style={{
            fontFamily: C.sans,
            fontSize: 14,
            fontWeight: 600,
            color: C.text,
          }}>
            ClaudeCompose
          </span>
        </button>
        {projectConfig?.title && (
          <>
            <span style={{ color: C.textMuted, fontSize: 14 }}>/</span>
            <span style={{
              fontFamily: C.sans,
              fontSize: 14,
              color: C.textSec,
            }}>
              {projectConfig.title}
            </span>
          </>
        )}
        {projectConfig?.writingType && (
          <span style={{
            padding: "2px 8px",
            background: C.accentSoft,
            borderRadius: C.radiusPill,
            fontSize: 11,
            fontFamily: C.sans,
            color: C.accent,
            fontWeight: 500,
          }}>
            {projectConfig.writingType}
          </span>
        )}
      </div>

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 11,
        fontFamily: C.sans,
        color: C.textMuted,
      }}>
        <KbdHint keys={["Select text"]} action="AI tools" />
        <KbdHint keys={["Tab"]} action="accept suggestion" />
      </div>
    </div>
  );
}

function KbdHint({ keys, action }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {keys.map(k => (
        <kbd key={k} style={{
          padding: "1px 5px",
          background: C.bgHover,
          border: `1px solid ${C.border}`,
          borderRadius: 3,
          fontSize: 10,
          fontFamily: C.mono,
          color: C.textMuted,
        }}>
          {k}
        </kbd>
      ))}
      <span>{action}</span>
    </span>
  );
}
