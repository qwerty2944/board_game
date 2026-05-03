"use client";

import dynamic from "next/dynamic";
import type { Room } from "colyseus.js";

const PhaserGameWrapper = dynamic(
  () => import("@/game/PhaserGameWrapper").then((mod) => ({ default: mod.PhaserGameWrapper })),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center text-gray-400">게임 로딩 중...</div> }
);

interface Props {
  room: Room | null;
}

export function GameBoard({ room }: Props) {
  if (!room) return <div className="flex h-full items-center justify-center text-muted-foreground">연결 대기 중...</div>;

  return (
    <div className="h-full w-full">
      <PhaserGameWrapper room={room} />
    </div>
  );
}
