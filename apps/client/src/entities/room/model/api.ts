import { getColyseusClient, getGameToken } from "@/shared/lib/colyseus";
import { env } from "@/shared/config/env";
import type { Room } from "colyseus.js";
import type { RoomCreateOptions, RoomMetadata } from "@board-game/shared";

export async function createRoom(options: RoomCreateOptions): Promise<Room> {
  const client = getColyseusClient();
  const token = await getGameToken();
  return client.create(options.gameId, { ...options, token });
}

export async function joinRoomById(roomId: string, password?: string): Promise<Room> {
  const client = getColyseusClient();
  const token = await getGameToken();
  return client.joinById(roomId, { token, password });
}

export async function joinByCode(code: string, password?: string): Promise<Room> {
  const client = getColyseusClient();
  const token = await getGameToken();

  const available = await getAvailableRooms();
  const found = available.find((r) => r.metadata?.roomCode === code.toUpperCase());

  if (!found) {
    throw new Error("해당 코드의 방을 찾을 수 없습니다");
  }

  return client.joinById(found.roomId, { token, password });
}

export async function joinMatchmaking(gameId: string): Promise<Room> {
  const client = getColyseusClient();
  const token = await getGameToken();
  return client.joinOrCreate(gameId, { token, matchmaking: true });
}

interface AvailableRoom {
  roomId: string;
  metadata: RoomMetadata;
  clients: number;
}

export async function getAvailableRooms(): Promise<AvailableRoom[]> {
  const baseUrl = env.colyseusUrl.replace(/^ws/, "http");
  const res = await fetch(`${baseUrl}/api/rooms`);
  if (!res.ok) return [];
  const rooms = await res.json();

  return rooms.map((r: any) => ({
    roomId: r.roomId,
    metadata: r.metadata as RoomMetadata,
    clients: r.clients,
  }));
}
