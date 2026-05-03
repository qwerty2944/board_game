"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useUIStore } from "@/entities/room/model/store";
import {
  createRoom,
  joinRoomById,
  joinByCode,
  joinMatchmaking,
  getAvailableRooms,
} from "@/entities/room/model/api";
import { setPendingRoom } from "@/shared/lib/colyseus";
import { RoomCard } from "@/entities/room/ui/RoomCard";
import { CreateRoomModal } from "@/features/creating-room/ui/CreateRoomModal";
import { JoinByCodeForm } from "@/features/joining-room/ui/JoinByCodeForm";
import { Button } from "@/shared/ui/button";
import type { RoomMetadata } from "@board-game/shared";

interface LobbyRoom {
  roomId: string;
  metadata: RoomMetadata;
  clients: number;
}

export function LobbyView() {
  const { data: session } = useSession();
  const router = useRouter();
  const { isCreateRoomModalOpen, openCreateRoomModal, closeCreateRoomModal } =
    useUIStore();
  const [rooms, setRooms] = useState<LobbyRoom[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);
  const [isJoiningByCode, setIsJoiningByCode] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await getAvailableRooms();
      setRooms(data);
      setIsConnected(true);
    } catch {
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    if (!session) {
      router.push("/");
      return;
    }
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [session, router, refresh]);

  if (!session) return null;

  const handleJoinRoom = async (roomId: string) => {
    setJoiningRoomId(roomId);
    try {
      const room = await joinRoomById(roomId);
      setPendingRoom(room);
      router.push(`/room/${room.roomId}`);
    } catch (err: any) {
      alert(err.message || "방 참가 실패");
    } finally {
      setJoiningRoomId(null);
    }
  };

  const handleCreateRoom = async (options: {
    gameId: string;
    isPrivate: boolean;
    maxPlayers: number;
    password?: string;
  }) => {
    setIsCreating(true);
    try {
      const room = await createRoom({
        ...options,
        hostName: session.user?.name || "호스트",
      });
      setPendingRoom(room);
      closeCreateRoomModal();
      router.push(`/room/${room.roomId}`);
    } catch (err: any) {
      alert(err.message || "방 생성 실패");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinByCode = async (code: string, password?: string) => {
    setIsJoiningByCode(true);
    try {
      const room = await joinByCode(code, password);
      setPendingRoom(room);
      router.push(`/room/${room.roomId}`);
    } catch (err: any) {
      alert(err.message || "방을 찾을 수 없습니다");
    } finally {
      setIsJoiningByCode(false);
    }
  };

  const handleMatchmaking = async () => {
    setIsMatchmaking(true);
    try {
      const room = await joinMatchmaking("love_letter");
      setPendingRoom(room);
      router.push(`/room/${room.roomId}`);
    } catch (err: any) {
      alert(err.message || "매칭 실패");
    } finally {
      setIsMatchmaking(false);
    }
  };

  return (
    <main className="mx-auto h-dvh max-w-4xl overflow-y-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">로비</h1>
        <div className="flex gap-3">
          <Button onClick={openCreateRoomModal} loading={isCreating}>
            방 만들기
          </Button>
          <Button
            onClick={handleMatchmaking}
            loading={isMatchmaking}
            variant="secondary"
          >
            빠른 매칭
          </Button>
        </div>
      </div>

      <JoinByCodeForm onJoin={handleJoinByCode} loading={isJoiningByCode} />

      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-xl font-semibold text-white">공개 방 목록</h2>
          <span
            className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
          />
          <Button
            onClick={refresh}
            variant="ghost"
            size="sm"
            className="ml-auto text-gray-400"
          >
            새로고침
          </Button>
        </div>

        {rooms.length === 0 ? (
          <p className="py-8 text-center text-gray-500">
            현재 열린 방이 없습니다. 방을 만들어보세요!
          </p>
        ) : (
          <div className="space-y-2">
            {rooms.map((room) => (
              <RoomCard
                key={room.roomId}
                roomId={room.roomId}
                metadata={room.metadata}
                clients={room.clients}
                onJoin={handleJoinRoom}
                loading={joiningRoomId === room.roomId}
              />
            ))}
          </div>
        )}
      </div>

      <CreateRoomModal
        open={isCreateRoomModalOpen}
        onOpenChange={(open) => (open ? openCreateRoomModal() : closeCreateRoomModal())}
        onCreate={handleCreateRoom}
        loading={isCreating}
      />
    </main>
  );
}
