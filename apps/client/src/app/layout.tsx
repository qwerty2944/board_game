import type { Metadata } from "next";
import { auth } from "@/auth";
import { Providers } from "@/application/providers";
import { Geist } from "next/font/google";
import { cn } from "@/shared/lib/utils";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "보드게임",
  description: "온라인 멀티플레이어 보드게임",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="ko" className={cn("dark font-sans", geist.variable)}>
      <body className="antialiased">
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
