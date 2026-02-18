"use client";

import { useState } from "react";

type Props = {
  text: string | null | undefined;
  limit?: number; // default 600
  className?: string;
  buttonClassName?: string;
};

function normalizeDescription(html: string): string {
  if (!html) return "";
  let s = String(html);
  s = s
    .replace(/<br\s*\/>/gi, "\n")
    .replace(/<br\s*>/gi, "\n")
    .replace(/<\/?div[^>]*>/gi, "\n")
    .replace(/<\/?p[^>]*>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/(li|ul|ol)>/gi, "\n")
    .replace(/<h[1-6][^>]*>/gi, "")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  s = s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
  s = s.replace(/\n{3,}/g, "\n\n").trim();
  return s;
}

export default function ExpandableText({ text, limit = 600, className = "", buttonClassName = "" }: Props) {
  const [open, setOpen] = useState(false);
  const full = normalizeDescription(text || "");
  const isLong = full.length > limit;
  const shown = open || !isLong ? full : full.slice(0, limit).trimEnd() + "…";
  return (
    <div>
      <pre className={`whitespace-pre-wrap ${className}`}>{shown}</pre>
      {isLong && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={buttonClassName || "mt-3 text-xs font-light tracking-widest uppercase text-pink-500 hover:text-pink-600"}
        >
          {open ? "WENIGER ANZEIGEN" : "WEITER LESEN"}
        </button>
      )}
    </div>
  );
}
