import { Client } from "colyseus";
import { BaseGameRoom } from "./BaseGameRoom.js";
import { LoveLetterState } from "../state/love-letter/LoveLetterState.js";
import { LoveLetterPlayerState } from "../state/love-letter/PlayerState.js";
import { CardState } from "../state/love-letter/CardState.js";
import {
  LoveLetterEngine,
  type LoveLetterGameState,
  type LoveLetterPlayer,
} from "@board-game/game-logic";
import {
  MessageType,
  TOKENS_TO_WIN,
  AUTO_PLAY_TIMEOUT_MS,
  type PlayCardMessage,
  type SelectTargetMessage,
  type LoveLetterCard,
} from "@board-game/shared";
import { ArraySchema } from "@colyseus/schema";

export class LoveLetterRoom extends BaseGameRoom<LoveLetterState> {
  private engine = new LoveLetterEngine();
  private gameState: LoveLetterGameState | null = null;
  private autoPlayTimeout: ReturnType<typeof setTimeout> | null = null;

  createState(): LoveLetterState {
    return new LoveLetterState();
  }

  registerGameMessages(): void {
    this.onMessage(MessageType.PLAY_CARD, (client, message: PlayCardMessage) => {
      this.handlePlayCard(client, message);
    });

    this.onMessage(MessageType.SELECT_TARGET, (client, message: SelectTargetMessage) => {
      this.handleSelectTarget(client, message);
    });

    this.onMessage("next_round", (client) => {
      if (client.sessionId !== this.state.hostSessionId) return;
      if (this.state.phase !== "round_end") return;
      this.startNextRound();
    });
  }

  canStart(): boolean {
    const playerCount = this.state.players.size;
    if (playerCount < 2 || playerCount > 8) return false;

    // All players must be ready (except host)
    for (const [sessionId, player] of this.state.players) {
      if (sessionId === this.state.hostSessionId) continue;
      if (!player.isReady) return false;
    }

    return true;
  }

  startGame(): void {
    const players = Array.from(this.state.players.entries()).map(([sessionId, player]) => ({
      sessionId,
      name: player.name,
    }));

    const playerCount = players.length;
    this.state.tokensToWin = TOKENS_TO_WIN[playerCount] ?? 4;
    this.state.currentRound = 1;

    this.gameState = this.engine.initialize(players);
    this.syncStateToSchema();
    this.startAutoPlayTimer();
  }

  handlePlayerDisconnect(sessionId: string): void {
    if (!this.gameState) return;

    const player = this.gameState.players.get(sessionId);
    if (player) {
      player.isAlive = false;
      this.syncStateToSchema();
      this.checkAndAdvance();
    }
  }

  protected onGameInterrupted(): void {
    this.clearAutoPlayTimer();
    this.gameState = null;
  }

  private handlePlayCard(client: Client, message: PlayCardMessage): void {
    if (!this.gameState) return;
    if (this.gameState.phase !== "playing") return;

    const currentSessionId = this.gameState.turnOrder[this.gameState.currentTurnIndex];
    if (client.sessionId !== currentSessionId) return;

    this.clearAutoPlayTimer();

    this.gameState = this.engine.processAction(this.gameState, {
      type: "play_card",
      cardId: message.cardId,
    });

    const events = this.engine.getEvents();
    this.broadcastEvents(events);
    this.syncStateToSchema();
    this.checkAndAdvance();
  }

  private handleSelectTarget(client: Client, message: SelectTargetMessage): void {
    if (!this.gameState) return;
    if (!this.gameState.pendingAction) return;
    if (client.sessionId !== this.gameState.pendingAction.actorId) return;

    this.gameState = this.engine.processAction(this.gameState, {
      type: "select_target",
      targetSessionId: message.targetSessionId,
      guessedValue: message.guessedValue,
      selectedPlayerIds: message.selectedPlayerIds,
      optionalDraw: message.optionalDraw,
    });

    const events = this.engine.getEvents();
    this.broadcastEvents(events);
    this.syncStateToSchema();
    this.checkAndAdvance();
  }

  private startNextRound(): void {
    if (!this.gameState) return;

    this.gameState = this.engine.beginNextRound(this.gameState);

    const events = this.engine.getEvents();
    this.broadcastEvents(events);
    this.syncStateToSchema();
    this.startAutoPlayTimer();
  }

  private checkAndAdvance(): void {
    if (!this.gameState) return;

    if (this.gameState.phase === "game_over") {
      this.state.phase = "game_over";
      const winner = this.engine.getWinner(this.gameState);
      if (winner) {
        this.state.gameWinner = winner;
      }
      this.updateMetadataStatus("finished");
      this.clearAutoPlayTimer();
    } else if (this.gameState.phase === "round_end") {
      this.state.phase = "round_end";
      this.clearAutoPlayTimer();
    } else if (this.gameState.phase === "awaiting_target") {
      this.startAutoPlayTimer();
    } else if (this.gameState.phase === "playing") {
      this.startAutoPlayTimer();
    }
  }

  private syncStateToSchema(): void {
    if (!this.gameState) return;

    // Update basic state
    this.state.currentRound = this.gameState.currentRound;
    this.state.deckRemaining = this.gameState.deck.length;
    this.state.currentTurnSessionId =
      this.gameState.turnOrder[this.gameState.currentTurnIndex] ?? "";
    this.state.phase = this.gameState.phase;
    this.state.sycophantTarget = this.gameState.sycophantTarget ?? "";

    // Pending action
    if (this.gameState.pendingAction) {
      this.state.pendingActionType = this.gameState.pendingAction.type;
      this.state.pendingCardValue = this.gameState.pendingAction.cardValue;
      this.state.pendingCardName =
        this.gameState.cardNames.get(this.gameState.pendingAction.cardId) ?? "";
    } else {
      this.state.pendingActionType = "";
      this.state.pendingCardValue = -1;
      this.state.pendingCardName = "";
    }

    // Face-up removed cards
    this.state.faceUpRemoved.clear();
    for (const cardId of this.gameState.faceUpRemoved) {
      const card = new CardState();
      card.id = cardId;
      card.value = this.gameState.cardValues.get(cardId) ?? 0;
      card.name = this.gameState.cardNames.get(cardId) ?? "";
      this.state.faceUpRemoved.push(card);
    }

    // Sync player states
    for (const [sessionId, enginePlayer] of this.gameState.players) {
      let schemaPlayer = this.state.llPlayers.get(sessionId);
      if (!schemaPlayer) {
        schemaPlayer = new LoveLetterPlayerState();
        schemaPlayer.sessionId = sessionId;
        this.state.llPlayers.set(sessionId, schemaPlayer);
      }

      schemaPlayer.name = enginePlayer.name;
      schemaPlayer.isAlive = enginePlayer.isAlive;
      schemaPlayer.isProtected = enginePlayer.isProtected;
      schemaPlayer.tokens = enginePlayer.tokens;
      schemaPlayer.handCount = enginePlayer.hand.length;

      // Discard pile (public)
      schemaPlayer.discardedCards.clear();
      for (const cardId of enginePlayer.discardPile) {
        const card = new CardState();
        card.id = cardId;
        card.value = this.gameState.cardValues.get(cardId) ?? 0;
        card.name = this.gameState.cardNames.get(cardId) ?? "";
        schemaPlayer.discardedCards.push(card);
      }

      // Hand (private - will be filtered via State Views)
      schemaPlayer.hand.clear();
      for (const cardId of enginePlayer.hand) {
        const card = new CardState();
        card.id = cardId;
        card.value = this.gameState.cardValues.get(cardId) ?? 0;
        card.name = this.gameState.cardNames.get(cardId) ?? "";
        schemaPlayer.hand.push(card);
      }
    }
  }

  private broadcastEvents(events: Array<{ type: string; payload: Record<string, unknown> }>): void {
    for (const event of events) {
      // Some events are private (priest_peek, baroness_peek)
      if (event.type === "priest_peek" || event.type === "baroness_peek") {
        const targetClient = this.clients.find(
          (c) => c.sessionId === (event.payload.actor as string)
        );
        if (targetClient) {
          targetClient.send("game_event", event);
        }
      } else {
        this.broadcast("game_event", event);
      }
    }
  }

  private startAutoPlayTimer(): void {
    this.clearAutoPlayTimer();

    this.autoPlayTimeout = setTimeout(() => {
      this.handleAutoPlay();
    }, AUTO_PLAY_TIMEOUT_MS);
  }

  private clearAutoPlayTimer(): void {
    if (this.autoPlayTimeout) {
      clearTimeout(this.autoPlayTimeout);
      this.autoPlayTimeout = null;
    }
  }

  private handleAutoPlay(): void {
    if (!this.gameState) return;

    if (this.gameState.phase === "awaiting_target") {
      // Auto-select: no target (card fizzles)
      this.gameState = this.engine.processAction(this.gameState, {
        type: "select_target",
      });
    } else if (this.gameState.phase === "playing") {
      // Auto-play: play first valid card
      const currentSessionId = this.gameState.turnOrder[this.gameState.currentTurnIndex];
      const actions = this.engine.getValidActions(this.gameState, currentSessionId);
      if (actions.length > 0) {
        this.gameState = this.engine.processAction(this.gameState, actions[0]);
      }
    }

    const events = this.engine.getEvents();
    this.broadcastEvents(events);
    this.syncStateToSchema();
    this.checkAndAdvance();
  }

  onDispose(): void {
    this.clearAutoPlayTimer();
  }
}
