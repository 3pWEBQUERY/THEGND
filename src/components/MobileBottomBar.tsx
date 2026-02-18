"use client";
import Link from "next/link";
import { Star, Phone, MessageCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  name?: string | null;
  locationText?: string | null;
  ratingAvg?: number;
  ratingCount?: number;
  phone?: string | null;
  escortId?: string | null;
  avatar?: string | null;
  commentsAnchor?: string; // default: 'kommentare'
};

export default function MobileBottomBar({
  name,
  locationText,
  ratingAvg = 0,
  ratingCount = 0,
  phone,
  escortId,
  avatar,
  commentsAnchor = "kommentare",
}: Props) {
  const safeName = name || "ESCORT";
  const rating = Math.max(0, Math.min(5, Number.isFinite(ratingAvg) ? ratingAvg : 0));
  const stars = Math.round(rating);
  const barRef = useRef<HTMLDivElement>(null)
  const [barH, setBarH] = useState<number>(56)
  useEffect(() => {
    const el = barRef.current
    if (!el) return
    const update = () => {
      try { setBarH(el.getBoundingClientRect().height || 56) } catch {}
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const msgHref = (() => {
    if (!escortId) return null;
    const qs = new URLSearchParams();
    qs.set("tab", "messages");
    qs.set("to", escortId);
    if (name) qs.set("toName", String(name));
    if (avatar) qs.set("toAvatar", String(avatar));
    return `/dashboard?${qs.toString()}`;
  })();

  return (
    <>
      {/* Floating message button (left) */}
      {msgHref ? (
        <Link
          href={msgHref}
          className="fixed right-[76px] sm:hidden z-[10001] h-12 w-12 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-lg border border-pink-200"
          style={{ bottom: barH + 8 }}
          aria-label="Nachricht"
        >
          <MessageCircle className="h-6 w-6" />
        </Link>
      ) : null}

      {/* Floating call button (only if phone exists) */}
      {phone ? (
        <a
          href={`tel:${phone}`}
          className="fixed right-4 sm:hidden z-[10001] h-12 w-12 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-lg border border-pink-200"
          style={{ bottom: barH + 8 }}
          aria-label="Anrufen"
        >
          <Phone className="h-6 w-6" />
        </a>
      ) : null}

      {/* Bottom bar */}
      <div className="fixed inset-x-0 bottom-0 sm:hidden z-[10000]">
        <div ref={barRef} className="bg-gray-800/95 text-white shadow-lg border-t border-gray-700 rounded-none">
          <div className="px-5 py-4">
            <div className="text-lg font-light tracking-widest truncate">{safeName}</div>
            {rating > 0 && (
              <div className="mt-1 flex items-center gap-2 text-sm">
                <span className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < stars ? "text-amber-400" : "text-gray-500"}`}
                      fill="currentColor"
                    />
                  ))}
                </span>
                <span className="text-white/90">{`${rating.toFixed(1)}`}</span>
                {ratingCount > 0 && (
                  <>
                    <span className="text-white/60">|</span>
                    <Link
                      href={`#${commentsAnchor}`}
                      className="underline text-pink-300 hover:text-pink-200"
                    >
                      Berichte
                    </Link>
                  </>
                )}
              </div>
            )}
            {locationText && (
              <div className="text-xs text-gray-300 mt-1 truncate">{locationText}</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
