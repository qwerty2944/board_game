import * as Phaser from "phaser";
import { useGameStore, type CardInfo, type PlayerState } from "@/stores/gameStore";
import { CardSprite } from "./CardSprite";
import { PlayerArea } from "./PlayerArea";

export class LoveLetterScene extends Phaser.Scene {
  private playerAreas: Map<string, PlayerArea> = new Map();
  private handCards: CardSprite[] = [];
  private deckText!: Phaser.GameObjects.Text;
  private turnIndicator!: Phaser.GameObjects.Text;
  private unsubscribe?: () => void;

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
      .text(width / 2, 50, "Deck: 0", {
        fontSize: "18px",
        color: "#f5a623",
      })
      .setOrigin(0.5);

    // Turn indicator
    this.turnIndicator = this.add
      .text(width / 2, height / 2, "", {
        fontSize: "24px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Subscribe to store changes
    this.unsubscribe = useGameStore.subscribe((state) => {
      this.onStateUpdate(state);
    });

    // Initial render from current state
    this.onStateUpdate(useGameStore.getState());
  }

  private onStateUpdate(state: typeof useGameStore extends { getState: () => infer T } ? T : never) {
    // Update deck count
    this.deckText.setText(`Deck: ${state.deckRemaining}`);

    // Update turn indicator
    const currentPlayer = state.players.get(state.currentTurnSessionId);
    if (currentPlayer) {
      const isMyTurn = state.currentTurnSessionId === state.localSessionId;
      this.turnIndicator.setText(
        isMyTurn ? "Your Turn!" : `${currentPlayer.name}'s Turn`
      );
      this.turnIndicator.setColor(isMyTurn ? "#e94560" : "#ffffff");
    }

    // Update player areas
    this.updatePlayerAreas(state.players, state.localSessionId);

    // Update hand cards for local player
    const localPlayer = state.players.get(state.localSessionId);
    if (localPlayer) {
      this.updateHandCards(localPlayer.hand, state);
    }
  }

  private updatePlayerAreas(
    players: Map<string, PlayerState>,
    localSessionId: string
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
    const radiusY = height * 0.3;
    const startAngle = -Math.PI / 2; // Start from top

    for (let i = 0; i < count; i++) {
      const angle = startAngle + (Math.PI * 2 * i) / Math.max(count, 1);
      positions.push({
        x: centerX + Math.cos(angle) * radiusX,
        y: height * 0.4 + Math.sin(angle) * radiusY,
      });
    }

    return positions;
  }

  private updateHandCards(hand: CardInfo[], state: any) {
    const { width, height } = this.cameras.main;

    // Remove old cards
    this.handCards.forEach((card) => card.destroy());
    this.handCards = [];

    // Create new hand cards
    const startX = width / 2 - ((hand.length - 1) * 80) / 2;
    const y = height - 100;

    hand.forEach((cardInfo, index) => {
      const card = new CardSprite(this, startX + index * 80, y, cardInfo);
      const isMyTurn = state.currentTurnSessionId === state.localSessionId;
      const isPlayPhase = state.phase === "playing";

      if (isMyTurn && isPlayPhase) {
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
