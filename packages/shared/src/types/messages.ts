// Client -> Server messages
export interface ChatMessage {
  text: string;
}

export interface ReadyMessage {
  ready: boolean;
}

export interface StartGameMessage {}

export interface JoinByCodeMessage {
  code: string;
  password?: string;
}

// Server -> Client messages
export interface ErrorMessage {
  code: string;
  message: string;
}

export interface NotificationMessage {
  type: "info" | "warning" | "success" | "error";
  message: string;
}

// Common message types enum
export const MessageType = {
  // Common
  CHAT: "chat",
  READY: "ready",
  START_GAME: "start_game",
  KICK_PLAYER: "kick_player",

  // Love Letter specific
  PLAY_CARD: "play_card",
  SELECT_TARGET: "select_target",
  RESOLVE_EFFECT: "resolve_effect",

  // Server notifications
  ERROR: "error",
  NOTIFICATION: "notification",
  PLAYER_JOINED: "player_joined",
  PLAYER_LEFT: "player_left",
} as const;

export type MessageTypeValue = (typeof MessageType)[keyof typeof MessageType];
