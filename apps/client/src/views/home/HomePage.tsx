"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { GAME_REGISTRY } from "@board-game/shared";
import { LoginForm } from "@/features/authenticating/ui/LoginForm";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";

export function HomePage() {
  const { data: session, status } = useSession();

  return (
    <main className="flex h-dvh flex-col items-center justify-center p-8">
      <h1 className="mb-2 text-4xl font-bold text-white">보드게임</h1>
      <p className="mb-8 text-gray-400">친구들과 온라인으로 보드게임을 즐기세요</p>

      {status === "loading" && (
        <p className="text-gray-400">로딩 중...</p>
      )}

      {status === "unauthenticated" && <LoginForm />}

      {status === "authenticated" && session?.user && (
        <div className="flex flex-col items-center gap-6">
          <p className="text-gray-300">
            환영합니다,{" "}
            <span className="font-semibold text-white">{session.user.name}</span>님
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {Object.values(GAME_REGISTRY).map((game) => (
              <Card key={game.id} className="border-gray-700 bg-gray-800/50 transition-transform hover:scale-105">
                <CardContent className="p-4">
                  <h3 className="text-lg font-bold text-white">{game.name}</h3>
                  <p className="mt-1 text-sm text-gray-400">{game.description}</p>
                  <p className="mt-2 text-xs text-gray-500">
                    {game.minPlayers}-{game.maxPlayers}명
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-3">
            <Link href="/lobby">
              <Button>로비로 이동</Button>
            </Link>
            <Button variant="outline" onClick={() => signOut()}>
              로그아웃
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
