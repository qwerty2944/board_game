"use client";

import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import type { RoomMetadata } from "@board-game/shared";

interface Props {
  roomId: string;
  metadata: RoomMetadata;
  clients: number;
  onJoin: (roomId: string) => void;
}

export function RoomCard({ roomId, metadata, clients, onJoin }: Props) {
  return (
    <Card className="border-gray-700 bg-gray-800/50">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">
              {metadata.hostName}님의 방
            </span>
            {metadata.isPrivate && (
              <Badge variant="outline" className="text-xs">
                비공개
              </Badge>
            )}
          </div>
          <span className="text-sm text-gray-400">
            {clients}/{metadata.maxPlayers}명 ·{" "}
            코드: {metadata.roomCode}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onJoin(roomId)}
          disabled={clients >= metadata.maxPlayers}
        >
          {clients >= metadata.maxPlayers ? "만석" : "입장"}
        </Button>
      </CardContent>
    </Card>
  );
}
