"use client";

import { useGameStore } from "@/entities/game/model/store";

function formatEventKo(event: { type: string; payload: Record<string, unknown> }): string {
  const { type, payload } = event;
  const playerName = (payload.playerName as string) || "???";
  const targetName = (payload.targetName as string) || "";
  const cardName = (payload.cardName as string) || "";

  switch (type) {
    case "card_played":
      return `${playerName}\uC774(\uAC00) ${cardName}\uC744(\uB97C) \uB0C3\uC2B5\uB2C8\uB2E4.`;
    case "player_eliminated":
      return `\u274C ${playerName}\uC774(\uAC00) \uD0C8\uB77D\uD588\uC2B5\uB2C8\uB2E4.`;
    case "guard_guess":
      return `${playerName}\uC774(\uAC00) ${targetName}\uC758 \uCE74\uB4DC\uB97C \uCD94\uCE21\uD569\uB2C8\uB2E4.`;
    case "guard_correct":
      return `\u2714 \uACBD\uBE44\uBCD1 \uCD94\uCE21 \uC131\uACF5! ${targetName} \uD0C8\uB77D.`;
    case "guard_wrong":
      return `\u2716 \uACBD\uBE44\uBCD1 \uCD94\uCE21 \uC2E4\uD328.`;
    case "baron_compare":
      return `\u2696 ${playerName}\uACFC ${targetName}\uC774 \uBE44\uAD50\uD569\uB2C8\uB2E4.`;
    case "prince_discard":
      return `${targetName}\uC774(\uAC00) \uC190\uD328\uB97C \uBC84\uB9AC\uACE0 \uC0C8 \uCE74\uB4DC\uB97C \uBF51\uC2B5\uB2C8\uB2E4.`;
    case "king_swap":
      return `\uD83E\uDD34 ${playerName}\uACFC ${targetName}\uC774 \uC190\uD328\uB97C \uAD50\uD658\uD569\uB2C8\uB2E4.`;
    case "handmaid_protect":
      return `\uD83D\uDEE1 ${playerName}\uC774(\uAC00) \uBCF4\uD638 \uC0C1\uD0DC\uAC00 \uB429\uB2C8\uB2E4.`;
    case "round_start":
      return `\uD83C\uDFAE \uB77C\uC6B4\uB4DC ${payload.round || ""} \uC2DC\uC791!`;
    case "round_end":
      return `\uD83C\uDFC1 \uB77C\uC6B4\uB4DC \uC885\uB8CC.`;
    case "round_win":
      return `\uD83C\uDFC6 ${playerName} \uB77C\uC6B4\uB4DC \uC2B9\uB9AC!`;
    default:
      return `${playerName}: ${type}`;
  }
}

export function GameEventFeed() {
  const gameEvents = useGameStore((s) => s.gameEvents);
  const recentEvents = gameEvents.slice(-5).reverse();

  if (recentEvents.length === 0) return null;

  return (
    <div className="pointer-events-none fixed left-4 top-4 z-30 w-72 space-y-1">
      {recentEvents.map((event, i) => (
        <div
          key={gameEvents.length - i}
          className="rounded-md bg-black/60 px-3 py-1.5 text-xs text-gray-200 backdrop-blur-sm"
          style={{ opacity: 1 - i * 0.15 }}
        >
          {formatEventKo(event)}
        </div>
      ))}
    </div>
  );
}
