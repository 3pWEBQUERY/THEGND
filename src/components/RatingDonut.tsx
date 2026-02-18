"use client";

import React from "react";

interface RatingDonutProps {
  value: number; // 0..5
  size?: number; // px
  strokeWidth?: number; // px
  trackColor?: string;
  fillColor?: string;
  showValue?: boolean; // show numeric center text
  className?: string;
}

export default function RatingDonut({
  value,
  size = 28,
  strokeWidth = 4,
  trackColor = "#E5E7EB", // gray-200
  fillColor = "#F59E0B", // amber-500
  showValue = false,
  className,
}: RatingDonutProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(5, value || 0));
  const percent = clamped / 5; // 0..1
  const dash = circumference * percent;
  const rest = circumference - dash;

  return (
    <div
      className={className}
      style={{ width: size, height: size, position: "relative" }}
      aria-label={`Bewertung ${clamped.toFixed(1)} von 5`}
      title={`${clamped.toFixed(1)} / 5`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-hidden={showValue ? undefined : true}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={fillColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${dash} ${rest}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {showValue && (
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: Math.max(10, Math.round(size * 0.36)),
            lineHeight: 1,
            color: "#111827", // gray-900
          }}
        >
          {clamped.toFixed(1)}
        </span>
      )}
    </div>
  );
}
