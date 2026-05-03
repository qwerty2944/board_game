import { create } from "zustand";

export interface CardInfo {
  id: number;
  value: number;
  name: string;
}

export interface PlayerState {
  sessionId: string;
  name: string;
  isAlive: boolean;
  isProtected: boolean;
  tokens: number;
  handCount: number;
  hand: CardInfo[];
  discardedCards: CardInfo[];
  isReady: boolean;
  isConnected: boolean;
}

export interface GameState {
  phase: string;
  roomCode: string;
  hostSessionId: string;
  currentTurnSessionId: string;
  currentRound: number;
  deckRemaining: number;
  tokensToWin: number;
  players: Map<string, PlayerState>;
  faceUpRemoved: CardInfo[];
  pendingActionType: string;
  pendingCardValue: number;
  pendingCardName: string;
  sycophantTarget: string;
  localSessionId: string;
  lastPlayedCardName: string;
  lastPlayedCardValue: number;
  roundWinner: string;
  gameWinner: string;
  gameEvents: Array<{ type: string; payload: Record<string, unknown> }>;
}

interface GameStore extends GameState {
  setPhase: (phase: string) => void;
  setRoomCode: (code: string) => void;
  setHostSessionId: (id: string) => void;
  setCurrentTurn: (sessionId: string) => void;
  setPlayers: (players: Map<string, PlayerState>) => void;
  updatePlayer: (sessionId: string, update: Partial<PlayerState>) => void;
  setLocalSessionId: (sessionId: string) => void;
  setDeckRemaining: (count: number) => void;
  setFaceUpRemoved: (cards: CardInfo[]) => void;
  setPendingAction: (type: string, cardValue: number, cardName?: string) => void;
  setSycophantTarget: (target: string) => void;
  addGameEvent: (event: { type: string; payload: Record<string, unknown> }) => void;
  setRoundWinner: (winner: string) => void;
  setGameWinner: (winner: string) => void;
  setLastPlayedCard: (name: string, value: number) => void;
  reset: () => void;
}

const initialState: GameState = {
  phase: "waiting",
  roomCode: "",
  hostSessionId: "",
  currentTurnSessionId: "",
  currentRound: 0,
  deckRemaining: 0,
  tokensToWin: 4,
  players: new Map(),
  faceUpRemoved: [],
  pendingActionType: "",
  pendingCardValue: -1,
  pendingCardName: "",
  sycophantTarget: "",
  localSessionId: "",
  lastPlayedCardName: "",
  lastPlayedCardValue: -1,
  roundWinner: "",
  gameWinner: "",
  gameEvents: [],
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,
  setPhase: (phase) => set({ phase }),
  setRoomCode: (code) => set({ roomCode: code }),
  setHostSessionId: (id) => set({ hostSessionId: id }),
  setCurrentTurn: (sessionId) => set({ currentTurnSessionId: sessionId }),
  setPlayers: (players) => set({ players }),
  updatePlayer: (sessionId, update) =>
    set((state) => {
      const players = new Map(state.players);
      const existing = players.get(sessionId);
      if (existing) {
        players.set(sessionId, { ...existing, ...update });
      }
      return { players };
    }),
  setLocalSessionId: (sessionId) => set({ localSessionId: sessionId }),
  setDeckRemaining: (count) => set({ deckRemaining: count }),
  setFaceUpRemoved: (cards) => set({ faceUpRemoved: cards }),
  setPendingAction: (type, cardValue, cardName = "") =>
    set({ pendingActionType: type, pendingCardValue: cardValue, pendingCardName: cardName }),
  setSycophantTarget: (target) => set({ sycophantTarget: target }),
  addGameEvent: (event) =>
    set((state) => ({
      gameEvents: [...state.gameEvents.slice(-49), event],
    })),
  setRoundWinner: (winner) => set({ roundWinner: winner }),
  setGameWinner: (winner) => set({ gameWinner: winner }),
  setLastPlayedCard: (name, value) =>
    set({ lastPlayedCardName: name, lastPlayedCardValue: value }),
  reset: () => set(initialState),
}));
