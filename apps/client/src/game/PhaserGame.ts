import * as Phaser from "phaser";
import { PreloadScene } from "./scenes/PreloadScene";
import { LoveLetterScene } from "./scenes/love-letter/LoveLetterScene";

export type SceneConfig = Array<new (...args: any[]) => Phaser.Scene>;

// Registry of game scenes per game type
export const SCENE_REGISTRY: Record<string, SceneConfig> = {
  love_letter: [PreloadScene, LoveLetterScene],
};

export function createPhaserGame(
  parent: HTMLElement,
  gameId: string = "love_letter"
): Phaser.Game {
  const scenes = SCENE_REGISTRY[gameId] || SCENE_REGISTRY.love_letter;

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent,
    width: 1280,
    height: 720,
    backgroundColor: "#1a1a2e",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: scenes,
  };

  return new Phaser.Game(config);
}
