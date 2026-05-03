"use client";

import { useEffect, useState, useCallback } from "react";
import { getColyseusClient } from "@/lib/colyseus";
import type { RoomAvailable } from "colyseus.js";
import type { RoomMetadata } from "@board-game/shared";

export interface LobbyRoom {
  roomId: string;
  metadata: RoomMetadata;
  clients: number;
}

/**
 * Hook that polls for available rooms via Colyseus HTTP API.
 */
export function useLobby() {
  const [rooms, setRooms] = useState<LobbyRoom[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const client = getColyseusClient();
      const response = await client.http.get<RoomAvailable<RoomMetadata>[]>(
        "/matchmake/love_letter"
      );
      const available = response.data || [];
      setRooms(
        available.map((r) => ({
          roomId: r.roomId,
          metadata: r.metadata as RoomMetadata,
          clients: r.clients,
        }))
      );
      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError("Failed to fetch rooms");
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    // Poll for updates every 3 seconds
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { rooms, isConnected, error, refresh };
}
