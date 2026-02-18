"use client"

import dynamic from 'next/dynamic'
import SwipeDeck from '@/components/matching/SwipeDeck'
import ReelsView from '@/components/matching/ReelsView'
import MatchingGrid from '@/components/dashboard/MatchingGrid'
import MatchingControls from '@/components/dashboard/MatchingControls'
import MemberMutualMatches from '@/components/dashboard/MemberMutualMatches'
import { Button } from '@/components/ui/button'
import { Undo2, RotateCcw, RefreshCcw, Grid as GridIcon, Film, MessageSquare, SlidersHorizontal, Sparkles } from 'lucide-react'
import * as Tooltip from '@radix-ui/react-tooltip'

const DynamicAutoMessage = dynamic(() => import('@/components/matching/AutoMessageSettings'), { ssr: false })

export type MemberMatchingSectionProps = {
  showAuto: boolean
  showPrefs: boolean
  matchingView: 'grid' | 'reels'
  suggestions: any[]
  reelsEffects: boolean
  gridAnim: Record<string, 'LEFT' | 'RIGHT'>
  matchLoading: boolean
  matchError: string | null
  mutualLoading: boolean
  mutual: any[]
  resetting: null | 'soft' | 'hard'
  resetResult: null | { mode: 'soft' | 'hard'; count: number }
  onSwipe: (id: string, action: 'LIKE' | 'PASS') => void
  onReload: () => void
  onUndo: () => void
  onShowPrefs: () => void
  onResetSoft: () => void
  onResetHard: () => void
  onMessage: (id: string) => void
  onSetView: (view: 'grid' | 'reels') => void
  onOpenAuto: () => void
  onTogglePrefs: () => void
  onToggleEffects: () => void
}

export default function MemberMatchingSection({ showAuto, showPrefs, matchingView, suggestions, reelsEffects, gridAnim, matchLoading, matchError, mutualLoading, mutual, resetting, resetResult, onSwipe, onReload, onUndo, onShowPrefs, onResetSoft, onResetHard, onMessage, onSetView, onOpenAuto, onTogglePrefs, onToggleEffects }: MemberMatchingSectionProps) {
  if (showAuto) {
    return <DynamicAutoMessage />
  }
  if (showPrefs) {
    const PreferencesForm = require('@/components/matching/PreferencesForm').default
    return <PreferencesForm />
  }

  return (
    <>
      {matchingView === 'reels' ? (
        <div className="flex items-start justify-center gap-4">
          {/* Left vertical controls (Undo/Resets) */}
          <div className="hidden md:flex flex-col gap-2 sticky top-24 self-start">
            <Button variant="outline" size="sm" onClick={onUndo} className="uppercase tracking-widest font-light inline-flex items-center gap-2">
              <Undo2 className="h-4 w-4" /> RÜCKGÄNGIG
            </Button>
            <Button variant="outline" size="sm" onClick={onResetSoft} className="uppercase tracking-widest font-light inline-flex items-center gap-2">
              <RotateCcw className="h-4 w-4" /> SOFT-RESET
            </Button>
            <Button variant="destructive" size="sm" onClick={onResetHard} className="uppercase tracking-widest font-light inline-flex items-center gap-2">
              <RefreshCcw className="h-4 w-4" /> ZURÜCKSETZEN
            </Button>
          </div>

          {/* Center reels view */}
          <div className="flex-1 max-w-3xl">
            <ReelsView
              items={suggestions.map((s: any) => ({ id: s.id, displayName: s.displayName, image: s.image, avatar: s.avatar, city: s.city, country: s.country, services: s.services, media: s.media, gallery: s.gallery }))}
              onSwipe={(id, action) => onSwipe(id, action)}
              onReload={onReload}
              onUndo={onUndo}
              effectsEnabled={reelsEffects}
            />
          </div>

          {/* Right vertical toolbar (icon-only, stacked) with tooltips */}
          <div className="hidden md:flex flex-col gap-2 sticky top-24 self-start">
            <Tooltip.Provider delayDuration={100}>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-pressed={false}
                    aria-label="Grid"
                    onClick={() => onSetView('grid')}
                    className="h-9 w-9 p-0 rounded-full inline-flex items-center justify-center"
                  >
                    <GridIcon className="h-4 w-4" strokeWidth={1} />
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content side="right" sideOffset={8} className="rounded bg-gray-900 text-white px-2 py-1 text-xs shadow-md">Grid</Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>

              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-pressed={true}
                    aria-label="Tinder Style"
                    onClick={() => onSetView('reels')}
                    className="h-9 w-9 p-0 rounded-full inline-flex items-center justify-center border-pink-500 text-pink-600"
                  >
                    <Film className="h-4 w-4" strokeWidth={1} />
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content side="right" sideOffset={8} className="rounded bg-gray-900 text-white px-2 py-1 text-xs shadow-md">Tinder Style</Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>

              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="Auto Nachricht"
                    onClick={onOpenAuto}
                    className={`h-9 w-9 p-0 rounded-full inline-flex items-center justify-center ${showAuto ? 'border-pink-500 text-pink-600' : ''}`}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content side="right" sideOffset={8} className="rounded bg-gray-900 text-white px-2 py-1 text-xs shadow-md">Auto Nachricht</Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>

              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-pressed={showPrefs}
                    aria-label="Präferenzen"
                    onClick={onTogglePrefs}
                    className={`h-9 w-9 p-0 rounded-full inline-flex items-center justify-center ${showPrefs ? 'border-pink-500 text-pink-600' : ''}`}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content side="right" sideOffset={8} className="rounded bg-gray-900 text-white px-2 py-1 text-xs shadow-md">Präferenzen</Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>

              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-pressed={reelsEffects}
                    aria-label="Effekte"
                    onClick={onToggleEffects}
                    className={`h-9 w-9 p-0 rounded-full inline-flex items-center justify-center ${reelsEffects ? 'border-pink-500 text-pink-600' : ''}`}
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content side="right" sideOffset={8} className="rounded bg-gray-900 text-white px-2 py-1 text-xs shadow-md">Effekte</Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>
          </div>
        </div>
      ) : (
        <>
          <div className="md:hidden">
            <SwipeDeck fetchLimit={20} />
          </div>
          {/* Desktop/Tablet: Grid */}
          <div className="hidden md:block">
            <MatchingGrid
              matchLoading={matchLoading}
              matchError={matchError}
              suggestions={suggestions}
              gridAnim={gridAnim}
              onSwipe={onSwipe}
              onReload={onReload}
              onShowPrefs={onShowPrefs}
            />
          </div>
        </>
      )}

      {/* Controls + Mutual Matches for MEMBER */}
      {matchingView !== 'reels' && (
        <MatchingControls
          resetting={resetting}
          resetResult={resetResult}
          onUndo={onUndo}
          onResetSoft={onResetSoft}
          onResetHard={onResetHard}
        />
      )}
      {/* Mutual Matches for MEMBER */}
      <MemberMutualMatches loading={mutualLoading} mutual={mutual} onMessage={onMessage} />
    </>
  )
}
