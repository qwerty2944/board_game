"use client";

import type { LobbyRoom } from "@/hooks/useLobby";

interface RoomListProps {
  rooms: LobbyRoom[];
  onJoin: (roomId: string) => void;
}

export function RoomList({ rooms, onJoin }: RoomListProps) {
  if (rooms.length === 0) {
    return (
      <div className="rounded-lg border border-gray-700 bg-game-surface p-8 text-center text-gray-400">
        No rooms available. Create one or use Quick Match!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rooms.map((room) => (
        <div
          key={room.roomId}
          className="flex items-center justify-between rounded-lg border border-gray-700 bg-game-surface p-4"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">
                {room.metadata.hostName}&apos;s Room
              </span>
              {room.metadata.hasPassword && (
                <span className="text-xs text-yellow-400">🔒</span>
              )}
              <span className="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-300">
                {room.metadata.roomCode}
              </span>
            </div>
            <div className="mt-1 text-sm text-gray-400">
              {room.metadata.currentPlayers}/{room.metadata.maxPlayers} players
              {" · "}
              {room.metadata.status}
            </div>
          </div>
          <button
            onClick={() => onJoin(room.roomId)}
            disabled={room.metadata.status !== "waiting"}
            className="btn-primary text-sm"
          >
            Join
          </button>
        </div>
      ))}
    </div>
  );
}
