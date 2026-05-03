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
  private targetHintText!: Phaser.GameObjects.Text;
  private targetButtons: Phaser.GameObjects.Container[] = [];
  private selectedTargetIds: string[] = [];
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

    this.targetHintText = this.add
      .text(width / 2, height / 2 + 36, "", {
        fontSize: "18px",
        color: "#00ffaa",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setVisible(false);

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

    this.updateTargetSelection(state);

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

  private updateTargetSelection(state: any) {
    this.clearTargetButtons();

    const isMyPendingAction =
      state.pendingActionType === "awaiting_target" &&
      state.currentTurnSessionId === state.localSessionId;

    if (!isMyPendingAction) {
      this.selectedTargetIds = [];
      this.targetHintText.setVisible(false);
      return;
    }

    const targets = this.getSelectableTargets(state);
    if (targets.length === 0) {
      this.targetHintText.setText("\uc120\ud0dd \uac00\ub2a5\ud55c \ub300\uc0c1\uc774 \uc5c6\uc2b5\ub2c8\ub2e4");
      this.targetHintText.setVisible(true);
      return;
    }

    const isCardinal = state.pendingCardName.includes("Cardinal");
    this.targetHintText.setText(
      isCardinal
        ? "\uad50\ud658\ud560 \ub300\uc0c1 2\uba85\uc744 \uc120\ud0dd\ud558\uc138\uc694"
        : "\ub300\uc0c1\uc744 \uc120\ud0dd\ud558\uc138\uc694"
    );
    this.targetHintText.setVisible(true);

    for (const target of targets) {
      const pos = this.getTargetButtonPosition(target.sessionId, state);
      this.createTargetButton(target, pos.x, pos.y, state);
    }
  }

  private getSelectableTargets(state: any): PlayerState[] {
    const cardValue = state.pendingCardValue;
    const cardName = state.pendingCardName || "";
    const localSessionId = state.localSessionId;
    let targets = (Array.from(state.players.values()) as PlayerState[]).filter((player) => {
      if (!player.isAlive) return false;
      if (player.isProtected) return false;
      if (player.sessionId === localSessionId) {
        return cardValue === 5 && !cardName.includes("Count");
      }
      return true;
    }) as PlayerState[];

    if (state.sycophantTarget && cardValue !== 4) {
      targets = targets.filter((player) => player.sessionId === state.sycophantTarget);
    }

    return targets;
  }

  private getTargetButtonPosition(sessionId: string, state: any): { x: number; y: number } {
    const { width, height } = this.cameras.main;
    if (sessionId === state.localSessionId) {
      return { x: width / 2, y: height - 250 };
    }

    const area = this.playerAreas.get(sessionId);
    if (area) {
      return { x: area.x, y: area.y + 58 };
    }

    return { x: width / 2, y: height / 2 + 90 };
  }

  private createTargetButton(player: PlayerState, x: number, y: number, state: any) {
    const isSelected = this.selectedTargetIds.includes(player.sessionId);
    const container = this.add.container(x, y);
    const bg = this.add
      .rectangle(0, 0, 132, 34, isSelected ? 0x00ffaa : 0xe94560, isSelected ? 0.95 : 0.9)
      .setStrokeStyle(2, 0xffffff, 0.85);
    const label = this.add
      .text(0, 0, player.sessionId === state.localSessionId ? "\ub098" : player.name, {
        fontSize: "14px",
        color: isSelected ? "#10231d" : "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(132, 34);
    container.setInteractive(
      new Phaser.Geom.Rectangle(-66, -17, 132, 34),
      Phaser.Geom.Rectangle.Contains
    );
    container.on("pointerup", () => this.onTargetClicked(player.sessionId, state));
    this.targetButtons.push(container);
  }

  private onTargetClicked(targetSessionId: string, state: any) {
    if (state.pendingCardName.includes("Cardinal")) {
      if (this.selectedTargetIds.includes(targetSessionId)) {
        this.selectedTargetIds = this.selectedTargetIds.filter((id) => id !== targetSessionId);
      } else if (this.selectedTargetIds.length < 2) {
        this.selectedTargetIds = [...this.selectedTargetIds, targetSessionId];
      }

      if (this.selectedTargetIds.length < 2) {
        this.updateTargetSelection({ ...state });
        return;
      }

      this.sendTargetSelection(this.selectedTargetIds[0], state, [...this.selectedTargetIds]);
      this.selectedTargetIds = [];
      return;
    }

    const selectedPlayerIds = state.pendingCardName.includes("Baroness")
      ? [targetSessionId]
      : undefined;
    this.sendTargetSelection(targetSessionId, state, selectedPlayerIds);
  }

  private sendTargetSelection(
    targetSessionId: string,
    state: any,
    selectedPlayerIds?: string[]
  ) {
    const payload: {
      targetSessionId: string;
      guessedValue?: number;
      selectedPlayerIds?: string[];
      optionalDraw?: boolean;
    } = { targetSessionId };

    if (selectedPlayerIds) {
      payload.selectedPlayerIds = selectedPlayerIds;
    }

    if (this.requiresGuess(state.pendingCardValue, state.pendingCardName)) {
      const guess = this.promptForGuess(state.pendingCardValue, state.pendingCardName);
      if (guess === null) return;
      payload.guessedValue = guess;
      if (state.pendingCardName.includes("Bishop")) {
        payload.optionalDraw = false;
      }
    }

    const room = this.game.registry.get("room");
    if (room) {
      room.send("select_target", payload);
    }
    this.clearTargetButtons();
    this.targetHintText.setVisible(false);
  }

  private requiresGuess(cardValue: number, cardName: string): boolean {
    return cardValue === 1 || cardName.includes("Bishop");
  }

  private promptForGuess(cardValue: number, cardName: string): number | null {
    const input = window.prompt(
      cardName.includes("Bishop")
        ? "\ucd94\uce21\ud560 \uce74\ub4dc \uc22b\uc790\ub97c \uc785\ub825\ud558\uc138\uc694 (0-9)"
        : "\ucd94\uce21\ud560 \uce74\ub4dc \uc22b\uc790\ub97c \uc785\ub825\ud558\uc138\uc694 (2-8)",
      cardValue === 1 ? "2" : "5"
    );
    if (input === null) return null;

    const guess = Number(input);
    if (!Number.isInteger(guess)) return null;
    if (cardValue === 1 && guess === 1) return null;
    if (cardName.includes("Bishop")) {
      return guess >= 0 && guess <= 9 ? guess : null;
    }
    return guess >= 2 && guess <= 8 ? guess : null;
  }

  private clearTargetButtons() {
    this.targetButtons.forEach((button) => button.destroy());
    this.targetButtons = [];
  }

  shutdown() {
    this.unsubscribe?.();
    this.playerAreas.forEach((area) => area.destroy());
    this.handCards.forEach((card) => card.destroy());
    this.clearTargetButtons();
  }
}
