export const env = {
  colyseusUrl: process.env.NEXT_PUBLIC_COLYSEUS_URL || "ws://localhost:2567",
  gameJwtSecret: process.env.GAME_JWT_SECRET || "dev-secret-change-in-production",
} as const;
