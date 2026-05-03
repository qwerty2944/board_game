import { Room, Client } from "colyseus";
import { BaseGameState, PlayerSchema } from "../state/BaseGameState.js";
import { verifyGameToken, type VerifiedUser } from "../auth/verify.js";
import {
  ROOM_CODE_CHARS,
  ROOM_CODE_LENGTH,
  RECONNECT_TIMEOUT_MS,
  MessageType,
  ROOM_CLOSE_CODES,
  type RoomCreateOptions,
  type RoomMetadata,
} from "@board-game/shared";

export abstract class BaseGameRoom<TState extends BaseGameState> extends Room<TState> {
  private password?: string;
  private reconnectTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
  private userToSession = new Map<string, string>(); // userId -> sessionId
  private isClosingAfterPlayerLeft = false;

  async onCreate(options: RoomCreateOptions) {
    const state = this.createState();
    this.setState(state);

    state.gameId = options.gameId;
    state.maxPlayers = options.maxPlayers;
    state.roomCode = this.generateRoomCode();

    if (options.password) {
      this.password = options.password;
    }

    // Set metadata for lobby
    await this.setMetadata({
      gameId: options.gameId,
      roomCode: state.roomCode,
      hostName: options.hostName,
      isPrivate: options.isPrivate,
      maxPlayers: options.maxPlayers,
      currentPlayers: 0,
      hasPassword: !!options.password,
      status: "waiting",
    } satisfies RoomMetadata);

    // Set visibility
    if (options.isPrivate) {
      await this.setPrivate(true);
    }

    this.maxClients = options.maxPlayers;

    // Register common message handlers
    this.registerCommonMessages();

    // Let subclass register game-specific messages
    this.registerGameMessages();
  }

  abstract createState(): TState;
  abstract registerGameMessages(): void;
  abstract startGame(): void;
  abstract canStart(): boolean;
  abstract handlePlayerDisconnect(sessionId: string): void;
  protected onGameInterrupted(): void {}

  async onAuth(client: Client, options: { token?: string; password?: string }) {
    // Verify game JWT
    if (!options.token) {
      throw new Error("Authentication token required");
    }

    const user = await verifyGameToken(options.token);

    // Check password if set
    if (this.password && options.password !== this.password) {
      throw new Error("Incorrect room password");
    }

    return user;
  }

  async onJoin(client: Client, options: any, auth: VerifiedUser) {
    // Remove previous session for the same user (prevents duplicates)
    const prevSessionId = this.userToSession.get(auth.id);
    if (prevSessionId && prevSessionId !== client.sessionId) {
      const wasHost = this.state.hostSessionId === prevSessionId;
      this.state.players.delete(prevSessionId);

      // Kick the old client connection
      const oldClient = this.clients.find((c) => c.sessionId === prevSessionId);
      if (oldClient) {
        oldClient.leave(ROOM_CLOSE_CODES.SESSION_REPLACED); // Silent replace
      }

      // Preserve host status for the new session
      if (wasHost) {
        this.state.hostSessionId = client.sessionId;
      }
    }

    // Cancel reconnect timeout if this is a reconnection
    const existingTimeout = this.reconnectTimeouts.get(auth.id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.reconnectTimeouts.delete(auth.id);
    }

    const player = new PlayerSchema();
    player.sessionId = client.sessionId;
    player.name = auth.name;
    player.image = auth.image || "";
    player.userId = auth.id;
    player.isConnected = true;

    this.state.players.set(client.sessionId, player);
    this.userToSession.set(auth.id, client.sessionId);

    // First player is host
    if (!this.state.hostSessionId || !this.state.players.has(this.state.hostSessionId)) {
      this.state.hostSessionId = client.sessionId;
    }

    // Update metadata
    await this.updatePlayerCount();
    this.updateReadinessPhase();

    this.broadcast(MessageType.PLAYER_JOINED, {
      sessionId: client.sessionId,
      name: auth.name,
    });
  }

  async onLeave(client: Client, consented: boolean) {
    if (this.isClosingAfterPlayerLeft) return;

    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    player.isConnected = false;

    if (this.isGameInProgress()) {
      await this.closeAfterPlayerLeftDuringGame();
      return;
    }

    if (consented) {
      // Player deliberately left
      await this.removePlayer(client.sessionId);
    } else {
      // Connection lost - allow reconnection
      try {
        await this.allowReconnection(client, RECONNECT_TIMEOUT_MS / 1000);
        // Player reconnected
        player.isConnected = true;
      } catch {
        // Timeout expired, remove player
        await this.removePlayer(client.sessionId);
        this.handlePlayerDisconnect(client.sessionId);
      }
    }
  }

  private async removePlayer(sessionId: string) {
    const player = this.state.players.get(sessionId);
    if (player) {
      this.userToSession.delete(player.userId);
    }

    this.state.players.delete(sessionId);
    await this.updatePlayerCount();

    // Reassign host if host left
    if (this.state.hostSessionId === sessionId) {
      const remaining = Array.from(this.state.players.keys());
      if (remaining.length > 0) {
        this.state.hostSessionId = remaining[0];
      }
    }
    this.updateReadinessPhase();

    this.broadcast(MessageType.PLAYER_LEFT, { sessionId });

    // Close room if empty
    if (this.state.players.size === 0) {
      this.disconnect();
    }
  }

  private registerCommonMessages() {
    this.onMessage(MessageType.CHAT, (client, message: { text: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || !message.text) return;

      const chatData = {
        sender: player.name,
        text: message.text.slice(0, 500),
        timestamp: Date.now(),
      };

      this.broadcast(MessageType.CHAT, chatData);
    });

    this.onMessage(MessageType.READY, (client, message: { ready: boolean }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      if (this.state.phase !== "waiting" && this.state.phase !== "ready") return;

      player.isReady = message.ready;
      this.updateReadinessPhase();
    });

    this.onMessage(MessageType.START_GAME, (client) => {
      // Only host can start
      if (client.sessionId !== this.state.hostSessionId) return;
      if (!this.canStart()) return;

      this.state.phase = "playing";
      this.updateMetadataStatus("playing");
      this.startGame();
    });

    this.onMessage(MessageType.KICK_PLAYER, (client, message: { targetSessionId: string }) => {
      if (client.sessionId !== this.state.hostSessionId) return;
      if (this.state.phase !== "waiting" && this.state.phase !== "ready") return;

      const targetClient = this.clients.find(
        (c) => c.sessionId === message.targetSessionId
      );
      if (targetClient) {
        targetClient.leave(ROOM_CLOSE_CODES.KICKED);
      }
    });
  }

  private generateRoomCode(): string {
    let code = "";
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
    }
    return code;
  }

  private async updatePlayerCount() {
    const metadata = this.metadata as RoomMetadata;
    if (metadata) {
      await this.setMetadata({
        ...metadata,
        currentPlayers: this.state.players.size,
      });
    }
  }

  protected updateMetadataStatus(status: "waiting" | "playing" | "finished") {
    const metadata = this.metadata as RoomMetadata;
    if (metadata) {
      void this.setMetadata({
        ...metadata,
        status,
      });
    }
  }

  private updateReadinessPhase() {
    if (this.state.phase !== "waiting" && this.state.phase !== "ready") return;
    this.state.phase = this.canStart() ? "ready" : "waiting";
  }

  private isGameInProgress() {
    return this.state.phase !== "waiting" &&
      this.state.phase !== "ready" &&
      this.state.phase !== "game_over";
  }

  private async closeAfterPlayerLeftDuringGame() {
    this.isClosingAfterPlayerLeft = true;
    this.state.phase = "game_over";
    this.updateMetadataStatus("finished");
    this.onGameInterrupted();

    for (const roomClient of [...this.clients]) {
      roomClient.leave(ROOM_CLOSE_CODES.PLAYER_LEFT_DURING_GAME);
    }

    await this.disconnect();
  }
}
