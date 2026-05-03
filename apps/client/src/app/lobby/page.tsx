"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLobby } from "@/hooks/useLobby";
import { useUIStore } from "@/stores/uiStore";
import { createRoom, joinRoomById, joinByCode, joinMatchmaking } from "@/lib/api";
import { GAME_REGISTRY } from "@board-game/shared";
import { RoomList } from "@/components/lobby/RoomList";
import { CreateRoomModal } from "@/components/lobby/CreateRoomModal";
import { JoinByCodeForm } from "@/components/lobby/JoinByCodeForm";

export default function LobbyPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { rooms, isConnected, refresh } = useLobby();
  const { isCreateRoomModalOpen, openCreateRoomModal, closeCreateRoomModal } =
    useUIStore();
  const [isMatchmaking, setIsMatchmaking] = useState(false);

  if (!session) {
    router.push("/");
    return null;
  }

  const handleJoinRoom = async (roomId: string) => {
    try {
      const room = await joinRoomById(roomId);
      router.push(`/room/${room.roomId}`);
    } catch (err: any) {
      alert(err.message || "Failed to join room");
    }
  };

  const handleCreateRoom = async (options: {
    isPrivate: boolean;
    maxPlayers: number;
    password?: string;
  }) => {
    try {
      const room = await createRoom({
        gameId: "love_letter",
        hostName: session.user?.name || "Host",
        ...options,
      });
      closeCreateRoomModal();
      router.push(`/room/${room.roomId}`);
    } catch (err: any) {
      alert(err.message || "Failed to create room");
    }
  };

  const handleJoinByCode = async (code: string, password?: string) => {
    try {
      const room = await joinByCode(code, password);
      router.push(`/room/${room.roomId}`);
    } catch (err: any) {
      alert(err.message || "Room not found");
    }
  };

  const handleMatchmaking = async () => {
    setIsMatchmaking(true);
    try {
      const room = await joinMatchmaking("love_letter");
      router.push(`/room/${room.roomId}`);
    } catch (err: any) {
      alert(err.message || "Matchmaking failed");
    } finally {
      setIsMatchmaking(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Game Lobby</h1>
        <div className="flex gap-3">
          <button onClick={openCreateRoomModal} className="btn-primary">
            Create Room
          </button>
          <button
            onClick={handleMatchmaking}
            disabled={isMatchmaking}
            className="btn-accent"
          >
            {isMatchmaking ? "Finding..." : "Quick Match"}
          </button>
        </div>
      </div>

      <JoinByCodeForm onJoin={handleJoinByCode} />

      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-xl font-semibold text-white">Available Rooms</h2>
          <span
            className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
          />
          <button
            onClick={refresh}
            className="ml-auto text-sm text-gray-400 hover:text-white"
          >
            Refresh
          </button>
        </div>
        <RoomList rooms={rooms} onJoin={handleJoinRoom} />
      </div>

      {isCreateRoomModalOpen && (
        <CreateRoomModal
          onClose={closeCreateRoomModal}
          onCreate={handleCreateRoom}
        />
      )}
    </main>
  );
}
