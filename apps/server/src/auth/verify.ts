import { jwtVerify } from "jose";
import { config } from "../config.js";
import type { GameTokenPayload } from "@board-game/shared";

const secretKey = new TextEncoder().encode(config.gameJwtSecret);

export interface VerifiedUser {
  id: string;
  name: string;
  image?: string;
}

export async function verifyGameToken(token: string): Promise<VerifiedUser> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    const data = payload as unknown as GameTokenPayload;

    return {
      id: data.sub,
      name: data.name,
      image: data.image,
    };
  } catch (error) {
    throw new Error("Invalid or expired game token");
  }
}
