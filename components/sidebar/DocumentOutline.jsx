"use client";

import { useState } from "react";
import { C } from "@/lib/design-system";
import {
  List, Users, MapPin, Palette, ChevronDown, ChevronRight, Loader2,
  Briefcase, Star, Scale, BookOpen, Target, ListChecks,
} from "lucide-react";

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

function StringTag({ text }) {
  return (
    <div style={{
      display: "inline-flex",
      padding: "2px 8px",
      marginRight: 4,
      marginBottom: 4,
      background: C.bgHover,
      borderRadius: 10,
      fontSize: 11,
      fontFamily: C.sans,
      color: C.text,
      fontWeight: 500,
    }}>
      {text}
    </div>
  );
}

function TagList({ children }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", padding: "2px 0 4px 0" }}>
      {children}
    </div>
  );
}

// Element section configs — maps element keys to display properties
const ELEMENT_SECTIONS = [
  // Fiction / Poetry
  { key: "characters", title: "Characters", icon: Users, type: "nameDesc" },
  { key: "settings", title: "Settings", icon: MapPin, type: "nameDesc" },
  // Essay / Non-fiction / Blog
  { key: "arguments", title: "Arguments", icon: Scale, type: "nameDesc" },
  { key: "evidence", title: "Evidence", icon: BookOpen, type: "nameDesc" },
  // Cover Letter
  { key: "experience", title: "Experience", icon: Briefcase, type: "nameDesc" },
  { key: "skills", title: "Skills", icon: Star, type: "string" },
  // Email
  { key: "keyPoints", title: "Key Points", icon: Target, type: "nameDesc" },
  { key: "actionItems", title: "Action Items", icon: ListChecks, type: "string" },
  // Universal
  { key: "themes", title: "Themes", icon: Palette, type: "string" },
];

export function DocumentOutline({ outline, storyElements, isAnalyzing }) {
  const hasOutline = outline && outline.length > 0;
  const hasElements = storyElements && Object.values(storyElements).some(
    v => Array.isArray(v) && v.length > 0
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

      {/* Dynamic element sections */}
      {hasElements && (
        <>
          {ELEMENT_SECTIONS.map(section => {
            const items = storyElements[section.key];
            if (!items || items.length === 0) return null;

            return (
              <CollapsibleSection
                key={section.key}
                title={section.title}
                icon={section.icon}
                count={items.length}
                defaultOpen={true}
              >
                <TagList>
                  {section.type === "nameDesc"
                    ? items.map((item, i) => (
                        <ElementTag key={i} name={item.name} description={item.description} />
                      ))
                    : items.map((item, i) => (
                        <StringTag key={i} text={item} />
                      ))
                  }
                </TagList>
              </CollapsibleSection>
            );
          })}
        </>
      )}
    </div>
  );
}
