import {
  BASE_CARDS,
  EXTENDED_CARDS,
  type CardDefinition,
  type LoveLetterCard,
  TWO_PLAYER_FACE_UP_REMOVE,
  FACE_DOWN_REMOVE,
} from "@board-game/shared";

export function buildDeck(playerCount: number): LoveLetterCard[] {
  const useExtended = playerCount >= 5;
  const definitions: CardDefinition[] = useExtended
    ? [...BASE_CARDS, ...EXTENDED_CARDS]
    : BASE_CARDS;

  const cards: LoveLetterCard[] = [];
  let nextId = 1;

  for (const def of definitions) {
    for (let i = 0; i < def.count; i++) {
      cards.push({
        id: nextId++,
        value: def.value,
        name: def.name,
        effect: def.effect,
      });
    }
  }

  return cards;
}

export function shuffleDeck(cards: LoveLetterCard[]): LoveLetterCard[] {
  const shuffled = [...cards];
  // Fisher-Yates shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export interface DeckSetup {
  deck: LoveLetterCard[];
  faceDownRemoved: LoveLetterCard; // always 1 face-down removed card
  faceUpRemoved: LoveLetterCard[]; // 3 face-up in 2-player, 0 otherwise
}

export function setupDeck(playerCount: number): DeckSetup {
  const allCards = buildDeck(playerCount);
  const shuffled = shuffleDeck(allCards);

  // Always remove 1 card face-down
  const faceDownRemoved = shuffled.pop()!;

  // In 2-player games, also remove 3 face-up
  const faceUpRemoved: LoveLetterCard[] = [];
  if (playerCount === 2) {
    for (let i = 0; i < TWO_PLAYER_FACE_UP_REMOVE; i++) {
      faceUpRemoved.push(shuffled.pop()!);
    }
  }

  return {
    deck: shuffled,
    faceDownRemoved,
    faceUpRemoved,
  };
}
