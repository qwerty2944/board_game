import * as Phaser from "phaser";
import type { CardInfo } from "@/entities/game/model/store";

const CARD_COLORS: Record<number, number> = {
  0: 0x666666, // Jester/Assassin
  1: 0x4a90d9, // Guard
  2: 0x7b68ee, // Priest/Cardinal
  3: 0xdc143c, // Baron/Baroness
  4: 0x32cd32, // Handmaid/Sycophant
  5: 0xff8c00, // Prince/Count
  6: 0xffd700, // King/Constable
  7: 0x9932cc, // Countess/Dowager Queen
  8: 0xff69b4, // Princess
  9: 0x00ced1, // Bishop
};

export class CardSprite extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle;
  private valueText: Phaser.GameObjects.Text;
  private nameText: Phaser.GameObjects.Text;
  private cardInfo: CardInfo;

  constructor(scene: Phaser.Scene, x: number, y: number, cardInfo: CardInfo) {
    super(scene, x, y);
    this.cardInfo = cardInfo;

    const color = CARD_COLORS[cardInfo.value] ?? 0x444444;

    // Card background
    this.bg = scene.add
      .rectangle(0, 0, 70, 100, color)
      .setStrokeStyle(2, 0xffffff);

    // Card value
    this.valueText = scene.add
      .text(0, -20, String(cardInfo.value), {
        fontSize: "28px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Card name (shortened)
    const shortName = cardInfo.name.split(" ")[0];
    this.nameText = scene.add
      .text(0, 25, shortName, {
        fontSize: "10px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.add([this.bg, this.valueText, this.nameText]);
    scene.add.existing(this);

    // Make interactive
    this.setSize(70, 100);
    this.setInteractive(
      new Phaser.Geom.Rectangle(-35, -50, 70, 100),
      Phaser.Geom.Rectangle.Contains
    );

    // Hover effect
    this.on("pointerover", () => {
      scene.tweens.add({
        targets: this,
        y: y - 15,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 150,
        ease: "Back.easeOut",
      });
    });

    this.on("pointerout", () => {
      scene.tweens.add({
        targets: this,
        y: y,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
        ease: "Back.easeOut",
      });
    });
  }

  getCardInfo(): CardInfo {
    return this.cardInfo;
  }
}
