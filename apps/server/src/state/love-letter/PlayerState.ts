import { Schema, ArraySchema, type } from "@colyseus/schema";
import { CardState } from "./CardState.js";

export class LoveLetterPlayerState extends Schema {
  @type("string") sessionId: string = "";
  @type("string") name: string = "";
  @type("boolean") isAlive: boolean = true;
  @type("boolean") isProtected: boolean = false;
  @type("number") tokens: number = 0;
  @type("number") handCount: number = 0;
  @type([CardState]) discardedCards = new ArraySchema<CardState>();

  // Hand is filtered - only visible to the owning player
  @type([CardState]) hand = new ArraySchema<CardState>();
}
