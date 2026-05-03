export interface GameDefinition {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  estimatedMinutes: [number, number]; // [min, max]
}

export const GAME_REGISTRY: Record<string, GameDefinition> = {
  love_letter: {
    id: "love_letter",
    name: "Love Letter Premium",
    description: "A game of risk, deduction, and luck for 2-8 players",
    minPlayers: 2,
    maxPlayers: 8,
    estimatedMinutes: [15, 30],
  },
};

export const ROOM_CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // excludes O/0/I/1/L
export const ROOM_CODE_LENGTH = 6;

export const RECONNECT_TIMEOUT_MS = 60_000;
export const AUTO_PLAY_TIMEOUT_MS = 30_000;
export const MATCHMAKING_COUNTDOWN_MS = 10_000;
