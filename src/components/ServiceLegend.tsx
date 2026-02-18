"use client";

import { getClasses, getIcon, Category } from "@/components/ServiceTag";

type Props = {
  className?: string;
};

const CATEGORIES: { key: Category; label: string }[] = [
  { key: "social", label: "Social" },
  { key: "bdsm", label: "BDSM" },
  { key: "massage", label: "Massage" },
  { key: "oral", label: "Oral" },
  { key: "anal", label: "Anal" },
  { key: "fetish", label: "Fetish" },
  { key: "toys", label: "Toys" },
  { key: "fluids", label: "Fluids" },
  { key: "roleplay", label: "Roleplay" },
  { key: "other", label: "Sonstiges" },
];

export default function ServiceLegend({ className = "" }: Props) {
  return (
    <div className={className}>
      <div className="border border-gray-200 bg-gray-50 px-4 py-3 rounded-none">
        <div className="text-[10px] tracking-widest text-gray-500 mb-2">LEGENDE</div>
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map(({ key, label }) => {
            const classes = getClasses(key);
            const Icon = getIcon(key);
            return (
              <span
                key={key}
                className={`inline-flex items-center gap-1 px-2.5 py-1 border text-[10px] tracking-widest font-medium uppercase rounded-none ${classes}`}
              >
                {Icon}
                <span>{label}</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
