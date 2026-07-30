import React, { useState, useEffect } from "react";
import { CreditCard } from "lucide-react";

interface PriceInputProps {
  value: string; // The numeric value as a string (e.g. "1500000")
  onChange: (numericVal: string) => void;
  className?: string;
  placeholder?: string;
  id?: string;
}

export function formatNumberToSuffix(num: number): string {
  if (num <= 0 || isNaN(num)) return "";
  if (num >= 1000000) {
    const val = num / 1000000;
    const formatted = val % 1 === 0 ? val.toFixed(0) : val.toFixed(1);
    return `₦${formatted}M`;
  } else if (num >= 1000) {
    const val = num / 1000;
    const formatted = val % 1 === 0 ? val.toFixed(0) : val.toFixed(1);
    return `₦${formatted}K`;
  }
  return `₦${num.toLocaleString()}`;
}

export default function IntelligentPriceInput({ value, onChange, placeholder, id }: PriceInputProps) {
  // Synchronize internal raw text representation
  const [rawText, setRawText] = useState(() => {
    if (!value) return "";
    return value.replace(/[^0-9]/g, "");
  });

  useEffect(() => {
    const externalDigits = (value || "").replace(/[^0-9]/g, "");
    if (externalDigits !== rawText) {
      setRawText(externalDigits);
    }
  }, [value]);

  const numValue = parseInt(rawText, 10) || 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    
    // Clear value if empty
    if (!text) {
      setRawText("");
      onChange("");
      return;
    }

    // Capture standard digits from input text
    const digitsOnly = text.replace(/[^0-9]/g, "");
    setRawText(digitsOnly);
    onChange(digitsOnly);
  };

  // Add suffix handlers for K and M buttons
  const handleSuffixClick = (suffix: "K" | "M") => {
    let currentNum = parseInt(rawText, 10);
    if (isNaN(currentNum) || currentNum <= 0) {
      currentNum = 1; // Default fallback to let people click K or M from scratch
    }
    const multiplier = suffix === "K" ? 1000 : 1000000;
    const newNum = currentNum * multiplier;
    if (newNum > 100000000000) return; // Prevention for overflow
    const nextRaw = newNum.toString();
    setRawText(nextRaw);
    onChange(nextRaw);
  };

  return (
    <div className="w-full space-y-2" id={id ? `intelligent-container-${id}` : undefined}>
      <div className="relative flex items-center bg-[#141414] border border-[#222222] focus-within:border-zinc-600 rounded-xl px-4 py-3 transition-all">
        <span className="text-zinc-500 mr-2 shrink-0">
          <CreditCard className="w-5 h-5" />
        </span>
        <input
          type="text"
          id={id}
          placeholder={placeholder || "₦0"}
          value={formatNumberToSuffix(numValue)}
          onChange={handleInputChange}
          className="w-full bg-transparent font-mono text-base font-bold text-white focus:outline-none placeholder-zinc-700"
        />
        {/* Real-time full standard number layout verification helper */}
        {numValue > 0 && (
          <span className="absolute right-4 text-[10px] text-zinc-500 font-mono select-none pointer-events-none">
            ({numValue.toLocaleString()})
          </span>
        )}
      </div>
      
      {/* Short quick action buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleSuffixClick("K")}
          className="flex-1 py-2 bg-[#1C1D22] hover:bg-[#2B2E36] active:bg-[#18191E] border border-zinc-800 text-zinc-400 hover:text-emerald-400 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer flex justify-center items-center gap-1 shadow-sm"
        >
          <span>× Thousand</span> <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1 py-0.25 rounded font-black">K</span>
        </button>
        <button
          type="button"
          onClick={() => handleSuffixClick("M")}
          className="flex-1 py-2 bg-[#1C1D22] hover:bg-[#2B2E36] active:bg-[#18191E] border border-zinc-800 text-zinc-400 hover:text-teal-400 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer flex justify-center items-center gap-1 shadow-sm"
        >
          <span>× Million</span> <span className="text-[10px] bg-teal-500/10 text-teal-400 px-1 py-0.25 rounded font-black">M</span>
        </button>
      </div>
    </div>
  );
}
