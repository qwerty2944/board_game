"use client";

import { useState } from "react";
import type { Room } from "colyseus.js";
import { useGameStore } from "@/stores/gameStore";
import { MessageType } from "@board-game/shared";

interface PreGameLobbyProps {
  room: Room | null;
  sendMessage: (type: string, data?: any) => void;
}

export function PreGameLobby({ room, sendMessage }: PreGameLobbyProps) {
  const players = useGameStore((s) => s.players);
  const localSessionId = useGameStore((s) => s.localSessionId);
  const [isReady, setIsReady] = useState(false);

  const isHost = room?.state?.hostSessionId === localSessionId;
  const roomCode = room?.state?.roomCode || "";
  const playerList = Array.from(players.values());

  const handleReady = () => {
    const newReady = !isReady;
    setIsReady(newReady);
    sendMessage(MessageType.READY, { ready: newReady });
  };

  const handleStart = () => {
    sendMessage(MessageType.START_GAME, {});
  };

  const handleKick = (sessionId: string) => {
    sendMessage(MessageType.KICK_PLAYER, { targetSessionId: sessionId });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-lg rounded-xl border border-gray-700 bg-game-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Pre-Game Lobby</h2>
          <div className="rounded bg-gray-800 px-3 py-1 font-mono text-lg tracking-wider text-game-gold">
            {roomCode}
          </div>
        </div>

        <div className="mb-6 space-y-2">
          <h3 className="text-sm font-medium text-gray-400">Players</h3>
          {playerList.map((player) => (
            <div
              key={player.sessionId}
              className="flex items-center justify-between rounded-lg bg-gray-800 px-4 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-white">{player.name}</span>
                {player.sessionId === room?.state?.hostSessionId && (
                  <span className="rounded bg-game-gold/20 px-1.5 py-0.5 text-xs text-game-gold">
                    Host
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {player.sessionId !== localSessionId && isHost && (
                  <button
                    onClick={() => handleKick(player.sessionId)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Kick
                  </button>
                )}
                <span
                  className={`h-3 w-3 rounded-full ${
                    player.sessionId === room?.state?.hostSessionId
                      ? "bg-green-500"
                      : isReady && player.sessionId === localSessionId
                        ? "bg-green-500"
                        : "bg-gray-600"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          {!isHost && (
            <button
              onClick={handleReady}
              className={`flex-1 rounded-lg px-4 py-2 font-semibold transition-colors ${
                isReady
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {isReady ? "Ready!" : "Ready Up"}
            </button>
          )}
          {isHost && (
            <button onClick={handleStart} className="btn-accent flex-1">
              Start Game
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
