"use client";

import dynamic from "next/dynamic";
import type { Room } from "colyseus.js";

const PhaserGameWrapper = dynamic(
  () => import("@/game/PhaserGameWrapper").then((m) => m.PhaserGameWrapper),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center text-gray-400">Loading game...</div> }
);

interface GameCanvasProps {
  room: Room | null;
}

export function GameCanvas({ room }: GameCanvasProps) {
  if (!room) return null;

  return (
    <div className="h-full w-full">
      <PhaserGameWrapper room={room} />
    </div>
  );
}
