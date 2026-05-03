import type { Room } from "colyseus";
import { LoveLetterRoom } from "./LoveLetterRoom.js";

export const ROOM_REGISTRY: Record<string, typeof Room> = {
  love_letter: LoveLetterRoom as unknown as typeof Room,
};
