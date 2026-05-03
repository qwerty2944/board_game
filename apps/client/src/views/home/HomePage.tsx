"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoginForm } from "@/features/authenticating/ui/LoginForm";
import { Button } from "@/shared/ui/button";

export function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/lobby");
    }
  }, [status, router]);

  return (
    <main className="flex h-dvh flex-col items-center justify-center p-8">
      <h1 className="mb-2 text-4xl font-bold text-white">보드게임</h1>
      <p className="mb-8 text-gray-400">친구들과 온라인으로 보드게임을 즐기세요</p>

      {status === "loading" && (
        <p className="text-gray-400">로딩 중...</p>
      )}

      {status === "unauthenticated" && <LoginForm />}

      {status === "authenticated" && session?.user && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-gray-400">로비로 이동 중...</p>
          <Button variant="outline" onClick={() => signOut()}>
            로그아웃
          </Button>
        </div>
      )}
    </main>
  );
}
