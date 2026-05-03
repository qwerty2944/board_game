import {
  TOKENS_TO_WIN,
  PRINCESS_BEATS_BISHOP_AT_ROUND_END,
  type LoveLetterCard,
  type LoveLetterPhase,
} from "@board-game/shared";
import { GameEngine, type GameEvent, type PlayerInfo } from "../engine.js";
import { setupDeck, type DeckSetup } from "./deck.js";
import { resolveCardEffect } from "./cards.js";
import {
  mustDiscardCountess,
  getPlayableCards,
  getValidTargets,
  cardRequiresTarget,
  allOthersProtected,
  isValidGuardGuess,
} from "./validation.js";

export interface LoveLetterPlayer {
  sessionId: string;
  name: string;
  hand: number[]; // card instance IDs
  discardPile: number[]; // card instance IDs
  isAlive: boolean;
  isProtected: boolean;
  tokens: number;
}

export interface LoveLetterGameState {
  phase: LoveLetterPhase;
  players: Map<string, LoveLetterPlayer>;
  turnOrder: string[];
  currentTurnIndex: number;
  deck: number[]; // card instance IDs remaining in deck
  faceDownRemoved: number | null; // card instance removed face-down
  faceUpRemoved: number[]; // card instance IDs removed face-up (2-player)
  currentRound: number;
  tokensToWin: number;
  useExtendedDeck: boolean;
  // Card lookups (card instance ID -> value/name)
  cardValues: Map<number, number>;
  cardNames: Map<number, string>;
  // Extended card state
  sycophantTarget?: string;
  jesterTarget?: { jesterId: string; targetId: string };
  // Pending action state
  pendingAction?: {
    type: "awaiting_target" | "awaiting_effect_choice";
    actorId: string;
    cardValue: number;
    cardId: number;
  };
}

export type LoveLetterAction =
  | { type: "play_card"; cardId: number }
  | {
      type: "select_target";
      targetSessionId?: string;
      guessedValue?: number;
      selectedPlayerIds?: string[];
      optionalDraw?: boolean;
    };

export class LoveLetterEngine extends GameEngine<LoveLetterGameState, LoveLetterAction> {
  private events: GameEvent[] = [];
  private allCards: Map<number, LoveLetterCard> = new Map();

  initialize(players: PlayerInfo[]): LoveLetterGameState {
    const playerCount = players.length;
    const useExtended = playerCount >= 5;
    const tokensToWin = TOKENS_TO_WIN[playerCount] ?? 4;

    const state: LoveLetterGameState = {
      phase: "playing",
      players: new Map(),
      turnOrder: players.map((p) => p.sessionId),
      currentTurnIndex: 0,
      deck: [],
      faceDownRemoved: null,
      faceUpRemoved: [],
      currentRound: 1,
      tokensToWin,
      useExtendedDeck: useExtended,
      cardValues: new Map(),
      cardNames: new Map(),
    };

    // Initialize players
    for (const p of players) {
      state.players.set(p.sessionId, {
        sessionId: p.sessionId,
        name: p.name,
        hand: [],
        discardPile: [],
        isAlive: true,
        isProtected: false,
        tokens: 0,
      });
    }

    return this.startNewRound(state);
  }

  startNewRound(state: LoveLetterGameState): LoveLetterGameState {
    const playerCount = state.players.size;
    const deckSetup = setupDeck(playerCount);

    // Build card lookup maps
    const allCards = new Map<number, LoveLetterCard>();
    const cardValues = new Map<number, number>();
    const cardNames = new Map<number, string>();

    const registerCards = (cards: LoveLetterCard[]) => {
      for (const card of cards) {
        allCards.set(card.id, card);
        cardValues.set(card.id, card.value);
        cardNames.set(card.id, card.name);
      }
    };

    // Register all cards from deck setup
    registerCards(deckSetup.deck);
    registerCards([deckSetup.faceDownRemoved]);
    registerCards(deckSetup.faceUpRemoved);

    this.allCards = allCards;

    const newState: LoveLetterGameState = {
      ...state,
      phase: "playing",
      deck: deckSetup.deck.map((c) => c.id),
      faceDownRemoved: deckSetup.faceDownRemoved.id,
      faceUpRemoved: deckSetup.faceUpRemoved.map((c) => c.id),
      cardValues,
      cardNames,
      sycophantTarget: undefined,
      jesterTarget: undefined,
      pendingAction: undefined,
    };

    // Reset players for new round
    for (const [, player] of newState.players) {
      player.hand = [];
      player.discardPile = [];
      player.isAlive = true;
      player.isProtected = false;
    }

    // Deal 1 card to each player
    for (const sessionId of newState.turnOrder) {
      const player = newState.players.get(sessionId)!;
      if (newState.deck.length > 0) {
        player.hand.push(newState.deck.pop()!);
      }
    }

    // Draw card for first player (they start with 2 cards)
    const firstPlayer = newState.players.get(newState.turnOrder[newState.currentTurnIndex])!;
    if (newState.deck.length > 0) {
      firstPlayer.hand.push(newState.deck.pop()!);
    }

    this.events.push({
      type: "round_started",
      payload: {
        round: newState.currentRound,
        faceUpRemoved: newState.faceUpRemoved,
      },
    });

    return newState;
  }

  processAction(state: LoveLetterGameState, action: LoveLetterAction): LoveLetterGameState {
    this.events = [];

    if (action.type === "play_card") {
      return this.handlePlayCard(state, action.cardId);
    } else if (action.type === "select_target") {
      return this.handleSelectTarget(state, action);
    }

    return state;
  }

  private handlePlayCard(state: LoveLetterGameState, cardId: number): LoveLetterGameState {
    const currentSessionId = state.turnOrder[state.currentTurnIndex];
    const player = state.players.get(currentSessionId);
    if (!player || !player.isAlive) return state;

    // Validate card is in hand
    const cardIndex = player.hand.indexOf(cardId);
    if (cardIndex === -1) return state;

    const cardValue = state.cardValues.get(cardId);
    if (cardValue === undefined) return state;

    // Check Countess constraint
    const handValues = player.hand.map((id) => state.cardValues.get(id) ?? 0);
    if (mustDiscardCountess(handValues) && cardValue !== 7) {
      return state; // Must play Countess
    }

    // Remove card from hand and add to discard
    const newState: LoveLetterGameState = {
      ...state,
      players: new Map(state.players),
    };
    const newPlayer: LoveLetterPlayer = {
      ...player,
      hand: [...player.hand],
      discardPile: [...player.discardPile],
    };
    newPlayer.hand.splice(cardIndex, 1);
    newPlayer.discardPile.push(cardId);
    newState.players.set(currentSessionId, newPlayer);

    this.events.push({
      type: "card_played",
      payload: { player: currentSessionId, cardId, cardValue },
    });

    // Check if card requires target
    const needsTarget = cardRequiresTarget(cardValue);
    const validTargets = needsTarget
      ? getValidTargets(newState, currentSessionId, cardValue)
      : [];

    // Cards with no target or all others protected -> resolve immediately
    if (!needsTarget || (needsTarget && validTargets.length === 0)) {
      // Resolve with no target
      const result = resolveCardEffect(
        newState,
        currentSessionId,
        cardValue
      );
      return this.advanceTurn(result.state, result.events);
    }

    // Prince can target self even when others available
    // Needs target selection
    newState.phase = "awaiting_target";
    newState.pendingAction = {
      type: "awaiting_target",
      actorId: currentSessionId,
      cardValue,
      cardId,
    };

    return newState;
  }

  private handleSelectTarget(
    state: LoveLetterGameState,
    action: Omit<LoveLetterAction & { type: "select_target" }, "type"> & { type: "select_target" }
  ): LoveLetterGameState {
    if (!state.pendingAction) return state;

    const { actorId, cardValue } = state.pendingAction;

    // Clear pending action
    const newState: LoveLetterGameState = {
      ...state,
      pendingAction: undefined,
      phase: "playing",
    };

    const result = resolveCardEffect(
      newState,
      actorId,
      cardValue,
      action.targetSessionId,
      action.guessedValue,
      action.selectedPlayerIds,
      action.optionalDraw
    );

    return this.advanceTurn(result.state, result.events);
  }

  private advanceTurn(state: LoveLetterGameState, additionalEvents: GameEvent[]): LoveLetterGameState {
    this.events.push(...additionalEvents);

    // Check round end conditions
    const alivePlayers = Array.from(state.players.values()).filter((p) => p.isAlive);

    if (alivePlayers.length === 1) {
      // Last player standing wins the round
      return this.endRound(state, alivePlayers[0].sessionId, "last_standing");
    }

    if (state.deck.length === 0) {
      // Deck empty: compare hands
      return this.resolveRoundByComparison(state);
    }

    // Advance to next alive player
    let newState = { ...state, phase: "playing" as const };
    let nextIndex = (state.currentTurnIndex + 1) % state.turnOrder.length;

    // Find next alive player
    let safety = 0;
    while (safety < state.turnOrder.length) {
      const nextPlayer = state.players.get(state.turnOrder[nextIndex]);
      if (nextPlayer && nextPlayer.isAlive) break;
      nextIndex = (nextIndex + 1) % state.turnOrder.length;
      safety++;
    }

    newState.currentTurnIndex = nextIndex;

    // Remove protection from the player whose turn it now is
    const currentPlayer = newState.players.get(newState.turnOrder[nextIndex]);
    if (currentPlayer && currentPlayer.isProtected) {
      const updatedPlayers = new Map(newState.players);
      updatedPlayers.set(newState.turnOrder[nextIndex], {
        ...currentPlayer,
        isProtected: false,
      });
      newState.players = updatedPlayers;
    }

    // Draw a card for the current player
    if (newState.deck.length > 0) {
      const updatedPlayers = new Map(newState.players);
      const drawPlayer = updatedPlayers.get(newState.turnOrder[nextIndex])!;
      const newDrawPlayer = { ...drawPlayer, hand: [...drawPlayer.hand] };
      newDrawPlayer.hand.push(newState.deck[newState.deck.length - 1]);
      newState.deck = newState.deck.slice(0, -1);
      updatedPlayers.set(newState.turnOrder[nextIndex], newDrawPlayer);
      newState.players = updatedPlayers;
    }

    this.events.push({
      type: "turn_started",
      payload: { player: newState.turnOrder[nextIndex] },
    });

    return newState;
  }

  private resolveRoundByComparison(state: LoveLetterGameState): LoveLetterGameState {
    const alivePlayers = Array.from(state.players.values()).filter((p) => p.isAlive);

    // Calculate effective hand values (with Count bonus)
    const playerScores = alivePlayers.map((p) => {
      const handCardId = p.hand[0];
      let handValue = state.cardValues.get(handCardId) ?? 0;

      // Princess (8) beats Bishop (9) at round end comparison
      if (PRINCESS_BEATS_BISHOP_AT_ROUND_END && handValue === 8) {
        // Princess effectively has value 8 which is lower than 9,
        // but the rule says Princess beats Bishop, so treat as 9.5
        handValue = 9.5;
      }

      // Count bonus: +1 for each Count (value 5, name "Count Guntram") in discard pile
      const countBonus = p.discardPile.filter(
        (cardId) => state.cardNames.get(cardId) === "Count Guntram"
      ).length;

      const discardSum = p.discardPile.reduce(
        (sum, cardId) => sum + (state.cardValues.get(cardId) ?? 0),
        0
      );

      return {
        sessionId: p.sessionId,
        handValue: handValue + countBonus,
        countBonus,
        discardSum,
        rawHandValue: state.cardValues.get(handCardId) ?? 0,
      };
    });

    // Sort by hand value (desc), then discard sum (desc)
    playerScores.sort((a, b) => {
      if (b.handValue !== a.handValue) return b.handValue - a.handValue;
      return b.discardSum - a.discardSum;
    });

    const highest = playerScores[0];
    // Check for ties (same hand value AND same discard sum = all tied are winners)
    const winners = playerScores.filter(
      (p) => p.handValue === highest.handValue && p.discardSum === highest.discardSum
    );

    if (winners.length === 1) {
      return this.endRound(state, winners[0].sessionId, "highest_card");
    }

    // Multiple winners (tie)
    let newState = { ...state };
    for (const winner of winners) {
      newState = this.awardToken(newState, winner.sessionId);
    }

    this.events.push({
      type: "round_end_comparison",
      payload: {
        scores: playerScores,
        winners: winners.map((w) => w.sessionId),
      },
    });

    return this.checkGameOver(newState);
  }

  private endRound(
    state: LoveLetterGameState,
    winnerId: string,
    reason: string
  ): LoveLetterGameState {
    let newState = this.awardToken(state, winnerId);

    // Check Jester bonus
    if (state.jesterTarget && state.jesterTarget.targetId === winnerId) {
      newState = this.awardToken(newState, state.jesterTarget.jesterId);
      this.events.push({
        type: "jester_bonus",
        payload: {
          jester: state.jesterTarget.jesterId,
          winner: winnerId,
        },
      });
    }

    this.events.push({
      type: "round_ended",
      payload: { winner: winnerId, reason },
    });

    return this.checkGameOver(newState);
  }

  private awardToken(state: LoveLetterGameState, playerId: string): LoveLetterGameState {
    const players = new Map(state.players);
    const player = players.get(playerId);
    if (player) {
      players.set(playerId, { ...player, tokens: player.tokens + 1 });
    }
    return { ...state, players };
  }

  private checkGameOver(state: LoveLetterGameState): LoveLetterGameState {
    // Check if any player has enough tokens to win
    for (const [sessionId, player] of state.players) {
      if (player.tokens >= state.tokensToWin) {
        this.events.push({
          type: "game_over",
          payload: { winner: sessionId, tokens: player.tokens },
        });
        return { ...state, phase: "game_over" };
      }
    }

    // Start new round
    const newState = {
      ...state,
      currentRound: state.currentRound + 1,
      phase: "round_end" as const,
    };

    return newState;
  }

  /**
   * Called to actually begin the next round (after round_end phase)
   */
  beginNextRound(state: LoveLetterGameState): LoveLetterGameState {
    this.events = [];
    // Rotate starting player (winner starts, or next in order)
    return this.startNewRound(state);
  }

  getEvents(): GameEvent[] {
    return [...this.events];
  }

  isGameOver(state: LoveLetterGameState): boolean {
    return state.phase === "game_over";
  }

  getWinner(state: LoveLetterGameState): string | null {
    if (state.phase !== "game_over") return null;
    for (const [sessionId, player] of state.players) {
      if (player.tokens >= state.tokensToWin) {
        return sessionId;
      }
    }
    return null;
  }

  getValidActions(state: LoveLetterGameState, playerId: string): LoveLetterAction[] {
    if (state.phase === "awaiting_target" && state.pendingAction?.actorId === playerId) {
      // Return possible target selections
      return []; // Complex - handled by UI
    }

    if (state.phase !== "playing") return [];

    const currentSessionId = state.turnOrder[state.currentTurnIndex];
    if (currentSessionId !== playerId) return [];

    const player = state.players.get(playerId);
    if (!player || !player.isAlive) return [];

    const playableValues = getPlayableCards(
      player.hand.map((id) => state.cardValues.get(id) ?? 0)
    );

    return player.hand
      .filter((cardId) => playableValues.includes(state.cardValues.get(cardId) ?? 0))
      .map((cardId) => ({ type: "play_card" as const, cardId }));
  }

  getCardInfo(cardId: number): LoveLetterCard | undefined {
    return this.allCards.get(cardId);
  }
}
