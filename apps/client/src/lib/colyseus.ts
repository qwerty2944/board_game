import { Client } from "colyseus.js";

const COLYSEUS_URL =
  process.env.NEXT_PUBLIC_COLYSEUS_URL || "ws://localhost:2567";

let clientInstance: Client | null = null;

export function getColyseusClient(): Client {
  if (!clientInstance) {
    clientInstance = new Client(COLYSEUS_URL);
  }
  return clientInstance;
}

export async function getGameToken(): Promise<string> {
  const response = await fetch("/api/game-token", { method: "POST" });
  if (!response.ok) {
    throw new Error("Failed to get game token");
  }
  const { token } = await response.json();
  return token;
}
