import { getColyseusClient, getGameToken } from "@/shared/lib/colyseus";
import type { Room, RoomAvailable } from "colyseus.js";
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

  const response = await client.http.get<RoomAvailable<RoomMetadata>[]>(
    "/matchmake/love_letter"
  );
  const rooms = response.data || [];
  const room = rooms.find((r) => r.metadata?.roomCode === code.toUpperCase());

  if (!room) {
    throw new Error("해당 코드의 방을 찾을 수 없습니다");
  }

  return client.joinById(room.roomId, { token, password });
}

export async function joinMatchmaking(gameId: string): Promise<Room> {
  const client = getColyseusClient();
  const token = await getGameToken();
  return client.joinOrCreate(gameId, { token, matchmaking: true });
}

export async function getAvailableRooms() {
  const client = getColyseusClient();
  const response = await client.http.get<RoomAvailable<RoomMetadata>[]>(
    "/matchmake/love_letter"
  );
  const rooms = response.data || [];

  return rooms.map((r) => ({
    roomId: r.roomId,
    metadata: r.metadata as RoomMetadata,
    clients: r.clients,
  }));
}
