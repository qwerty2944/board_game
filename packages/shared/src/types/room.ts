export interface RoomCreateOptions {
  gameId: string;
  hostName: string;
  isPrivate: boolean;
  maxPlayers: number;
  password?: string;
}

export interface RoomMetadata {
  gameId: string;
  roomCode: string;
  hostName: string;
  isPrivate: boolean;
  maxPlayers: number;
  currentPlayers: number;
  hasPassword: boolean;
  status: RoomStatus;
}

export type RoomStatus = "waiting" | "playing" | "finished";

export type GamePhase = "waiting" | "ready" | "playing" | "round_end" | "game_over";
