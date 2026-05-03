import * as Phaser from "phaser";
import { useGameStore, type CardInfo, type PlayerState } from "@/entities/game/model/store";
import { CardSprite } from "./CardSprite";
import { PlayerArea } from "./PlayerArea";

export class LoveLetterScene extends Phaser.Scene {
  private playerAreas: Map<string, PlayerArea> = new Map();
  private handCards: CardSprite[] = [];
  private deckText!: Phaser.GameObjects.Text;
  private turnIndicator!: Phaser.GameObjects.Text;
  private centerText!: Phaser.GameObjects.Text;
  private unsubscribe?: () => void;
  private prevState: {
    currentTurnSessionId: string;
    alivePlayers: Set<string>;
    roundWinner: string;
    lastPlayedCardValue: number;
  } = {
    currentTurnSessionId: "",
    alivePlayers: new Set(),
    roundWinner: "",
    lastPlayedCardValue: -1,
  };

  constructor() {
    super({ key: "LoveLetterScene" });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Background
    this.add
      .rectangle(width / 2, height / 2, width, height, 0x1a1a2e)
      .setOrigin(0.5);

    // Deck indicator
    this.deckText = this.add
      .text(width / 2, 40, "\uD83C\uDCB1 \uB371: 0", {
        fontSize: "16px",
        color: "#f5a623",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Turn indicator
    this.turnIndicator = this.add
      .text(width / 2, height / 2, "", {
        fontSize: "22px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Center text for announcements (round winner etc.)
    this.centerText = this.add
      .text(width / 2, height / 2 - 40, "", {
        fontSize: "28px",
        color: "#ffd700",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // Subscribe to store changes
    this.unsubscribe = useGameStore.subscribe((state) => {
      this.onStateUpdate(state);
    });

    // Initial render from current state
    this.onStateUpdate(useGameStore.getState());
  }

  private onStateUpdate(state: typeof useGameStore extends { getState: () => infer T } ? T : never) {
    // Update deck count
    this.deckText.setText(`\uD83C\uDCB1 \uB371: ${state.deckRemaining}`);

    // Update turn indicator
    const currentPlayer = state.players.get(state.currentTurnSessionId);
    if (currentPlayer) {
      const isMyTurn = state.currentTurnSessionId === state.localSessionId;
      this.turnIndicator.setText(
        isMyTurn ? "\uD83C\uDFAF \uB2F9\uC2E0\uC758 \uD134!" : `${currentPlayer.name}\uC758 \uD134`
      );
      this.turnIndicator.setColor(isMyTurn ? "#e94560" : "#ffffff");
    }

    // Animations based on state diff
    this.handleAnimations(state);

    // Update player areas
    this.updatePlayerAreas(state.players, state.localSessionId, state.currentTurnSessionId);

    // Update hand cards for local player
    const localPlayer = state.players.get(state.localSessionId);
    if (localPlayer) {
      this.updateHandCards(localPlayer.hand, state);
    }

    // Save state for next diff
    this.prevState = {
      currentTurnSessionId: state.currentTurnSessionId,
      alivePlayers: new Set(
        Array.from(state.players.values())
          .filter((p) => p.isAlive)
          .map((p) => p.sessionId)
      ),
      roundWinner: state.roundWinner,
      lastPlayedCardValue: state.lastPlayedCardValue,
    };
  }

  private handleAnimations(state: any) {
    // Card played animation
    if (
      state.lastPlayedCardValue >= 0 &&
      state.lastPlayedCardValue !== this.prevState.lastPlayedCardValue
    ) {
      this.playCardAnimation();
    }

    // Turn change - pulse new player's area
    if (
      state.currentTurnSessionId &&
      state.currentTurnSessionId !== this.prevState.currentTurnSessionId
    ) {
      // Turn highlight handled in updatePlayerAreas
    }

    // Player eliminated
    for (const [sessionId, player] of state.players) {
      if (
        !player.isAlive &&
        this.prevState.alivePlayers.has(sessionId)
      ) {
        const area = this.playerAreas.get(sessionId);
        if (area) {
          area.playEliminationAnimation();
        }
      }
    }

    // Round winner announcement
    if (state.roundWinner && state.roundWinner !== this.prevState.roundWinner) {
      const winner = state.players.get(state.roundWinner);
      if (winner) {
        this.showRoundWinnerAnimation(winner.name);
      }
    }
  }

  private playCardAnimation() {
    const { width, height } = this.cameras.main;
    const cardFlash = this.add.graphics();
    cardFlash.fillStyle(0xffffff, 0.3);
    cardFlash.fillRoundedRect(width / 2 - 50, height / 2 - 70, 100, 140, 8);
    cardFlash.setAlpha(0);

    this.tweens.add({
      targets: cardFlash,
      alpha: 1,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 300,
      yoyo: true,
      ease: "Quad.easeOut",
      onComplete: () => cardFlash.destroy(),
    });
  }

  private showRoundWinnerAnimation(winnerName: string) {
    this.centerText.setText(`\uD83C\uDFC6 ${winnerName} \uC2B9\uB9AC!`);
    this.centerText.setScale(0.3);
    this.centerText.setAlpha(1);

    this.tweens.add({
      targets: this.centerText,
      scaleX: 1,
      scaleY: 1,
      duration: 600,
      ease: "Back.easeOut",
      onComplete: () => {
        this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: this.centerText,
            alpha: 0,
            duration: 500,
          });
        });
      },
    });
  }

  private updatePlayerAreas(
    players: Map<string, PlayerState>,
    localSessionId: string,
    currentTurnSessionId: string
  ) {
    const { width, height } = this.cameras.main;
    const playerList = Array.from(players.values());
    const otherPlayers = playerList.filter((p) => p.sessionId !== localSessionId);

    // Position other players around the table
    const positions = this.getPlayerPositions(otherPlayers.length, width, height);

    otherPlayers.forEach((player, index) => {
      let area = this.playerAreas.get(player.sessionId);
      if (!area) {
        area = new PlayerArea(this, 0, 0, player);
        this.playerAreas.set(player.sessionId, area);
      }
      const pos = positions[index];
      area.updatePosition(pos.x, pos.y);
      area.updateState(player);
      area.setCurrentTurn(player.sessionId === currentTurnSessionId);
    });

    // Remove areas for players that left
    for (const [sessionId, area] of this.playerAreas) {
      if (!players.has(sessionId)) {
        area.destroy();
        this.playerAreas.delete(sessionId);
      }
    }
  }

  private getPlayerPositions(
    count: number,
    width: number,
    height: number
  ): Array<{ x: number; y: number }> {
    const positions: Array<{ x: number; y: number }> = [];
    const centerX = width / 2;
    const radiusX = width * 0.35;
    const radiusY = height * 0.28;
    const startAngle = -Math.PI / 2;

    for (let i = 0; i < count; i++) {
      const angle = startAngle + (Math.PI * 2 * i) / Math.max(count, 1);
      positions.push({
        x: centerX + Math.cos(angle) * radiusX,
        y: height * 0.38 + Math.sin(angle) * radiusY,
      });
    }

    return positions;
  }

  private updateHandCards(hand: CardInfo[], state: any) {
    const { width, height } = this.cameras.main;

    // Remove old cards
    this.handCards.forEach((card) => card.destroy());
    this.handCards = [];

    // Create new hand cards with wider spacing for bigger cards
    const cardSpacing = 110;
    const startX = width / 2 - ((hand.length - 1) * cardSpacing) / 2;
    const y = height - 110;

    const isMyTurn = state.currentTurnSessionId === state.localSessionId;
    const isPlayPhase = state.phase === "playing";

    hand.forEach((cardInfo, index) => {
      const card = new CardSprite(this, startX + index * cardSpacing, y, cardInfo);

      if (isMyTurn && isPlayPhase) {
        card.setPlayable(true);
        card.setInteractive();
        card.on("pointerup", () => {
          this.onCardClicked(cardInfo);
        });
      }

      this.handCards.push(card);
    });
  }

  private onCardClicked(card: CardInfo) {
    const room = this.game.registry.get("room");
    if (room) {
      room.send("play_card", { cardId: card.id });
    }
  }

  shutdown() {
    this.unsubscribe?.();
    this.playerAreas.forEach((area) => area.destroy());
    this.handCards.forEach((card) => card.destroy());
  }
}
