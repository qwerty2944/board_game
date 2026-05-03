import * as Phaser from "phaser";
import type { CardInfo } from "@/entities/game/model/store";
import { useUIStore } from "@/entities/room/model/store";
import { getCardDescriptionKo } from "@/game/data/card-descriptions-ko";
import { phaserToScreen } from "@/game/utils/screen-coords";

const CARD_WIDTH = 90;
const CARD_HEIGHT = 130;
const BORDER_RADIUS = 8;

export class CardSprite extends Phaser.GameObjects.Container {
  private cardGraphics: Phaser.GameObjects.Graphics;
  private glowGraphics: Phaser.GameObjects.Graphics;
  private symbolText: Phaser.GameObjects.Text;
  private valueText: Phaser.GameObjects.Text;
  private nameText: Phaser.GameObjects.Text;
  private cardInfo: CardInfo;
  private baseY: number;
  private isPlayable: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, cardInfo: CardInfo) {
    super(scene, x, y);
    this.cardInfo = cardInfo;
    this.baseY = y;

    const desc = getCardDescriptionKo(cardInfo.value, cardInfo.name);
    const gradTop = desc?.gradientTop ?? 0x444444;
    const gradBottom = desc?.gradientBottom ?? 0x222222;
    const symbol = desc?.symbol ?? "\u{2660}";
    const shortName = desc?.shortNameKo ?? cardInfo.name.split(" ")[0];

    // Glow border (hidden by default)
    this.glowGraphics = scene.add.graphics();
    this.glowGraphics.setAlpha(0);
    this.drawGlow(0x00ffaa);
    this.add(this.glowGraphics);

    // Card body
    this.cardGraphics = scene.add.graphics();
    this.drawCard(gradTop, gradBottom);
    this.add(this.cardGraphics);

    // Value badge (top-left circle)
    const badgeGraphics = scene.add.graphics();
    badgeGraphics.fillStyle(0x000000, 0.6);
    badgeGraphics.fillCircle(-CARD_WIDTH / 2 + 14, -CARD_HEIGHT / 2 + 14, 12);
    badgeGraphics.lineStyle(1, 0xffffff, 0.8);
    badgeGraphics.strokeCircle(-CARD_WIDTH / 2 + 14, -CARD_HEIGHT / 2 + 14, 12);
    this.add(badgeGraphics);

    this.valueText = scene.add
      .text(-CARD_WIDTH / 2 + 14, -CARD_HEIGHT / 2 + 14, String(cardInfo.value), {
        fontSize: "14px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.add(this.valueText);

    // Central symbol
    this.symbolText = scene.add
      .text(0, -10, symbol, {
        fontSize: "32px",
      })
      .setOrigin(0.5);
    this.add(this.symbolText);

    // Korean card name (bottom)
    this.nameText = scene.add
      .text(0, CARD_HEIGHT / 2 - 20, shortName, {
        fontSize: "12px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.add(this.nameText);

    scene.add.existing(this);

    // Make interactive
    this.setSize(CARD_WIDTH, CARD_HEIGHT);
    this.setInteractive(
      new Phaser.Geom.Rectangle(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT),
      Phaser.Geom.Rectangle.Contains
    );

    // Hover effects
    this.on("pointerover", () => {
      scene.tweens.add({
        targets: this,
        y: this.baseY - 20,
        scaleX: 1.12,
        scaleY: 1.12,
        duration: 150,
        ease: "Back.easeOut",
      });

      // Show tooltip via Zustand store
      const coords = phaserToScreen(scene.game, this.x, this.baseY - CARD_HEIGHT / 2 - 20);
      useUIStore.getState().showCardTooltip({
        value: cardInfo.value,
        name: cardInfo.name,
        screenX: coords.x,
        screenY: coords.y,
      });
    });

    this.on("pointerout", () => {
      scene.tweens.add({
        targets: this,
        y: this.baseY,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
        ease: "Back.easeOut",
      });

      useUIStore.getState().hideCardTooltip();
    });
  }

  private drawCard(gradTop: number, gradBottom: number) {
    const g = this.cardGraphics;
    const w = CARD_WIDTH;
    const h = CARD_HEIGHT;
    const r = BORDER_RADIUS;
    const x = -w / 2;
    const y = -h / 2;

    // Background gradient (top to bottom via two halves)
    g.fillStyle(gradTop, 1);
    g.fillRoundedRect(x, y, w, h / 2, { tl: r, tr: r, bl: 0, br: 0 });
    g.fillStyle(gradBottom, 1);
    g.fillRoundedRect(x, y + h / 2, w, h / 2, { tl: 0, tr: 0, bl: r, br: r });

    // Inner border decoration
    g.lineStyle(1, 0xffffff, 0.3);
    g.strokeRoundedRect(x + 4, y + 4, w - 8, h - 8, r - 2);

    // Outer border
    g.lineStyle(2, 0xffffff, 0.8);
    g.strokeRoundedRect(x, y, w, h, r);
  }

  private drawGlow(color: number) {
    const g = this.glowGraphics;
    const w = CARD_WIDTH + 8;
    const h = CARD_HEIGHT + 8;
    const x = -w / 2;
    const y = -h / 2;

    g.lineStyle(4, color, 0.8);
    g.strokeRoundedRect(x, y, w, h, BORDER_RADIUS + 2);
  }

  setPlayable(playable: boolean) {
    this.isPlayable = playable;
    if (playable) {
      this.glowGraphics.setAlpha(1);
      this.scene.tweens.add({
        targets: this.glowGraphics,
        alpha: 0.4,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    } else {
      this.scene.tweens.killTweensOf(this.glowGraphics);
      this.glowGraphics.setAlpha(0);
    }
  }

  getCardInfo(): CardInfo {
    return this.cardInfo;
  }
}
