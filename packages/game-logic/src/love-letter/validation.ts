import { COUNTESS_FORCE_VALUES, GUARD_INVALID_GUESS } from "@board-game/shared";
import type { LoveLetterGameState, LoveLetterPlayer } from "./engine.js";

/**
 * Check if a player must discard the Countess.
 * Countess (7) must be discarded if the player also holds King (6) or Prince (5).
 */
export function mustDiscardCountess(hand: number[]): boolean {
  const hasCountess = hand.includes(7);
  const hasForceCard = hand.some((v) => COUNTESS_FORCE_VALUES.includes(v));
  return hasCountess && hasForceCard;
}

/**
 * Get the card values a player can legally play.
 */
export function getPlayableCards(hand: number[]): number[] {
  if (mustDiscardCountess(hand)) {
    return [7]; // Must play Countess
  }
  return hand;
}

/**
 * Check if a target selection is valid.
 */
export function isValidTarget(
  state: LoveLetterGameState,
  actorId: string,
  targetId: string,
  cardValue: number
): boolean {
  // Can't target yourself (except Prince)
  if (targetId === actorId && cardValue !== 5) {
    return false;
  }

  const target = state.players.get(targetId);
  if (!target) return false;
  if (!target.isAlive) return false;

  // Can't target protected players (unless all other valid targets are protected)
  if (target.isProtected) {
    const otherAliveUnprotected = getValidTargets(state, actorId, cardValue);
    // If no valid targets exist, the card fizzles (no target needed)
    return otherAliveUnprotected.length === 0;
  }

  // Check sycophant forced target
  if (state.sycophantTarget && cardValue !== 4) {
    // If sycophant target is set and this card requires a target, must target them
    const forcedTarget = state.players.get(state.sycophantTarget);
    if (forcedTarget && forcedTarget.isAlive && !forcedTarget.isProtected) {
      return targetId === state.sycophantTarget;
    }
  }

  return true;
}

/**
 * Get all valid targets for a card.
 */
export function getValidTargets(
  state: LoveLetterGameState,
  actorId: string,
  cardValue: number
): string[] {
  const targets: string[] = [];

  for (const [sessionId, player] of state.players) {
    if (!player.isAlive) continue;
    if (player.isProtected) continue;

    // Prince can target self
    if (sessionId === actorId && cardValue !== 5) continue;

    targets.push(sessionId);
  }

  // Check sycophant forced target
  if (state.sycophantTarget) {
    const forcedTarget = state.players.get(state.sycophantTarget);
    if (
      forcedTarget &&
      forcedTarget.isAlive &&
      !forcedTarget.isProtected &&
      targets.includes(state.sycophantTarget)
    ) {
      return [state.sycophantTarget];
    }
  }

  return targets;
}

/**
 * Validate a guard guess value.
 */
export function isValidGuardGuess(value: number, useExtendedDeck: boolean): boolean {
  if (value === GUARD_INVALID_GUESS) return false; // Can't guess Guard (1)
  if (useExtendedDeck) {
    return value >= 0 && value <= 9 && value !== 1;
  }
  return value >= 2 && value <= 8;
}

/**
 * Check if a card requires target selection.
 */
export function cardRequiresTarget(cardValue: number, cardName?: string): boolean {
  // Extended cards share values with base cards, so value alone is not enough.
  if (cardName) {
    if (cardName === "Assassin") return false;
    if (cardName.includes("Jester")) return true;
    if (cardName.includes("Handmaid")) return false;
    if (cardName.includes("Sycophant")) return true;
    if (cardName.includes("Count Guntram")) return false;
    if (cardName.includes("Prince")) return true;
    if (cardName.includes("Constable")) return false;
    if (cardName.includes("King")) return true;
    if (cardName.includes("Countess")) return false;
    if (cardName.includes("Dowager")) return true;
    if (cardName.includes("Bishop")) return true;
  }

  // Base deck targeting cards.
  return [1, 2, 3, 5, 6].includes(cardValue);
}

/**
 * Check if all other players are protected (card fizzles).
 */
export function allOthersProtected(
  state: LoveLetterGameState,
  actorId: string
): boolean {
  for (const [sessionId, player] of state.players) {
    if (sessionId === actorId) continue;
    if (!player.isAlive) continue;
    if (!player.isProtected) return false;
  }
  return true;
}
