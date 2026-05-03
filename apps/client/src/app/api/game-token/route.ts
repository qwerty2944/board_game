import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { auth } from "@/auth";
import type { GameTokenPayload } from "@board-game/shared";

const secret = new TextEncoder().encode(
  process.env.GAME_JWT_SECRET || "dev-secret-change-in-production"
);

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload: Omit<GameTokenPayload, "iat" | "exp"> = {
    sub: session.user.id,
    name: session.user.name || "Anonymous",
    image: session.user.image || undefined,
  };

  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(secret);

  return NextResponse.json({ token });
}
