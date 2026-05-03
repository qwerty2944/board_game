import * as Phaser from "phaser";
import type { PlayerState } from "@/entities/game/model/store";

export class PlayerArea extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle;
  private nameText: Phaser.GameObjects.Text;
  private statusText: Phaser.GameObjects.Text;
  private tokenText: Phaser.GameObjects.Text;
  private cardCountText: Phaser.GameObjects.Text;
  private protectedIcon: Phaser.GameObjects.Text;
  private glowBorder: Phaser.GameObjects.Graphics;
  private isCurrentTurn: boolean = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    player: PlayerState
  ) {
    super(scene, x, y);

    // Glow border for turn highlight
    this.glowBorder = scene.add.graphics();
    this.glowBorder.setAlpha(0);
    this.add(this.glowBorder);

    // Background
    this.bg = scene.add
      .rectangle(0, 0, 150, 85, 0x16213e)
      .setStrokeStyle(1, 0x444444);

    // Player name
    this.nameText = scene.add
      .text(0, -28, player.name, {
        fontSize: "14px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Status (alive/eliminated)
    this.statusText = scene.add
      .text(0, -8, "", {
        fontSize: "11px",
        color: "#ff4444",
      })
      .setOrigin(0.5);

    // Tokens
    this.tokenText = scene.add
      .text(-45, 22, "", {
        fontSize: "12px",
        color: "#f5a623",
      })
      .setOrigin(0, 0.5);

    // Card count
    this.cardCountText = scene.add
      .text(45, 22, "", {
        fontSize: "12px",
        color: "#aaaaaa",
      })
      .setOrigin(1, 0.5);

    // Protection shield icon
    this.protectedIcon = scene.add
      .text(60, -28, "", {
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
      this.statusText.setText("\u274C \ud0c8\ub77d");
      this.bg.setStrokeStyle(1, 0x660000);
      this.setAlpha(0.4);
    } else {
      this.statusText.setText("");
      this.bg.setStrokeStyle(1, this.isCurrentTurn ? 0x00ffaa : 0x444444);
      this.setAlpha(1);
    }

    this.tokenText.setText(`\ud83e\ude99 ${player.tokens}`);
    this.cardCountText.setText(`\ud83c\udcb1 ${player.handCount}`);
    this.protectedIcon.setText(player.isProtected ? "\ud83d\udee1" : "");
  }

  setCurrentTurn(isTurn: boolean) {
    this.isCurrentTurn = isTurn;
    if (isTurn) {
      this.drawTurnGlow();
      this.glowBorder.setAlpha(1);
      this.scene.tweens.add({
        targets: this.glowBorder,
        alpha: 0.3,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      this.bg.setStrokeStyle(2, 0x00ffaa);
    } else {
      this.scene.tweens.killTweensOf(this.glowBorder);
      this.glowBorder.setAlpha(0);
      this.bg.setStrokeStyle(1, 0x444444);
    }
  }

  playEliminationAnimation() {
    this.scene.tweens.add({
      targets: this,
      x: this.x - 5,
      duration: 50,
      yoyo: true,
      repeat: 5,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.scene.tweens.add({
          targets: this,
          alpha: 0.4,
          duration: 300,
        });
      },
    });
  }

  private drawTurnGlow() {
    this.glowBorder.clear();
    this.glowBorder.lineStyle(3, 0x00ffaa, 0.8);
    this.glowBorder.strokeRoundedRect(-78, -46, 156, 92, 6);
  }
}
