import * as Phaser from "phaser";
import type { Room } from "colyseus.js";

/**
 * Phaser plugin that provides access to the Colyseus room instance.
 * Installed globally so any scene can access the room.
 */
export class ColyseusPlugin extends Phaser.Plugins.BasePlugin {
  private room: Room | null = null;

  init() {
    // Plugin initialization
  }

  setRoom(room: Room) {
    this.room = room;
  }

  getRoom(): Room | null {
    return this.room;
  }

  send(type: string, data?: any) {
    this.room?.send(type, data);
  }
}
