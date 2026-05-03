import { Schema, MapSchema, type } from "@colyseus/schema";
import type { GamePhase } from "@board-game/shared";

export class PlayerSchema extends Schema {
  @type("string") sessionId: string = "";
  @type("string") name: string = "";
  @type("string") image: string = "";
  @type("string") userId: string = "";
  @type("boolean") isReady: boolean = false;
  @type("boolean") isConnected: boolean = true;
}

export class ChatMessageSchema extends Schema {
  @type("string") senderSessionId: string = "";
  @type("string") senderName: string = "";
  @type("string") text: string = "";
  @type("number") timestamp: number = 0;
}

export class BaseGameState extends Schema {
  @type("string") phase: string = "waiting"; // GamePhase
  @type("string") gameId: string = "";
  @type("string") roomCode: string = "";
  @type("string") hostSessionId: string = "";
  @type("number") maxPlayers: number = 8;
  @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
  @type(["string"]) chatMessages: string[] = []; // JSON serialized for simplicity
}
