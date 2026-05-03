import type { Room } from "colyseus.js";
import { Client } from "colyseus.js";
import { env } from "@/shared/config/env";
import { api } from "@/shared/api/axios";

let clientInstance: Client | null = null;

export function getColyseusClient(): Client {
  if (!clientInstance) {
    clientInstance = new Client(env.colyseusUrl);
  }
  return clientInstance;
}

export async function getGameToken(): Promise<string> {
  const { data } = await api.post<{ token: string }>("/game-token");
  return data.token;
}

// Pending room: stored after create/join in lobby, consumed in RoomView
let pendingRoom: Room | null = null;

export function setPendingRoom(room: Room) {
  pendingRoom = room;
}

export function takePendingRoom(expectedRoomId: string): Room | null {
  if (pendingRoom && pendingRoom.roomId === expectedRoomId) {
    const room = pendingRoom;
    pendingRoom = null;
    return room;
  }
  pendingRoom = null;
  return null;
}
