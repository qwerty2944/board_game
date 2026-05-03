import * as Phaser from "phaser";
import type { PlayerState } from "@/entities/game/model/store";

export class PlayerArea extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle;
  private nameText: Phaser.GameObjects.Text;
  private statusText: Phaser.GameObjects.Text;
  private tokenText: Phaser.GameObjects.Text;
  private cardCountText: Phaser.GameObjects.Text;
  private protectedIcon: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    player: PlayerState
  ) {
    super(scene, x, y);

    // Background
    this.bg = scene.add
      .rectangle(0, 0, 140, 80, 0x16213e)
      .setStrokeStyle(1, 0x444444);

    // Player name
    this.nameText = scene.add
      .text(0, -25, player.name, {
        fontSize: "14px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Status (alive/eliminated)
    this.statusText = scene.add
      .text(0, -5, "", {
        fontSize: "11px",
        color: "#ff4444",
      })
      .setOrigin(0.5);

    // Tokens
    this.tokenText = scene.add
      .text(-40, 20, "", {
        fontSize: "12px",
        color: "#f5a623",
      })
      .setOrigin(0, 0.5);

    // Card count
    this.cardCountText = scene.add
      .text(40, 20, "", {
        fontSize: "12px",
        color: "#aaaaaa",
      })
      .setOrigin(1, 0.5);

    // Protection shield icon
    this.protectedIcon = scene.add
      .text(55, -25, "", {
        fontSize: "16px",
      })
      .setOrigin(0.5);

    this.add([
      this.bg,
      this.nameText,
      this.statusText,
      this.tokenText,
      this.cardCountText,
      this.protectedIcon,
    ]);

    scene.add.existing(this);
    this.updateState(player);
  }

  updatePosition(x: number, y: number) {
    this.setPosition(x, y);
  }

  updateState(player: PlayerState) {
    this.nameText.setText(player.name);

    if (!player.isAlive) {
      this.statusText.setText("Eliminated");
      this.bg.setStrokeStyle(1, 0x660000);
      this.setAlpha(0.6);
    } else {
      this.statusText.setText("");
      this.bg.setStrokeStyle(1, 0x444444);
      this.setAlpha(1);
    }

    this.tokenText.setText(`Tokens: ${player.tokens}`);
    this.cardCountText.setText(`Cards: ${player.handCount}`);
    this.protectedIcon.setText(player.isProtected ? "🛡" : "");
  }
}
