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

    const $ = getStateCallbacks(room) as any;
    if (!$) return;

    const $state = $(room.state);

    // Base state fields
    $state.listen("phase", (value: string) => {
      store.getState().setPhase(value);
    });

    $state.listen("roomCode", (value: string) => {
      store.getState().setRoomCode(value);
    });

    $state.listen("hostSessionId", (value: string) => {
      store.getState().setHostSessionId(value);
    });

    // Love Letter specific fields
    $state.listen("currentTurnSessionId", (value: string) => {
      store.getState().setCurrentTurn(value);
    });

    $state.listen("deckRemaining", (value: number) => {
      store.getState().setDeckRemaining(value);
    });

    $state.listen("pendingActionType", (value: string) => {
      const cardValue = room.state.pendingCardValue ?? -1;
      store.getState().setPendingAction(value, cardValue);
    });

    $state.listen("sycophantTarget", (value: string) => {
      store.getState().setSycophantTarget(value);
    });

    $state.listen("lastPlayedCardName", (value: string) => {
      const cardValue = room.state.lastPlayedCardValue ?? -1;
      store.getState().setLastPlayedCard(value, cardValue);
    });

    $state.listen("roundWinner", (value: string) => {
      store.getState().setRoundWinner(value);
    });

    $state.listen("gameWinner", (value: string) => {
      store.getState().setGameWinner(value);
    });

    // Base players (used during waiting/lobby phase)
    $state.players?.onAdd((player: any, sessionId: string) => {
      syncBasePlayer(sessionId, player);
      const $player = $(player);
      $player.listen("name", () => syncBasePlayer(sessionId, player));
      $player.listen("isReady", () => syncBasePlayer(sessionId, player));
      $player.listen("isConnected", () => syncBasePlayer(sessionId, player));
    });

    $state.players?.onRemove((_player: any, sessionId: string) => {
      const players = new Map(store.getState().players);
      players.delete(sessionId);
      store.getState().setPlayers(players);
    });

    // Love Letter players (used during playing phase)
    $state.llPlayers?.onAdd((player: any, sessionId: string) => {
      const $player = $(player);
      syncLLPlayer(sessionId, player);
      $player.listen("isAlive", () => syncLLPlayer(sessionId, player));
      $player.listen("isProtected", () => syncLLPlayer(sessionId, player));
      $player.listen("tokens", () => syncLLPlayer(sessionId, player));
      $player.listen("handCount", () => syncLLPlayer(sessionId, player));
      $player.hand?.onAdd(() => syncLLPlayer(sessionId, player));
      $player.hand?.onRemove(() => syncLLPlayer(sessionId, player));
      $player.discardedCards?.onAdd(() => syncLLPlayer(sessionId, player));
    });

    $state.llPlayers?.onRemove((_player: any, sessionId: string) => {
      const players = new Map(store.getState().players);
      players.delete(sessionId);
      store.getState().setPlayers(players);
    });

    $state.faceUpRemoved?.onAdd(() => {
      syncFaceUpRemoved(room);
    });

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
