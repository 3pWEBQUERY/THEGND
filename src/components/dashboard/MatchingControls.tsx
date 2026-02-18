"use client"

import * as Tooltip from '@radix-ui/react-tooltip'
import { Button } from '@/components/ui/button'
import { Undo2 } from 'lucide-react'

type ResetResult = { mode: 'soft' | 'hard'; count: number }

type Props = {
  resetting: null | 'soft' | 'hard'
  resetResult: null | ResetResult
  onUndo: () => void
  onResetSoft: () => void
  onResetHard: () => void
}

export default function MatchingControls({ resetting, resetResult, onUndo, onResetSoft, onResetHard }: Props) {
  return (
    <Tooltip.Provider delayDuration={100}>
      <div className="mt-8 grid grid-cols-1 gap-2 sm:flex sm:items-center sm:gap-3">
        <Button variant="outline" size="sm" onClick={onUndo} className="w-full sm:w-auto uppercase tracking-widest text-gray-700 hover:border-gray-400 hover:text-pink-600 inline-flex items-center justify-center sm:justify-start gap-2">
          <Undo2 className="h-4 w-4" />
          RÜCKGÄNGIG
        </Button>

        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onResetSoft}
              disabled={!!resetting}
              className={`w-full sm:w-auto uppercase tracking-widest inline-flex items-center justify-center sm:justify-start gap-2 ${resetting ? 'text-gray-400' : 'text-gray-700 hover:border-amber-500 hover:text-amber-600'}`}
            >
              SOFT-RESET
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content sideOffset={6} className="rounded bg-gray-900 text-white px-2 py-1 text-xs shadow-md max-w-xs">
              Setzt nur PASS-Entscheidungen zurück. Likes bleiben erhalten. Hilfreich, wenn du versehentlich zu viele Pässe gegeben hast.
              <Tooltip.Arrow className="fill-gray-900" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>

        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <Button variant="destructive" size="sm" onClick={onResetHard} disabled={!!resetting} className="w-full sm:w-auto uppercase tracking-widest">ZURÜCKSETZEN</Button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content sideOffset={6} className="rounded bg-gray-900 text-white px-2 py-1 text-xs shadow-md max-w-xs">
              Setzt ALLE Likes und PASS-Entscheidungen zurück. Dein Matching-Verlauf wird geleert und Vorschläge werden neu aufgebaut.
              <Tooltip.Arrow className="fill-gray-900" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>

        {resetting && (
          <span className="text-[11px] text-gray-500">Setze zurück… ({resetting === 'soft' ? 'Soft' : 'Hard'})</span>
        )}
        {!resetting && resetResult && (
          <span className="text-[11px] text-gray-600">Zurückgesetzt: {resetResult.count} Einträge {resetResult.mode === 'soft' ? '(Soft)' : '(Hard)'}</span>
        )}
      </div>
    </Tooltip.Provider>
  )
}
