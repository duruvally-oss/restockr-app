import React, { useState } from 'react';

interface QuickTagsBadgeListProps {
  tags?: string[];
  batteryHealth?: string;
  variant?: "dark" | "light" | "card";
  maxInitial?: number; // Optional limit with +X more chip toggle
  className?: string;
}

export const QuickTagsBadgeList: React.FC<QuickTagsBadgeListProps> = ({
  tags = [],
  batteryHealth,
  variant = "dark",
  maxInitial,
  className = ""
}) => {
  const [expanded, setExpanded] = useState(false);

  // Filter out Notes: prefix items
  const conditionTags = (tags || []).filter(t => !t.startsWith("Notes: "));
  const noteTag = (tags || []).find(t => t.startsWith("Notes: "))?.replace("Notes: ", "");

  if (conditionTags.length === 0 && !batteryHealth && !noteTag) {
    return null;
  }

  const shouldLimit = maxInitial && maxInitial > 0 && conditionTags.length > maxInitial && !expanded;
  const visibleTags = shouldLimit ? conditionTags.slice(0, maxInitial) : conditionTags;
  const hiddenCount = conditionTags.length - visibleTags.length;

  const isLight = variant === "light";

  return (
    <div className={`flex flex-wrap items-center gap-1 mt-1 ${className}`}>
      {visibleTags.map((tag, idx) => (
        <span
          key={`${tag}-${idx}`}
          className={`font-sans font-bold text-[9px] uppercase px-2 py-0.5 rounded-md border shrink-0 transition-colors ${
            isLight
              ? "bg-slate-100 text-slate-700 border-slate-200"
              : "bg-black/60 text-zinc-300 border-[#3A3A3A]"
          }`}
        >
          {tag}
        </span>
      ))}

      {batteryHealth && (
        <span
          className={`font-mono font-bold text-[9px] px-2 py-0.5 rounded-md border shrink-0 ${
            isLight
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-emerald-950/40 text-emerald-400 border-emerald-800/40"
          }`}
        >
          🔋 {batteryHealth} BH
        </span>
      )}

      {shouldLimit && hiddenCount > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(true);
          }}
          className={`font-mono font-bold text-[9px] px-2 py-0.5 rounded-md border cursor-pointer hover:underline ${
            isLight
              ? "bg-slate-200 text-slate-800 border-slate-300"
              : "bg-teal-950/60 text-teal-300 border-teal-800/60 hover:bg-teal-900/80"
          }`}
        >
          +{hiddenCount} more
        </button>
      )}

      {expanded && maxInitial && conditionTags.length > maxInitial && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(false);
          }}
          className={`font-mono font-bold text-[9px] px-1.5 py-0.5 rounded-md border cursor-pointer hover:underline ${
            isLight
              ? "bg-slate-200 text-slate-600 border-slate-300"
              : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white"
          }`}
        >
          less
        </button>
      )}

      {noteTag && (
        <span
          className={`font-sans text-[9px] italic px-2 py-0.5 rounded-md border shrink-0 ${
            isLight
              ? "bg-amber-50 text-amber-800 border-amber-200"
              : "bg-amber-950/30 text-amber-300 border-amber-800/30"
          }`}
        >
          📝 {noteTag}
        </span>
      )}
    </div>
  );
};

export default QuickTagsBadgeList;
