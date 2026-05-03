/**
 * Abstract game engine interface.
 * All game logic implementations must extend this.
 * Pure TypeScript - no Colyseus dependency.
 */
export interface GameEvent {
  type: string;
  payload: Record<string, unknown>;
}

export interface PlayerInfo {
  sessionId: string;
  name: string;
}

export abstract class GameEngine<TState, TAction> {
  abstract initialize(players: PlayerInfo[]): TState;
  abstract processAction(state: TState, action: TAction): TState;
  abstract getEvents(): GameEvent[];
  abstract isGameOver(state: TState): boolean;
  abstract getWinner(state: TState): string | null;
  abstract getValidActions(state: TState, playerId: string): TAction[];
}
