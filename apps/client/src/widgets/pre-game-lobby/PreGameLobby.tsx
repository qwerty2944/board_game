"use client";

import { useGameStore } from "@/entities/game/model/store";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import type { Room } from "colyseus.js";

interface Props {
  room: Room | null;
  sendMessage: (type: string, data?: any) => void;
}

export function PreGameLobby({ room, sendMessage }: Props) {
  const players = useGameStore((s) => s.players);
  const localSessionId = useGameStore((s) => s.localSessionId);

  const handleReady = () => sendMessage("ready");
  const handleStart = () => sendMessage("start_game");

  const isHost = room?.state?.hostSessionId === localSessionId;

  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-6 p-6">
      <Card className="w-full max-w-md border-gray-700 bg-gray-900/80">
        <CardHeader>
          <CardTitle className="text-center">대기실</CardTitle>
          {room && (
            <p className="text-center text-sm text-gray-400">
              방 코드: <span className="font-mono font-bold text-white">{room.state?.roomCode || "..."}</span>
            </p>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-400">참가자</h3>
            {Array.from(players.values()).map((player) => (
              <div
                key={player.sessionId}
                className="flex items-center justify-between rounded-lg bg-gray-800 px-3 py-2"
              >
                <span className="text-white">{player.name}</span>
                <Badge variant={player.sessionId === localSessionId ? "default" : "outline"}>
                  {player.sessionId === localSessionId ? "나" : "대기중"}
                </Badge>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleReady} className="flex-1">
              준비
            </Button>
            {isHost && (
              <Button onClick={handleStart} variant="destructive" className="flex-1">
                게임 시작
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
