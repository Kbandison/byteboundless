"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AutocompleteInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function AutocompleteInput({
  id,
  value,
  onChange,
  suggestions,
  placeholder,
  icon,
  className,
}: AutocompleteInputProps) {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value.trim()) {
      setFiltered([]);
      setOpen(false);
      return;
    }
    const lower = value.toLowerCase();
    const matches = suggestions
      .filter((s) => s.toLowerCase().includes(lower))
      .slice(0, 8);
    setFiltered(matches);
    setOpen(matches.length > 0);
    setHighlightIdx(-1);
  }, [value, suggestions]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && highlightIdx >= 0) {
      e.preventDefault();
      onChange(filtered[highlightIdx]);
      setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]">
            {icon}
          </div>
        )}
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => { if (filtered.length > 0) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={cn(
            "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-sm placeholder:text-[var(--color-text-dim)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent",
            icon ? "pl-10 pr-4 py-3" : "px-4 py-3",
            className
          )}
        />
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg shadow-lg overflow-hidden">
          {filtered.map((item, i) => (
            <button
              key={item}
              type="button"
              onMouseDown={() => { onChange(item); setOpen(false); }}
              className={cn(
                "w-full text-left px-4 py-2.5 text-sm transition-colors",
                i === highlightIdx
                  ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                  : "hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]"
              )}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
