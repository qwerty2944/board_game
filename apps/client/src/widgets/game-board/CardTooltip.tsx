"use client";

import { useUIStore } from "@/entities/room/model/store";
import { getCardDescriptionKo } from "@/game/data/card-descriptions-ko";

export function CardTooltip() {
  const cardTooltip = useUIStore((s) => s.cardTooltip);

  if (!cardTooltip) return null;

  const desc = getCardDescriptionKo(cardTooltip.value, cardTooltip.name);
  if (!desc) return null;

  return (
    <div
      className="pointer-events-none fixed z-50 w-64 rounded-lg border border-gray-600 bg-gray-900/95 p-3 shadow-xl backdrop-blur-sm"
      style={{
        left: `${cardTooltip.screenX}px`,
        top: `${cardTooltip.screenY}px`,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="mb-1 flex items-center gap-2">
        <span className="text-xl">{desc.symbol}</span>
        <span className="font-bold text-white">{desc.nameKo}</span>
        <span className="ml-auto rounded bg-gray-700 px-1.5 py-0.5 text-xs font-mono text-gray-300">
          {desc.value}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-gray-200">{desc.effect}</p>
      {desc.flavor && (
        <p className="mt-1 text-xs italic text-gray-400">{desc.flavor}</p>
      )}
    </div>
  );
}
