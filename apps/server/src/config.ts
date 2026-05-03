export const config = {
  port: parseInt(process.env.HATHORA_PORT || process.env.PORT || "2567", 10),
  gameJwtSecret: process.env.GAME_JWT_SECRET || "dev-secret-change-in-production",
  nodeEnv: process.env.NODE_ENV || "development",
  get isDev() {
    return this.nodeEnv === "development";
  },
};
