"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session) {
    router.push("/");
    return null;
  }

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="mb-6 text-3xl font-bold text-white">Profile</h1>

      <div className="rounded-xl border border-gray-700 bg-game-surface p-6">
        {session.user?.image && (
          <img
            src={session.user.image}
            alt="Profile"
            className="mx-auto mb-4 h-20 w-20 rounded-full"
          />
        )}
        <h2 className="text-center text-xl font-semibold text-white">
          {session.user?.name}
        </h2>
        <p className="mt-1 text-center text-sm text-gray-400">
          {session.user?.email}
        </p>

        <div className="mt-6 space-y-3">
          <Link
            href="/lobby"
            className="block w-full rounded-lg bg-primary-600 px-4 py-2 text-center font-semibold text-white hover:bg-primary-700"
          >
            Go to Lobby
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full rounded-lg border border-gray-600 px-4 py-2 text-gray-300 hover:bg-gray-800"
          >
            Sign Out
          </button>
        </div>
      </div>
    </main>
  );
}
