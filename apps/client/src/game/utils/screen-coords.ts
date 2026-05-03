import * as Phaser from "phaser";

/**
 * Convert Phaser world coordinates to screen (DOM) coordinates.
 * Used for positioning React overlays (tooltips, etc.) on top of Phaser canvas.
 */
export function phaserToScreen(
  game: Phaser.Game,
  worldX: number,
  worldY: number
): { x: number; y: number } {
  const canvas = game.canvas;
  const rect = canvas.getBoundingClientRect();
  const camera = game.scene.scenes[0]?.cameras?.main;

  if (!camera) {
    return { x: rect.left + worldX, y: rect.top + worldY };
  }

  const scaleX = rect.width / camera.width;
  const scaleY = rect.height / camera.height;

  return {
    x: rect.left + (worldX - camera.scrollX) * scaleX,
    y: rect.top + (worldY - camera.scrollY) * scaleY,
  };
}
