"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Room } from "colyseus.js";
import { useGameStore, type CardInfo, type PlayerState } from "@/stores/gameStore";

/**
 * Hook that syncs Colyseus room state to Zustand game store.
 * Listens to state changes and updates the store reactively.
 */
export function useRoom(room: Room | null) {
  const roomRef = useRef<Room | null>(null);
  const store = useGameStore;

  useEffect(() => {
    if (!room) return;
    roomRef.current = room;

    // Set local session ID
    store.getState().setLocalSessionId(room.sessionId);

    // Listen to state changes
    room.state.listen("phase", (value: string) => {
      store.getState().setPhase(value);
    });

    room.state.listen("currentTurnSessionId", (value: string) => {
      store.getState().setCurrentTurn(value);
    });

    room.state.listen("deckRemaining", (value: number) => {
      store.getState().setDeckRemaining(value);
    });

    room.state.listen("pendingActionType", (value: string) => {
      const cardValue = room.state.pendingCardValue ?? -1;
      store.getState().setPendingAction(value, cardValue);
    });

    room.state.listen("sycophantTarget", (value: string) => {
      store.getState().setSycophantTarget(value);
    });

    room.state.listen("lastPlayedCardName", (value: string) => {
      const cardValue = room.state.lastPlayedCardValue ?? -1;
      store.getState().setLastPlayedCard(value, cardValue);
    });

    room.state.listen("roundWinner", (value: string) => {
      store.getState().setRoundWinner(value);
    });

    room.state.listen("gameWinner", (value: string) => {
      store.getState().setGameWinner(value);
    });

    // Listen for llPlayers changes
    room.state.llPlayers?.onAdd((player: any, sessionId: string) => {
      syncPlayer(sessionId, player);

      // Listen to player property changes
      player.listen("isAlive", () => syncPlayer(sessionId, player));
      player.listen("isProtected", () => syncPlayer(sessionId, player));
      player.listen("tokens", () => syncPlayer(sessionId, player));
      player.listen("handCount", () => syncPlayer(sessionId, player));

      player.hand?.onAdd(() => syncPlayer(sessionId, player));
      player.hand?.onRemove(() => syncPlayer(sessionId, player));
      player.discardedCards?.onAdd(() => syncPlayer(sessionId, player));
    });

    room.state.llPlayers?.onRemove((_player: any, sessionId: string) => {
      const players = new Map(store.getState().players);
      players.delete(sessionId);
      store.getState().setPlayers(players);
    });

    // Listen to face-up removed cards
    room.state.faceUpRemoved?.onAdd(() => {
      syncFaceUpRemoved(room);
    });

    // Listen for game events
    room.onMessage("game_event", (event: { type: string; payload: Record<string, unknown> }) => {
      store.getState().addGameEvent(event);
    });

    return () => {
      roomRef.current = null;
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

function syncPlayer(sessionId: string, player: any) {
  const store = useGameStore.getState();
  const players = new Map(store.players);

  const hand: CardInfo[] = [];
  if (player.hand) {
    for (let i = 0; i < player.hand.length; i++) {
      const card = player.hand[i];
      if (card) {
        hand.push({ id: card.id, value: card.value, name: card.name });
      }
    }
  }

  const discardedCards: CardInfo[] = [];
  if (player.discardedCards) {
    for (let i = 0; i < player.discardedCards.length; i++) {
      const card = player.discardedCards[i];
      if (card) {
        discardedCards.push({ id: card.id, value: card.value, name: card.name });
      }
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
  };

  players.set(sessionId, playerState);
  store.setPlayers(players);
}

function syncFaceUpRemoved(room: Room) {
  const cards: CardInfo[] = [];
  if (room.state.faceUpRemoved) {
    for (let i = 0; i < room.state.faceUpRemoved.length; i++) {
      const card = (room.state.faceUpRemoved as any)[i];
      if (card) {
        cards.push({ id: card.id, value: card.value, name: card.name });
      }
    }
  }
  useGameStore.getState().setFaceUpRemoved(cards);
}
