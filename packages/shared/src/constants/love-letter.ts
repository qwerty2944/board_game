export interface CardDefinition {
  value: number;
  name: string;
  count: number;
  effect: string;
  requiresTarget: boolean;
  requiresGuess: boolean;
  extended: boolean; // only in 5-8 player games
}

// Base deck cards (2-4 players, 16 cards)
export const BASE_CARDS: CardDefinition[] = [
  {
    value: 1,
    name: "Guard Odette",
    count: 5,
    effect: "Name a non-1 card. If target has it, they are eliminated.",
    requiresTarget: true,
    requiresGuess: true,
    extended: false,
  },
  {
    value: 2,
    name: "Priest Tomas",
    count: 2,
    effect: "Secretly look at another player's hand.",
    requiresTarget: true,
    requiresGuess: false,
    extended: false,
  },
  {
    value: 3,
    name: "Baron Talus",
    count: 2,
    effect: "Compare hands with another player. Lower value is eliminated.",
    requiresTarget: true,
    requiresGuess: false,
    extended: false,
  },
  {
    value: 4,
    name: "Handmaid Susannah",
    count: 2,
    effect: "Protected until your next turn.",
    requiresTarget: false,
    requiresGuess: false,
    extended: false,
  },
  {
    value: 5,
    name: "Prince Arnaud",
    count: 2,
    effect: "Choose any player (including yourself) to discard their hand and draw a new card.",
    requiresTarget: true,
    requiresGuess: false,
    extended: false,
  },
  {
    value: 6,
    name: "King Arnaud IV",
    count: 1,
    effect: "Trade hands with another player.",
    requiresTarget: true,
    requiresGuess: false,
    extended: false,
  },
  {
    value: 7,
    name: "Countess Wilhelmina",
    count: 1,
    effect: "Must be discarded if you hold King or Prince. No effect.",
    requiresTarget: false,
    requiresGuess: false,
    extended: false,
  },
  {
    value: 8,
    name: "Princess Annette",
    count: 1,
    effect: "If you discard this card for any reason, you are eliminated.",
    requiresTarget: false,
    requiresGuess: false,
    extended: false,
  },
];

// Extended deck cards (5-8 players, additional 16 cards)
export const EXTENDED_CARDS: CardDefinition[] = [
  {
    value: 0,
    name: "Jester Darius",
    count: 1,
    effect: "Choose a player. If they win this round, you gain a token.",
    requiresTarget: true,
    requiresGuess: false,
    extended: true,
  },
  {
    value: 0,
    name: "Assassin",
    count: 1,
    effect: "Passive: If targeted by Guard and guess is correct, Guard player is eliminated instead. Discard and draw new card.",
    requiresTarget: false,
    requiresGuess: false,
    extended: true,
  },
  {
    value: 1,
    name: "Guard Dougaul",
    count: 3,
    effect: "Name a non-1 card. If target has it, they are eliminated.",
    requiresTarget: true,
    requiresGuess: true,
    extended: true,
  },
  {
    value: 2,
    name: "Cardinal Vesper",
    count: 2,
    effect: "Choose 2 players to trade hands, then secretly view one of their hands.",
    requiresTarget: true,
    requiresGuess: false,
    extended: true,
  },
  {
    value: 3,
    name: "Baroness Fiona",
    count: 2,
    effect: "Secretly look at 1-2 players' hands.",
    requiresTarget: true,
    requiresGuess: false,
    extended: true,
  },
  {
    value: 4,
    name: "Sycophant Morris",
    count: 2,
    effect: "Choose any player. Next card requiring a target must target that player.",
    requiresTarget: true,
    requiresGuess: false,
    extended: true,
  },
  {
    value: 5,
    name: "Count Guntram",
    count: 2,
    effect: "No immediate effect. Each Count in your discard pile adds +1 to your hand value at round end.",
    requiresTarget: false,
    requiresGuess: false,
    extended: true,
  },
  {
    value: 6,
    name: "Constable Viktor",
    count: 1,
    effect: "No immediate effect. If eliminated while this is in your discard pile, gain a token.",
    requiresTarget: false,
    requiresGuess: false,
    extended: true,
  },
  {
    value: 7,
    name: "Dowager Queen Tummia",
    count: 1,
    effect: "Compare hands with another player. Higher value is eliminated.",
    requiresTarget: true,
    requiresGuess: false,
    extended: true,
  },
  {
    value: 9,
    name: "Bishop Vinizio",
    count: 1,
    effect: "Name a number and a player. If correct, gain a token. Target may discard and redraw.",
    requiresTarget: true,
    requiresGuess: true,
    extended: true,
  },
];

// Tokens needed to win by player count
export const TOKENS_TO_WIN: Record<number, number> = {
  2: 7,
  3: 5,
  4: 4,
  5: 4,
  6: 4,
  7: 4,
  8: 4,
};

// In 2-player games, remove 3 face-up cards + 1 face-down from the deck
export const TWO_PLAYER_FACE_UP_REMOVE = 3;
export const FACE_DOWN_REMOVE = 1; // always remove 1 face-down card

// Card values that force Countess discard
export const COUNTESS_FORCE_VALUES = [5, 6]; // Prince, King

// Guard cannot guess value 1
export const GUARD_INVALID_GUESS = 1;

// Princess comparison: Princess (8) beats Bishop (9) at round end
export const PRINCESS_BEATS_BISHOP_AT_ROUND_END = true;
