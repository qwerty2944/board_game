"use client";

import { useState } from "react";
import { GAME_REGISTRY } from "@board-game/shared";

interface CreateRoomModalProps {
  onClose: () => void;
  onCreate: (options: {
    isPrivate: boolean;
    maxPlayers: number;
    password?: string;
  }) => void;
}

export function CreateRoomModal({ onClose, onCreate }: CreateRoomModalProps) {
  const [isPrivate, setIsPrivate] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [password, setPassword] = useState("");

  const game = GAME_REGISTRY.love_letter;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      isPrivate,
      maxPlayers,
      password: password || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl border border-gray-700 bg-game-surface p-6">
        <h2 className="mb-4 text-xl font-bold text-white">Create Room</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300">Game</label>
            <div className="mt-1 rounded bg-gray-800 px-3 py-2 text-white">
              {game.name}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300">Max Players</label>
            <input
              type="range"
              min={game.minPlayers}
              max={game.maxPlayers}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              className="mt-1 w-full"
            />
            <span className="text-sm text-gray-400">{maxPlayers} players</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="private"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="private" className="text-sm text-gray-300">
              Private Room
            </label>
          </div>

          <div>
            <label className="block text-sm text-gray-300">
              Password (optional)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave empty for no password"
              className="mt-1 w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">
              Create
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-600 px-4 py-2 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
