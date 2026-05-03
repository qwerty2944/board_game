import type { Room } from "colyseus";
import { GAME_REGISTRY, MATCHMAKING_COUNTDOWN_MS } from "@board-game/shared";

/**
 * Matchmaking logic for auto-joining existing rooms or creating new ones.
 * Used with Colyseus filterBy and matchmaking options.
 */
export interface MatchmakingOptions {
  gameId: string;
  matchmaking: boolean;
}

/**
 * Filter function for matchmaking - finds rooms that:
 * 1. Are the correct game type
 * 2. Are in "waiting" phase
 * 3. Have available slots
 * 4. Are not private
 */
export function getMatchmakingFilter(gameId: string) {
  return {
    gameId,
    status: "waiting",
    isPrivate: false,
  };
}

/**
 * Calculate minimum players needed to start a game.
 */
export function getMinPlayers(gameId: string): number {
  return GAME_REGISTRY[gameId]?.minPlayers ?? 2;
}
