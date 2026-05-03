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
