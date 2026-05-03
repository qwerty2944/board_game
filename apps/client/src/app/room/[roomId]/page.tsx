"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { Room } from "colyseus.js";
import { getColyseusClient, getGameToken } from "@/lib/colyseus";
import { useRoom } from "@/hooks/useRoom";
import { useGameStore } from "@/stores/gameStore";
import { PreGameLobby } from "@/components/room/PreGameLobby";
import { ChatPanel } from "@/components/room/ChatPanel";
import { GameCanvas } from "@/components/game/GameCanvas";

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { data: session } = useSession();
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const joinedRef = useRef(false);

  const { sendMessage } = useRoom(room);
  const phase = useGameStore((s) => s.phase);

  useEffect(() => {
    if (!session || !roomId || joinedRef.current) return;
    joinedRef.current = true;

    const connect = async () => {
      try {
        const client = getColyseusClient();
        const token = await getGameToken();
        const joinedRoom = await client.joinById(roomId, { token });
        setRoom(joinedRoom);

        joinedRoom.onLeave((code) => {
          if (code === 4000) {
            setError("You were kicked from the room");
          }
          setRoom(null);
        });

        joinedRoom.onError((code, message) => {
          setError(message || `Error: ${code}`);
        });
      } catch (err: any) {
        setError(err.message || "Failed to join room");
      } finally {
        setIsConnecting(false);
      }
    };

    connect();

    return () => {
      room?.leave();
    };
  }, [session, roomId]);

  if (!session) {
    router.push("/");
    return null;
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-400">{error}</p>
          <button
            onClick={() => router.push("/lobby")}
            className="btn-primary mt-4"
          >
            Back to Lobby
          </button>
        </div>
      </main>
    );
  }

  if (isConnecting) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">Connecting to room...</p>
      </main>
    );
  }

  const isInGame = phase === "playing" || phase === "awaiting_target" || phase === "awaiting_effect_choice";

  return (
    <main className="relative flex h-screen flex-col">
      {phase === "waiting" || phase === "ready" ? (
        <PreGameLobby room={room} sendMessage={sendMessage} />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1">
            <GameCanvas room={room} />
          </div>
        </div>
      )}
      <ChatPanel room={room} sendMessage={sendMessage} />
    </main>
  );
}
