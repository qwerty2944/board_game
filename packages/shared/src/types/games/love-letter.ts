export interface LoveLetterCard {
  id: number; // unique instance id
  value: number;
  name: string;
  effect: string;
}

export interface PlayCardMessage {
  cardId: number; // instance id of card to play
}

export interface SelectTargetMessage {
  targetSessionId?: string; // target player (undefined for no-target cards)
  guessedValue?: number; // for Guard
  selectedPlayerIds?: string[]; // for Cardinal (2 targets)
  optionalDraw?: boolean; // for Bishop target's choice
}

export type LoveLetterPhase =
  | "waiting"
  | "ready"
  | "playing"
  | "awaiting_target"
  | "awaiting_effect_choice"
  | "round_end"
  | "game_over";

export interface RoundResult {
  winnerId: string;
  winnerName: string;
  reason: "last_standing" | "highest_card" | "tiebreak_discard_sum";
  survivors: Array<{
    sessionId: string;
    cardValue: number;
    countBonus: number;
    discardSum: number;
  }>;
}

export interface PlayerPublicInfo {
  sessionId: string;
  name: string;
  image?: string;
  isAlive: boolean;
  isProtected: boolean;
  tokens: number;
  discardedCards: number[];
  handCount: number;
  isReady: boolean;
}

export interface LoveLetterGameConfig {
  playerCount: number;
  useExtendedDeck: boolean; // true for 5-8 players
  tokensToWin: number;
}
