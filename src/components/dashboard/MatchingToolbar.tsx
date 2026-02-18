"use client"

import { Button } from '@/components/ui/button'
import { Grid as GridIcon, Film } from 'lucide-react'

type Props = {
  isMember: boolean
  showAuto: boolean
  showPrefs: boolean
  reelsEffects: boolean
  matchingView: 'grid' | 'reels'
  onSetView: (view: 'grid' | 'reels') => void
  onOpenAuto: () => void
  onTogglePrefs: () => void
  onToggleEffects: () => void
}

export default function MatchingToolbar({ isMember, showAuto, showPrefs, reelsEffects, matchingView, onSetView, onOpenAuto, onTogglePrefs, onToggleEffects }: Props) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-thin tracking-wider text-gray-800">{showAuto ? 'MATCHING AUTOMATISCHE NACHRICHT' : (showPrefs ? 'MATCHING PRÄFERENZEN' : 'MATCHING')}</h2>
          <div className="w-16 h-px bg-pink-500 mt-3"></div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            aria-pressed={matchingView === 'grid'}
            aria-label="Grid"
            onClick={() => onSetView('grid')}
            className={`h-9 w-9 p-0 rounded-full inline-flex items-center justify-center ${matchingView === 'grid' ? 'border-pink-500 text-pink-600' : 'text-gray-700 hover:border-pink-500 hover:text-pink-600'}`}
          >
            <GridIcon className="h-4 w-4" strokeWidth={1} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-pressed={matchingView === 'reels'}
            aria-label="Reels"
            onClick={() => onSetView('reels')}
            className={`h-9 w-9 p-0 rounded-full inline-flex items-center justify-center ${matchingView === 'reels' ? 'border-pink-500 text-pink-600' : 'text-gray-700 hover:border-pink-500 hover:text-pink-600'}`}
          >
            <Film className="h-4 w-4" strokeWidth={1} />
          </Button>
        </div>
      </div>
      {isMember && (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:flex sm:items-center sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenAuto}
            className={`w-full sm:w-auto uppercase tracking-widest ${showAuto ? 'border-pink-500 text-pink-600' : 'text-gray-700 hover:border-pink-500 hover:text-pink-600'}`}
          >
            AUTO-NACHRICHT
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-pressed={showPrefs}
            onClick={onTogglePrefs}
            className="w-full sm:w-auto uppercase tracking-widest text-gray-700 hover:border-pink-500 hover:text-pink-600"
          >
            {showPrefs ? 'VORSCHLÄGE' : 'PRÄFERENZEN'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-pressed={reelsEffects}
            onClick={onToggleEffects}
            className={`w-full sm:w-auto uppercase tracking-widest ${reelsEffects ? 'border-pink-500 text-pink-600' : 'text-gray-700 hover:border-pink-500 hover:text-pink-600'}`}
          >
            EFFEKTE
          </Button>
        </div>
      )}
    </div>
  )
}
