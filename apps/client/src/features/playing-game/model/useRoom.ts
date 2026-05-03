"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Room } from "colyseus.js";
import { getStateCallbacks } from "colyseus.js";
import { useGameStore, type CardInfo, type PlayerState } from "@/entities/game/model/store";

export function useRoom(room: Room | null) {
  const roomRef = useRef<Room | null>(null);
  const store = useGameStore;

  useEffect(() => {
    if (!room) return;
    roomRef.current = room;

    store.getState().setLocalSessionId(room.sessionId);
    syncBaseState(room);

    const unsubscribers: Array<(() => void) | undefined> = [];
    const syncCurrentState = () => syncBaseState(room);
    room.onStateChange(syncCurrentState);
    unsubscribers.push(() => room.onStateChange.remove(syncCurrentState));

    const initialSyncTimers = [
      window.setTimeout(syncCurrentState, 0),
      window.setTimeout(syncCurrentState, 150),
      window.setTimeout(syncCurrentState, 500),
    ];
    unsubscribers.push(() => {
      initialSyncTimers.forEach((timer) => window.clearTimeout(timer));
    });

    const $ = getStateCallbacks(room) as any;
    if (!$) {
      return () => {
        roomRef.current = null;
        unsubscribers.forEach((unsubscribe) => unsubscribe?.());
      };
    }

    const $state = $(room.state);

    // Base state fields
    unsubscribers.push($state.listen("phase", (value: string) => {
      store.getState().setPhase(value);
    }));

    unsubscribers.push($state.listen("roomCode", (value: string) => {
      store.getState().setRoomCode(value);
    }));

    unsubscribers.push($state.listen("hostSessionId", (value: string) => {
      store.getState().setHostSessionId(value);
    }));

    // Love Letter specific fields
    unsubscribers.push($state.listen("currentTurnSessionId", (value: string) => {
      store.getState().setCurrentTurn(value);
    }));

    unsubscribers.push($state.listen("deckRemaining", (value: number) => {
      store.getState().setDeckRemaining(value);
    }));

    unsubscribers.push($state.listen("pendingActionType", (value: string) => {
      const cardValue = room.state.pendingCardValue ?? -1;
      const cardName = room.state.pendingCardName ?? "";
      store.getState().setPendingAction(value, cardValue, cardName);
    }));

    unsubscribers.push($state.listen("pendingCardValue", (value: number) => {
      store.getState().setPendingAction(
        room.state.pendingActionType || "",
        value ?? -1,
        room.state.pendingCardName ?? ""
      );
    }));

    unsubscribers.push($state.listen("pendingCardName", (value: string) => {
      store.getState().setPendingAction(
        room.state.pendingActionType || "",
        room.state.pendingCardValue ?? -1,
        value || ""
      );
    }));

    unsubscribers.push($state.listen("sycophantTarget", (value: string) => {
      store.getState().setSycophantTarget(value);
    }));

    unsubscribers.push($state.listen("lastPlayedCardName", (value: string) => {
      const cardValue = room.state.lastPlayedCardValue ?? -1;
      store.getState().setLastPlayedCard(value, cardValue);
    }));

    unsubscribers.push($state.listen("roundWinner", (value: string) => {
      store.getState().setRoundWinner(value);
    }));

    unsubscribers.push($state.listen("gameWinner", (value: string) => {
      store.getState().setGameWinner(value);
    }));

    // Base players (used during waiting/lobby phase)
    unsubscribers.push($state.players?.onAdd((player: any, sessionId: string) => {
      syncBasePlayer(sessionId, player);
      const $player = $(player);
      unsubscribers.push($player.listen("name", () => syncBasePlayer(sessionId, player)));
      unsubscribers.push($player.listen("isReady", () => syncBasePlayer(sessionId, player)));
      unsubscribers.push($player.listen("isConnected", () => syncBasePlayer(sessionId, player)));
    }));

    unsubscribers.push($state.players?.onRemove((_player: any, sessionId: string) => {
      // Don't remove if this sessionId was already replaced by the same user reconnecting
      // (the new session's onAdd fires before/after onRemove of old session)
      const currentPlayers = room.state.players as any;
      if (currentPlayers && currentPlayers.get && currentPlayers.get(sessionId)) return;

      const players = new Map(store.getState().players);
      players.delete(sessionId);
      store.getState().setPlayers(players);
    }));

    // Love Letter players (used during playing phase)
    unsubscribers.push($state.llPlayers?.onAdd((player: any, sessionId: string) => {
      const $player = $(player);
      syncLLPlayer(sessionId, player);
      unsubscribers.push($player.listen("isAlive", () => syncLLPlayer(sessionId, player)));
      unsubscribers.push($player.listen("isProtected", () => syncLLPlayer(sessionId, player)));
      unsubscribers.push($player.listen("tokens", () => syncLLPlayer(sessionId, player)));
      unsubscribers.push($player.listen("handCount", () => syncLLPlayer(sessionId, player)));
      unsubscribers.push($player.hand?.onAdd(() => syncLLPlayer(sessionId, player)));
      unsubscribers.push($player.hand?.onRemove(() => syncLLPlayer(sessionId, player)));
      unsubscribers.push($player.discardedCards?.onAdd(() => syncLLPlayer(sessionId, player)));
    }));

    unsubscribers.push($state.llPlayers?.onRemove((_player: any, sessionId: string) => {
      const players = new Map(store.getState().players);
      players.delete(sessionId);
      store.getState().setPlayers(players);
    }));

    unsubscribers.push($state.faceUpRemoved?.onAdd(() => {
      syncFaceUpRemoved(room);
    }));

    room.onMessage("game_event", (event: { type: string; payload: Record<string, unknown> }) => {
      store.getState().addGameEvent(event);
    });

    return () => {
      roomRef.current = null;
      unsubscribers.forEach((unsubscribe) => unsubscribe?.());
    };
  }, [room]);

  const sendMessage = useCallback(
    (type: string, data?: any) => {
      roomRef.current?.send(type, data);
    },
    []
  );

  return { sendMessage };
}

function syncBaseState(room: Room) {
  const store = useGameStore.getState();
  const state = room.state as any;
  if (!state) return;

  store.setPhase(state.phase || "waiting");
  store.setRoomCode(state.roomCode || "");
  store.setHostSessionId(state.hostSessionId || "");
  store.setCurrentTurn(state.currentTurnSessionId || "");
  store.setDeckRemaining(state.deckRemaining ?? 0);
  store.setPendingAction(
    state.pendingActionType || "",
    state.pendingCardValue ?? -1,
    state.pendingCardName || ""
  );
  store.setSycophantTarget(state.sycophantTarget || "");
  store.setLastPlayedCard(state.lastPlayedCardName || "", state.lastPlayedCardValue ?? -1);
  store.setRoundWinner(state.roundWinner || "");
  store.setGameWinner(state.gameWinner || "");

  // Build complete player map from server state (replaces any stale entries)
  const freshPlayers = new Map<string, PlayerState>();

  if (state.players) {
    state.players.forEach((player: any, sessionId: string) => {
      freshPlayers.set(sessionId, {
        sessionId,
        name: player.name || "",
        isAlive: true,
        isProtected: false,
        tokens: 0,
        handCount: 0,
        hand: [],
        discardedCards: [],
        isReady: player.isReady ?? false,
        isConnected: player.isConnected ?? true,
      });
    });
  }

  if (state.llPlayers) {
    state.llPlayers.forEach((player: any, sessionId: string) => {
      const hand: CardInfo[] = [];
      if (player.hand) {
        for (let i = 0; i < player.hand.length; i++) {
          const card = player.hand[i];
          if (card) hand.push({ id: card.id, value: card.value, name: card.name });
        }
      }
      const discardedCards: CardInfo[] = [];
      if (player.discardedCards) {
        for (let i = 0; i < player.discardedCards.length; i++) {
          const card = player.discardedCards[i];
          if (card) discardedCards.push({ id: card.id, value: card.value, name: card.name });
        }
      }
      freshPlayers.set(sessionId, {
        sessionId,
        name: player.name || "",
        isAlive: player.isAlive ?? true,
        isProtected: player.isProtected ?? false,
        tokens: player.tokens ?? 0,
        handCount: player.handCount ?? 0,
        hand,
        discardedCards,
        isReady: false,
        isConnected: true,
      });
    });
  }

  store.setPlayers(freshPlayers);
  syncFaceUpRemoved(room);
}

function syncBasePlayer(sessionId: string, player: any) {
  const store = useGameStore.getState();
  const players = new Map(store.players);

  const playerState: PlayerState = {
    sessionId,
    name: player.name || "",
    isAlive: true,
    isProtected: false,
    tokens: 0,
    handCount: 0,
    hand: [],
    discardedCards: [],
    isReady: player.isReady ?? false,
    isConnected: player.isConnected ?? true,
  };

  players.set(sessionId, playerState);
  store.setPlayers(players);
}

function syncLLPlayer(sessionId: string, player: any) {
  const store = useGameStore.getState();
  const players = new Map(store.players);

  const hand: CardInfo[] = [];
  if (player.hand) {
    for (let i = 0; i < player.hand.length; i++) {
      const card = player.hand[i];
      if (card) hand.push({ id: card.id, value: card.value, name: card.name });
    }
  }

  const discardedCards: CardInfo[] = [];
  if (player.discardedCards) {
    for (let i = 0; i < player.discardedCards.length; i++) {
      const card = player.discardedCards[i];
      if (card) discardedCards.push({ id: card.id, value: card.value, name: card.name });
    }
  }

  const playerState: PlayerState = {
    sessionId,
    name: player.name || "",
    isAlive: player.isAlive ?? true,
    isProtected: player.isProtected ?? false,
    tokens: player.tokens ?? 0,
    handCount: player.handCount ?? 0,
    hand,
    discardedCards,
    isReady: false,
    isConnected: true,
  };

  players.set(sessionId, playerState);
  store.setPlayers(players);
}

function syncFaceUpRemoved(room: Room) {
  const cards: CardInfo[] = [];
  if (room.state.faceUpRemoved) {
    for (let i = 0; i < room.state.faceUpRemoved.length; i++) {
      const card = (room.state.faceUpRemoved as any)[i];
      if (card) cards.push({ id: card.id, value: card.value, name: card.name });
    }
  }
  useGameStore.getState().setFaceUpRemoved(cards);
}
