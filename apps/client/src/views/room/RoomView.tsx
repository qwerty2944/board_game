"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { Room } from "colyseus.js";
import { getColyseusClient, getGameToken, takePendingRoom } from "@/shared/lib/colyseus";
import { useRoom } from "@/features/playing-game/model/useRoom";
import { useGameStore } from "@/entities/game/model/store";
import { PreGameLobby } from "@/widgets/pre-game-lobby/PreGameLobby";
import { ChatPanel } from "@/widgets/chat/ChatPanel";
import { GameBoard } from "@/widgets/game-board/GameBoard";
import { Button } from "@/shared/ui/button";
import { ROOM_CLOSE_CODES } from "@board-game/shared";

export function RoomView() {
  const { roomId } = useParams<{ roomId: string }>();
  const { data: session } = useSession();
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const joinedRef = useRef(false);
  const roomRef = useRef<Room | null>(null);

  const { sendMessage } = useRoom(room);
  const phase = useGameStore((s) => s.phase);

  useEffect(() => {
    if (!session || !roomId || joinedRef.current) return;
    joinedRef.current = true;

    const connect = async () => {
      try {
        // Reuse room from lobby navigation if available
        let joinedRoom = takePendingRoom(roomId);

        if (!joinedRoom) {
          const client = getColyseusClient();
          const token = await getGameToken();
          joinedRoom = await client.joinById(roomId, { token });
        }

        roomRef.current = joinedRoom;
        setRoom(joinedRoom);

        joinedRoom.onLeave((code) => {
          if (code === ROOM_CLOSE_CODES.KICKED) {
            setError("방에서 추방당했습니다");
          } else if (code === ROOM_CLOSE_CODES.PLAYER_LEFT_DURING_GAME) {
            setError("참가자가 게임 중 나가서 방이 종료되었습니다");
          }
          setRoom(null);
        });

        joinedRoom.onError((code, message) => {
          setError(message || `오류: ${code}`);
        });
      } catch (err: any) {
        setError(err.message || "방 참가 실패");
      } finally {
        setIsConnecting(false);
      }
    };

    connect();

    return () => {
      roomRef.current?.leave();
      useGameStore.getState().reset();
    };
  }, [session, roomId]);

  if (!session) {
    router.push("/");
    return null;
  }

  if (error) {
    return (
      <main className="flex h-dvh items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-400">{error}</p>
          <Button onClick={() => router.push("/lobby")} className="mt-4">
            로비로 돌아가기
          </Button>
        </div>
      </main>
    );
  }

  if (isConnecting) {
    return (
      <main className="flex h-dvh items-center justify-center">
        <p className="text-gray-400">방에 접속 중...</p>
      </main>
    );
  }

  return (
    <main className="relative flex h-dvh flex-col">
      {phase === "waiting" || phase === "ready" ? (
        <PreGameLobby room={room} sendMessage={sendMessage} />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1">
            <GameBoard room={room} />
          </div>
        </div>
      )}
      <ChatPanel room={room} sendMessage={sendMessage} />
    </main>
  );
}
