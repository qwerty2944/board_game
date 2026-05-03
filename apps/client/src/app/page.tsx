"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { GAME_REGISTRY } from "@board-game/shared";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("비밀번호가 틀렸습니다 (테스트: 1234)");
    } else {
      router.push("/lobby");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="mb-4 text-5xl font-bold text-white">Board Game Platform</h1>
      <p className="mb-8 text-lg text-gray-300">
        Play board games with friends online
      </p>

      {status === "loading" && (
        <div className="text-gray-400">Loading...</div>
      )}

      {status === "unauthenticated" && (
        <form onSubmit={handleLogin} className="flex w-72 flex-col gap-3">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="닉네임"
            required
            className="rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-white placeholder-gray-500"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호 (테스트: 1234)"
            required
            className="rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-white placeholder-gray-500"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" className="btn-primary">
            로그인
          </button>

          {/* TODO: 프로덕션에서 OAuth 복원
          <div className="mt-4 border-t border-gray-700 pt-4">
            <button onClick={() => signIn("google")} className="btn-primary w-full mb-2">
              Sign in with Google
            </button>
            <button onClick={() => signIn("discord")} className="btn-primary w-full">
              Sign in with Discord
            </button>
          </div>
          */}
        </form>
      )}

      {status === "authenticated" && session?.user && (
        <div className="flex flex-col items-center gap-6">
          <p className="text-gray-300">
            Welcome, <span className="font-semibold text-white">{session.user.name}</span>
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {Object.values(GAME_REGISTRY).map((game) => (
              <div key={game.id} className="game-card">
                <h3 className="text-xl font-bold text-white">{game.name}</h3>
                <p className="mt-1 text-sm text-gray-400">{game.description}</p>
                <p className="mt-2 text-xs text-gray-500">
                  {game.minPlayers}-{game.maxPlayers} players
                </p>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Link href="/lobby" className="btn-accent">
              Go to Lobby
            </Link>
            <button
              onClick={() => signOut()}
              className="rounded-lg border border-gray-600 px-4 py-2 text-gray-300 hover:bg-gray-800"
            >
              로그아웃
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
