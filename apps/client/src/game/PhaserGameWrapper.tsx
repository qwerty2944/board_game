"use client";

import { useEffect, useRef } from "react";
import type { Room } from "colyseus.js";
import { createPhaserGame } from "./PhaserGame";

interface PhaserGameWrapperProps {
  room: Room;
}

export function PhaserGameWrapper({ room }: PhaserGameWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const game = createPhaserGame(containerRef.current, "love_letter");
    gameRef.current = game;

    // Pass room reference to scenes via game registry
    game.registry.set("room", room);

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, [room]);

  return <div ref={containerRef} className="h-full w-full" />;
}
