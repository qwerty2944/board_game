import type { LoveLetterCard } from "@board-game/shared";
import type { LoveLetterGameState, LoveLetterPlayer } from "./engine.js";
import type { GameEvent } from "../engine.js";

export interface CardEffectResult {
  state: LoveLetterGameState;
  events: GameEvent[];
}

/**
 * Resolve card effects. Returns updated state and events to emit.
 */
export function resolveCardEffect(
  state: LoveLetterGameState,
  actorId: string,
  cardValue: number,
  targetId?: string,
  guessedValue?: number,
  selectedPlayerIds?: string[],
  optionalDraw?: boolean
): CardEffectResult {
  const events: GameEvent[] = [];
  let newState = { ...state, players: new Map(state.players) };

  // Copy player objects for immutability
  const copyPlayer = (id: string): LoveLetterPlayer => {
    const p = newState.players.get(id)!;
    return { ...p, hand: [...p.hand], discardPile: [...p.discardPile] };
  };

  switch (cardValue) {
    case 0: {
      // Jester or Assassin
      const actor = copyPlayer(actorId);
      const playedCard = actor.discardPile[actor.discardPile.length - 1];

      if (playedCard && state.cardNames?.get(playedCard) === "Jester Darius") {
        // Jester: mark target - if they win the round, actor gets a token
        if (targetId) {
          newState.jesterTarget = { jesterId: actorId, targetId };
          events.push({
            type: "jester_played",
            payload: { actor: actorId, target: targetId },
          });
        }
      } else {
        // Assassin played actively: discard and draw (passive handled elsewhere)
        if (actor.hand.length === 0 && newState.deck.length > 0) {
          actor.hand.push(newState.deck.pop()!);
        }
        newState.players.set(actorId, actor);
        events.push({
          type: "assassin_discarded",
          payload: { actor: actorId },
        });
      }
      break;
    }

    case 1: {
      // Guard: guess a card value for target
      if (!targetId || guessedValue === undefined) break;

      const target = copyPlayer(targetId);

      // Check for Assassin counter
      if (target.hand.length > 0) {
        const assassinIdx = target.hand.findIndex(
          (cardId) => state.cardValues?.get(cardId) === 0 &&
            state.cardNames?.get(cardId) === "Assassin"
        );

        if (assassinIdx !== -1 && guessedValue === state.cardValues?.get(target.hand[0])) {
          // Assassin triggers: Guard player is eliminated instead
          const actor = copyPlayer(actorId);
          actor.isAlive = false;
          // Assassin is discarded, target draws new card
          const assassinCard = target.hand.splice(assassinIdx, 1)[0];
          target.discardPile.push(assassinCard);
          if (newState.deck.length > 0) {
            target.hand.push(newState.deck.pop()!);
          }
          newState.players.set(actorId, actor);
          newState.players.set(targetId, target);
          events.push({
            type: "assassin_counter",
            payload: { guard: actorId, assassinHolder: targetId },
          });
          break;
        }
      }

      // Normal Guard resolution
      if (target.hand.length > 0) {
        const targetCardValue = state.cardValues?.get(target.hand[0]);
        if (targetCardValue === guessedValue) {
          target.isAlive = false;
          events.push({
            type: "guard_correct",
            payload: { actor: actorId, target: targetId, guess: guessedValue },
          });
          checkConstableToken(target, newState, events);
        } else {
          events.push({
            type: "guard_incorrect",
            payload: { actor: actorId, target: targetId, guess: guessedValue },
          });
        }
      }
      newState.players.set(targetId, target);
      break;
    }

    case 2: {
      // Priest (base) or Cardinal (extended)
      if (!targetId) break;

      const target = newState.players.get(targetId)!;
      if (selectedPlayerIds && selectedPlayerIds.length === 2) {
        // Cardinal: swap two players' hands, then view one
        const player1 = copyPlayer(selectedPlayerIds[0]);
        const player2 = copyPlayer(selectedPlayerIds[1]);
        const temp = player1.hand;
        player1.hand = player2.hand;
        player2.hand = temp;
        newState.players.set(selectedPlayerIds[0], player1);
        newState.players.set(selectedPlayerIds[1], player2);
        events.push({
          type: "cardinal_swap",
          payload: {
            actor: actorId,
            player1: selectedPlayerIds[0],
            player2: selectedPlayerIds[1],
            viewedPlayer: targetId,
            viewedCard: target.hand[0],
          },
        });
      } else {
        // Priest: view target's hand (private event to actor only)
        events.push({
          type: "priest_peek",
          payload: {
            actor: actorId,
            target: targetId,
            card: target.hand[0],
          },
        });
      }
      break;
    }

    case 3: {
      // Baron (base) or Baroness (extended)
      if (!targetId) break;

      const actor = copyPlayer(actorId);
      const target = copyPlayer(targetId);

      // Check if this is Baroness (extended - peek only)
      if (selectedPlayerIds && selectedPlayerIds.length > 0) {
        // Baroness: peek at 1-2 players
        const peekedCards: Array<{ playerId: string; card: number }> = [];
        for (const pid of selectedPlayerIds) {
          const p = newState.players.get(pid)!;
          if (p.hand.length > 0) {
            peekedCards.push({ playerId: pid, card: p.hand[0] });
          }
        }
        events.push({
          type: "baroness_peek",
          payload: { actor: actorId, peeked: peekedCards },
        });
      } else {
        // Baron: compare hands, lower is eliminated
        const actorValue = state.cardValues?.get(actor.hand[0]) ?? 0;
        const targetValue = state.cardValues?.get(target.hand[0]) ?? 0;

        if (actorValue > targetValue) {
          target.isAlive = false;
          events.push({
            type: "baron_compare",
            payload: {
              actor: actorId,
              target: targetId,
              loser: targetId,
              actorValue,
              targetValue,
            },
          });
          checkConstableToken(target, newState, events);
        } else if (targetValue > actorValue) {
          actor.isAlive = false;
          events.push({
            type: "baron_compare",
            payload: {
              actor: actorId,
              target: targetId,
              loser: actorId,
              actorValue,
              targetValue,
            },
          });
          checkConstableToken(actor, newState, events);
        } else {
          // Tie: no one eliminated
          events.push({
            type: "baron_compare",
            payload: {
              actor: actorId,
              target: targetId,
              loser: null,
              actorValue,
              targetValue,
            },
          });
        }
        newState.players.set(actorId, actor);
        newState.players.set(targetId, target);
      }
      break;
    }

    case 4: {
      // Handmaid (base) or Sycophant (extended)
      const actor = copyPlayer(actorId);
      const playedCardName = actor.discardPile.length > 0
        ? state.cardNames?.get(actor.discardPile[actor.discardPile.length - 1])
        : undefined;

      if (playedCardName === "Sycophant Morris") {
        // Sycophant: force next target
        if (targetId) {
          newState.sycophantTarget = targetId;
          events.push({
            type: "sycophant_played",
            payload: { actor: actorId, forcedTarget: targetId },
          });
        }
      } else {
        // Handmaid: protect self
        actor.isProtected = true;
        newState.players.set(actorId, actor);
        events.push({
          type: "handmaid_protection",
          payload: { actor: actorId },
        });
      }
      break;
    }

    case 5: {
      // Prince (base) or Count (extended)
      const actor = copyPlayer(actorId);
      const playedCardName = actor.discardPile.length > 0
        ? state.cardNames?.get(actor.discardPile[actor.discardPile.length - 1])
        : undefined;

      if (playedCardName === "Count Guntram") {
        // Count: no immediate effect, bonus at round end
        events.push({
          type: "count_played",
          payload: { actor: actorId },
        });
      } else {
        // Prince: target discards hand and draws new card
        const effectiveTarget = targetId || actorId;
        const target = copyPlayer(effectiveTarget);

        if (target.hand.length > 0) {
          const discardedCardId = target.hand[0];
          const discardedValue = state.cardValues?.get(discardedCardId) ?? 0;
          target.discardPile.push(discardedCardId);
          target.hand = [];

          // If Princess discarded, player is eliminated
          if (discardedValue === 8) {
            target.isAlive = false;
            events.push({
              type: "princess_discarded",
              payload: { target: effectiveTarget },
            });
            checkConstableToken(target, newState, events);
          } else {
            // Draw new card
            if (newState.deck.length > 0) {
              target.hand.push(newState.deck.pop()!);
            } else if (newState.faceDownRemoved !== null) {
              // If deck is empty, draw the face-down removed card
              target.hand.push(newState.faceDownRemoved);
              newState.faceDownRemoved = null;
            }
            events.push({
              type: "prince_discard",
              payload: { actor: actorId, target: effectiveTarget, discardedValue },
            });
          }
        }
        newState.players.set(effectiveTarget, target);
      }
      break;
    }

    case 6: {
      // King (base) or Constable (extended)
      const actor = copyPlayer(actorId);
      const playedCardName = actor.discardPile.length > 0
        ? state.cardNames?.get(actor.discardPile[actor.discardPile.length - 1])
        : undefined;

      if (playedCardName === "Constable Viktor") {
        // Constable: no immediate effect, token on elimination
        events.push({
          type: "constable_played",
          payload: { actor: actorId },
        });
      } else if (targetId) {
        // King: trade hands
        const target = copyPlayer(targetId);
        const temp = actor.hand;
        actor.hand = target.hand;
        target.hand = temp;
        newState.players.set(actorId, actor);
        newState.players.set(targetId, target);
        events.push({
          type: "king_trade",
          payload: { actor: actorId, target: targetId },
        });
      }
      break;
    }

    case 7: {
      // Countess (base) or Dowager Queen (extended)
      const actor = copyPlayer(actorId);
      const playedCardName = actor.discardPile.length > 0
        ? state.cardNames?.get(actor.discardPile[actor.discardPile.length - 1])
        : undefined;

      if (playedCardName === "Dowager Queen Tummia" && targetId) {
        // Dowager Queen: compare hands, HIGHER is eliminated (opposite of Baron)
        const target = copyPlayer(targetId);
        const actorValue = state.cardValues?.get(actor.hand[0]) ?? 0;
        const targetValue = state.cardValues?.get(target.hand[0]) ?? 0;

        if (actorValue < targetValue) {
          target.isAlive = false;
          events.push({
            type: "dowager_compare",
            payload: {
              actor: actorId,
              target: targetId,
              loser: targetId,
              actorValue,
              targetValue,
            },
          });
          checkConstableToken(target, newState, events);
        } else if (targetValue < actorValue) {
          actor.isAlive = false;
          events.push({
            type: "dowager_compare",
            payload: {
              actor: actorId,
              target: targetId,
              loser: actorId,
              actorValue,
              targetValue,
            },
          });
          checkConstableToken(actor, newState, events);
        } else {
          events.push({
            type: "dowager_compare",
            payload: {
              actor: actorId,
              target: targetId,
              loser: null,
              actorValue,
              targetValue,
            },
          });
        }
        newState.players.set(actorId, actor);
        newState.players.set(targetId, target);
      } else {
        // Countess: no effect (forced discard already handled)
        events.push({
          type: "countess_discarded",
          payload: { actor: actorId },
        });
      }
      break;
    }

    case 8: {
      // Princess: discarding eliminates the player
      const actor = copyPlayer(actorId);
      actor.isAlive = false;
      newState.players.set(actorId, actor);
      events.push({
        type: "princess_discarded",
        payload: { target: actorId },
      });
      checkConstableToken(actor, newState, events);
      break;
    }

    case 9: {
      // Bishop: guess a number for a player, if correct gain token
      if (!targetId || guessedValue === undefined) break;

      const target = copyPlayer(targetId);
      if (target.hand.length > 0) {
        const targetCardValue = state.cardValues?.get(target.hand[0]);
        if (targetCardValue === guessedValue) {
          // Correct guess: actor gains a token
          const actor = copyPlayer(actorId);
          actor.tokens++;
          newState.players.set(actorId, actor);

          // Target may choose to discard and redraw
          if (optionalDraw) {
            const discardedCardId = target.hand[0];
            target.discardPile.push(discardedCardId);
            target.hand = [];
            if (newState.deck.length > 0) {
              target.hand.push(newState.deck.pop()!);
            } else if (newState.faceDownRemoved !== null) {
              target.hand.push(newState.faceDownRemoved);
              newState.faceDownRemoved = null;
            }
          }

          events.push({
            type: "bishop_correct",
            payload: {
              actor: actorId,
              target: targetId,
              guess: guessedValue,
              targetRedrew: optionalDraw ?? false,
            },
          });
        } else {
          events.push({
            type: "bishop_incorrect",
            payload: { actor: actorId, target: targetId, guess: guessedValue },
          });
        }
      }
      newState.players.set(targetId, target);
      break;
    }
  }

  // Clear sycophant target after a targeting card is played
  if (
    state.sycophantTarget &&
    cardValue !== 4 &&
    [1, 2, 3, 5, 6, 7, 9].includes(cardValue)
  ) {
    newState.sycophantTarget = undefined;
  }

  return { state: newState, events };
}

/**
 * Check if a player has Constable in their discard pile when eliminated.
 * If so, they gain a token.
 */
function checkConstableToken(
  player: LoveLetterPlayer,
  state: LoveLetterGameState,
  events: GameEvent[]
): void {
  const hasConstable = player.discardPile.some(
    (cardId) => state.cardNames?.get(cardId) === "Constable Viktor"
  );
  if (hasConstable) {
    player.tokens++;
    events.push({
      type: "constable_token",
      payload: { player: player.sessionId },
    });
  }
}
