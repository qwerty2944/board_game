"use client";

import { useState } from "react";
import { GAME_REGISTRY } from "@board-game/shared";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

const games = Object.values(GAME_REGISTRY);

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (options: {
    gameId: string;
    isPrivate: boolean;
    maxPlayers: number;
    password?: string;
  }) => void;
}

export function CreateRoomModal({ open, onOpenChange, onCreate }: Props) {
  const [gameId, setGameId] = useState(games[0]?.id ?? "love_letter");
  const selectedGame = GAME_REGISTRY[gameId];
  const [maxPlayers, setMaxPlayers] = useState(selectedGame?.maxPlayers ?? 4);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");

  const handleGameChange = (id: string) => {
    setGameId(id);
    const game = GAME_REGISTRY[id];
    if (game) setMaxPlayers(game.maxPlayers);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      gameId,
      isPrivate,
      maxPlayers,
      password: password || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-gray-700 bg-gray-900">
        <DialogHeader>
          <DialogTitle>방 만들기</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="gameSelect">게임 선택</Label>
            <select
              id="gameSelect"
              value={gameId}
              onChange={(e) => handleGameChange(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name} ({game.minPlayers}-{game.maxPlayers}명)
                </option>
              ))}
            </select>
            {selectedGame && (
              <p className="text-xs text-gray-500">{selectedGame.description}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="maxPlayers">최대 인원</Label>
            <Input
              id="maxPlayers"
              type="number"
              min={selectedGame?.minPlayers ?? 2}
              max={selectedGame?.maxPlayers ?? 8}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPrivate"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="isPrivate">비공개 방</Label>
          </div>
          {isPrivate && (
            <div className="space-y-1.5">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="방 비밀번호"
              />
            </div>
          )}
          <Button type="submit" className="w-full">
            방 만들기
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
