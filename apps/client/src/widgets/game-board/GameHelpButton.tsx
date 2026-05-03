"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { getAllCardDescriptions } from "@/game/data/card-descriptions-ko";

export function GameHelpButton() {
  const [open, setOpen] = useState(false);
  const cards = getAllCardDescriptions();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed right-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-gray-600 bg-gray-800/90 text-lg font-bold text-white shadow-lg transition-colors hover:bg-gray-700"
        title="게임 규칙 도움말"
      >
        ?
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>러브레터 규칙 안내</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm text-gray-200">
            {/* Game Objective */}
            <section>
              <h3 className="mb-1 font-bold text-white">게임 목표</h3>
              <p>
                공주에게 연애편지를 전달하세요! 라운드마다 마지막까지 살아남거나,
                라운드 종료 시 가장 높은 값의 카드를 가진 플레이어가 승리합니다.
                필요한 토큰 수를 먼저 모으면 최종 승리!
              </p>
            </section>

            {/* Basic Rules */}
            <section>
              <h3 className="mb-1 font-bold text-white">기본 규칙</h3>
              <ul className="list-inside list-disc space-y-1 text-gray-300">
                <li>각 턴에 카드 1장을 뽑고, 손패 2장 중 1장을 냅니다.</li>
                <li>낸 카드의 효과를 실행합니다.</li>
                <li>탈락하면 손패를 공개하고 라운드에서 제외됩니다.</li>
                <li>덱이 떨어지거나 1명만 남으면 라운드 종료입니다.</li>
              </ul>
            </section>

            {/* Tokens to Win */}
            <section>
              <h3 className="mb-1 font-bold text-white">승리 토큰 수 (인원별)</h3>
              <div className="flex gap-3 text-gray-300">
                <span>2인: 7개</span>
                <span>3인: 5개</span>
                <span>4~8인: 4개</span>
              </div>
            </section>

            {/* Special Rules */}
            <section>
              <h3 className="mb-1 font-bold text-white">특수 규칙</h3>
              <ul className="list-inside list-disc space-y-1 text-gray-300">
                <li><strong>백작부인 강제:</strong> 왕(6) 또는 왕자(5)와 함께 들고 있으면 반드시 백작부인을 내야 합니다.</li>
                <li><strong>공주 자폭:</strong> 공주를 어떤 이유로든 버리면 즉시 탈락합니다.</li>
                <li><strong>보호 상태:</strong> 시녀로 보호 중인 플레이어는 대상으로 지정할 수 없습니다.</li>
              </ul>
            </section>

            {/* Card List */}
            <section>
              <h3 className="mb-2 font-bold text-white">전체 카드 목록</h3>
              <div className="overflow-x-auto rounded-lg border border-gray-700">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-800 text-gray-300">
                    <tr>
                      <th className="px-2 py-1.5">값</th>
                      <th className="px-2 py-1.5">카드</th>
                      <th className="px-2 py-1.5">효과</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {cards.map((card, i) => (
                      <tr key={i} className="hover:bg-gray-800/50">
                        <td className="px-2 py-1.5 font-mono">{card.value}</td>
                        <td className="whitespace-nowrap px-2 py-1.5">
                          {card.symbol} {card.shortNameKo}
                        </td>
                        <td className="px-2 py-1.5 text-gray-300">{card.effect}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
