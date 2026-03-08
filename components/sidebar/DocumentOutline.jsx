"use client";

import { useState } from "react";
import { C } from "@/lib/design-system";
import { List, Users, MapPin, Palette, ChevronDown, ChevronRight, Loader2 } from "lucide-react";

const TYPE_COLORS = {
  intro: "#6B9BD2",
  argument: "#D4A574",
  evidence: "#8BC34A",
  transition: "#9E9E9E",
  climax: "#E57373",
  dialogue: "#BA68C8",
  description: "#4DB6AC",
  conclusion: "#FFB74D",
  other: "#90A4AE",
};

function OutlineItem({ item }) {
  return (
    <div style={{
      display: "flex",
      gap: 8,
      alignItems: "flex-start",
      padding: "4px 0",
    }}>
      <div style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: TYPE_COLORS[item.type] || TYPE_COLORS.other,
        marginTop: 5,
        flexShrink: 0,
      }} />
      <div style={{
        fontSize: 12,
        fontFamily: C.sans,
        color: C.textSec,
        lineHeight: 1.4,
      }}>
        <span style={{ color: C.textMuted, fontSize: 10, marginRight: 4 }}>
          ¶{item.index}
        </span>
        {item.summary}
      </div>
    </div>
  );
}

function CollapsibleSection({ title, icon: Icon, children, defaultOpen = true, count }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{ marginBottom: 2 }}>
      <button
        onClick={() => setOpen(prev => !prev)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          width: "100%",
          padding: "5px 0",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: C.sans,
          fontSize: 11,
          fontWeight: 600,
          color: C.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        <Icon size={11} />
        {title}
        {count > 0 && (
          <span style={{
            fontSize: 10,
            fontWeight: 400,
            color: C.textMuted,
            opacity: 0.7,
          }}>
            ({count})
          </span>
        )}
      </button>
      {open && (
        <div style={{ paddingLeft: 4 }}>
          {children}
        </div>
      )}
    </div>
  );
}

function ElementTag({ name, description }) {
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "2px 8px",
      marginRight: 4,
      marginBottom: 4,
      background: C.bgHover,
      borderRadius: 10,
      fontSize: 11,
      fontFamily: C.sans,
    }}>
      <span style={{ color: C.text, fontWeight: 500 }}>{name}</span>
      {description && (
        <span style={{ color: C.textMuted, fontSize: 10 }}>
          · {description}
        </span>
      )}
    </div>
  );
}

export function DocumentOutline({ outline, storyElements, isAnalyzing }) {
  const hasOutline = outline && outline.length > 0;
  const hasElements = storyElements && (
    storyElements.characters?.length > 0 ||
    storyElements.settings?.length > 0 ||
    storyElements.themes?.length > 0
  );

  if (!hasOutline && !hasElements && !isAnalyzing) return null;

  return (
    <div style={{
      padding: "8px 0",
      borderBottom: `1px solid ${C.border}`,
    }}>
      {/* Outline */}
      {(hasOutline || isAnalyzing) && (
        <CollapsibleSection
          title="Outline"
          icon={List}
          count={outline?.length || 0}
          defaultOpen={true}
        >
          {isAnalyzing && !hasOutline && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 0",
              fontSize: 11,
              fontFamily: C.sans,
              color: C.textMuted,
            }}>
              <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} />
              Analyzing structure...
            </div>
          )}
          {outline?.map((item, i) => (
            <OutlineItem key={i} item={item} />
          ))}
        </CollapsibleSection>
      )}

      {/* Story Elements */}
      {hasElements && (
        <>
          {storyElements.characters?.length > 0 && (
            <CollapsibleSection
              title="Characters"
              icon={Users}
              count={storyElements.characters.length}
              defaultOpen={true}
            >
              <div style={{ display: "flex", flexWrap: "wrap", padding: "2px 0 4px 0" }}>
                {storyElements.characters.map((c, i) => (
                  <ElementTag key={i} name={c.name} description={c.description} />
                ))}
              </div>
            </CollapsibleSection>
          )}

          {storyElements.settings?.length > 0 && (
            <CollapsibleSection
              title="Settings"
              icon={MapPin}
              count={storyElements.settings.length}
              defaultOpen={true}
            >
              <div style={{ display: "flex", flexWrap: "wrap", padding: "2px 0 4px 0" }}>
                {storyElements.settings.map((s, i) => (
                  <ElementTag key={i} name={s.name} description={s.description} />
                ))}
              </div>
            </CollapsibleSection>
          )}

          {storyElements.themes?.length > 0 && (
            <CollapsibleSection
              title="Themes"
              icon={Palette}
              count={storyElements.themes.length}
              defaultOpen={true}
            >
              <div style={{ display: "flex", flexWrap: "wrap", padding: "2px 0 4px 0" }}>
                {storyElements.themes.map((t, i) => (
                  <ElementTag key={i} name={t} />
                ))}
              </div>
            </CollapsibleSection>
          )}
        </>
      )}
    </div>
  );
}
