import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema";
import { BaseGameState, PlayerSchema } from "../BaseGameState.js";
import { LoveLetterPlayerState } from "./PlayerState.js";
import { CardState } from "./CardState.js";

export class LoveLetterState extends BaseGameState {
  @type("string") currentTurnSessionId: string = "";
  @type("number") currentRound: number = 0;
  @type("number") deckRemaining: number = 0;
  @type("number") tokensToWin: number = 4;
  @type({ map: LoveLetterPlayerState }) llPlayers = new MapSchema<LoveLetterPlayerState>();
  @type([CardState]) faceUpRemoved = new ArraySchema<CardState>();
  @type("string") pendingActionType: string = ""; // "awaiting_target" | "awaiting_effect_choice" | ""
  @type("number") pendingCardValue: number = -1;
  @type("string") sycophantTarget: string = "";
  @type("string") lastPlayedCardName: string = "";
  @type("number") lastPlayedCardValue: number = -1;
  @type("string") roundWinner: string = "";
  @type("string") gameWinner: string = "";
}
