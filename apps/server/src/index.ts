import { Server, LobbyRoom, matchMaker } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { monitor } from "@colyseus/monitor";
import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { LoveLetterRoom } from "./rooms/LoveLetterRoom.js";

const app = express();

app.use(cors());

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// List available rooms
app.get("/api/rooms", async (_req, res) => {
  try {
    const rooms = await matchMaker.query({ private: false, locked: false });
    const result = rooms.map((r) => ({
      roomId: r.roomId,
      metadata: r.metadata,
      clients: r.clients,
      maxClients: r.maxClients,
      name: r.name,
    }));
    res.json(result);
  } catch {
    res.json([]);
  }
});

// Colyseus monitor (development only)
if (config.isDev) {
  app.use("/monitor", monitor());
}

const server = new Server({
  transport: new WebSocketTransport({ server: app.listen(config.port) }),
});

// Register game rooms
server.define("love_letter", LoveLetterRoom);

// Lobby room for real-time room listing
server.define("lobby", LobbyRoom);

console.log(`[GameServer] Listening on port ${config.port}`);
console.log(`[GameServer] Environment: ${config.nodeEnv}`);
if (config.isDev) {
  console.log(`[GameServer] Monitor: http://localhost:${config.port}/monitor`);
}

export default server;
