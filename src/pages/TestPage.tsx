import { motion } from 'framer-motion'
import { useMemo, type ReactNode } from 'react'
import { RUSH_DIFFICULTIES, RushGame } from '../components/rush/RushGame'
import { TypingTest } from '../components/typing/TypingTest'
import type { TestDefinition } from '../components/typing/types'
import { Segmented } from '../components/ui/Segmented'
import { Select } from '../components/ui/Select'
import {
  buildPassageStream,
  CODE_LANGUAGES,
  DIFFICULTIES,
  generateWords,
  languageLabel,
  LENGTH_FILTERS,
  PASSAGE_CATEGORIES,
  passageCategoryLabel,
  pickPassage,
  pickQuote,
  pickSnippet,
  QUOTE_CATEGORIES,
  quoteCategoryLabel,
  type CategoryFilter,
  type DifficultyFilter,
  type PassageCategory,
} from '../content'
import { cn } from '../lib/cn'
import { MODE_INFO } from '../lib/modes'
import { useApp, type ModeConfig } from '../store/app'
import { CLASSIC_DURATIONS, GAME_MODES, type GameMode, type ZenLength } from '../types'

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

const passageLabel = (category: CategoryFilter<PassageCategory>, difficulty: DifficultyFilter) =>
  [category === 'all' ? 'Mixed topics' : passageCategoryLabel(category), difficulty === 'any' ? null : capitalize(difficulty)]
    .filter(Boolean)
    .join(' · ')

/** Builds the test definition (text source, timer, record key) for the selected mode. */
function buildDefinition(mode: Exclude<GameMode, 'rush'>, config: ModeConfig): TestDefinition {
  switch (mode) {
    case 'classic': {
      const { duration, source, category, difficulty } = config.classic
      if (source === 'words') {
        return {
          mode,
          configLabel: `${duration}s · Words`,
          recordKey: `classic-${duration}`,
          timeLimit: duration,
          create: () => ({
            text: generateWords(Math.max(60, duration * 4), difficulty),
            meta: { label: difficulty === 'any' ? 'Common words' : `${capitalize(difficulty)} words` },
          }),
          more: () => generateWords(40, difficulty),
        }
      }
      const query = { category, difficulty }
      return {
        mode,
        configLabel: `${duration}s · Passages`,
        recordKey: `classic-${duration}`,
        timeLimit: duration,
        create: () => {
          const stream = buildPassageStream(query, Math.max(400, duration * 14))
          return { text: stream.text, id: stream.ids[0], meta: { label: passageLabel(category, difficulty) } }
        },
        more: () => pickPassage(query).text,
      }
    }
    case 'zen': {
      const { length, category, difficulty } = config.zen
      const query = { category, difficulty }
      if (length === 'endless') {
        return {
          mode,
          configLabel: 'Endless',
          recordKey: 'zen',
          manualFinish: true,
          progressStyle: 'clock',
          create: () => {
            const stream = buildPassageStream(query, 600)
            return { text: stream.text, id: stream.ids[0], meta: { label: passageLabel(category, difficulty) } }
          },
          more: () => pickPassage(query).text,
        }
      }
      return {
        mode,
        configLabel: capitalize(length),
        recordKey: 'zen',
        manualFinish: true,
        create: () => {
          const passage = pickPassage({ ...query, length })
          return {
            text: passage.text,
            id: passage.id,
            meta: { label: `${passageCategoryLabel(passage.category)} · ${capitalize(passage.difficulty)}` },
          }
        },
      }
    }
    case 'code': {
      const { language } = config.code
      return {
        mode,
        configLabel: language === 'all' ? 'All languages' : languageLabel(language),
        recordKey: 'code',
        code: true,
        describe: (payload) => (payload.language ? languageLabel(payload.language) : 'Code'),
        create: () => {
          const snippet = pickSnippet(language)
          return {
            text: snippet.code,
            id: snippet.id,
            language: snippet.language,
            meta: { title: snippet.title, label: languageLabel(snippet.language) },
          }
        },
      }
    }
    case 'quote': {
      const { category, length } = config.quote
      return {
        mode,
        configLabel: category === 'all' ? 'All categories' : quoteCategoryLabel(category),
        recordKey: 'quote',
        create: () => {
          const quote = pickQuote({ category, length })
          return {
            text: quote.text,
            id: quote.id,
            meta: quote.author
              ? { author: quote.author, source: quote.source, label: quoteCategoryLabel(quote.category) }
              : { label: `Original passage · ${quoteCategoryLabel(quote.category)}` },
          }
        },
        describe: (payload) => payload.meta?.label?.replace('Original passage · ', '') ?? 'Quote',
      }
    }
  }
}

function Divider() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-line" aria-hidden />
}

const ALL_CATEGORIES = [{ value: 'all' as const, label: 'All topics' }, ...PASSAGE_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))]
const ALL_DIFFICULTIES = [{ value: 'any' as const, label: 'Any difficulty' }, ...DIFFICULTIES.map((d) => ({ value: d.id, label: d.label }))]

function ConfigBar({ mode }: { mode: GameMode }) {
  const { config, updateConfig } = useApp()
  let content: ReactNode = null

  if (mode === 'classic') {
    const c = config.classic
    content = (
      <>
        <Segmented
          id="classic-source"
          label="Text source"
          value={c.source}
          onChange={(source) => updateConfig('classic', { source })}
          options={[
            { value: 'words', label: 'Words' },
            { value: 'passages', label: 'Passages' },
          ]}
        />
        <Divider />
        <Segmented
          id="classic-duration"
          label="Test duration"
          value={c.duration}
          onChange={(duration) => updateConfig('classic', { duration })}
          options={CLASSIC_DURATIONS.map((d) => ({ value: d, label: `${d}s`, title: `${d} seconds` }))}
        />
        <Divider />
        {c.source === 'passages' && (
          <Select compact label="Topic" value={c.category} options={ALL_CATEGORIES} onChange={(category) => updateConfig('classic', { category })} />
        )}
        <Select compact label="Difficulty" value={c.difficulty} options={ALL_DIFFICULTIES} onChange={(difficulty) => updateConfig('classic', { difficulty })} />
      </>
    )
  } else if (mode === 'zen') {
    const c = config.zen
    content = (
      <>
        <Segmented
          id="zen-length"
          label="Text length"
          value={c.length}
          onChange={(length: ZenLength) => updateConfig('zen', { length })}
          options={[...LENGTH_FILTERS.map((l) => ({ value: l.id as ZenLength, label: l.label })), { value: 'endless', label: 'Endless' }]}
        />
        <Divider />
        <Select compact label="Topic" value={c.category} options={ALL_CATEGORIES} onChange={(category) => updateConfig('zen', { category })} />
        <Select compact label="Difficulty" value={c.difficulty} options={ALL_DIFFICULTIES} onChange={(difficulty) => updateConfig('zen', { difficulty })} />
      </>
    )
  } else if (mode === 'code') {
    content = (
      <Segmented
        id="code-language"
        label="Programming language"
        value={config.code.language}
        onChange={(language) => updateConfig('code', { language })}
        options={[{ value: 'all' as const, label: 'All' }, ...CODE_LANGUAGES.map((l) => ({ value: l.id, label: l.label }))]}
      />
    )
  } else if (mode === 'quote') {
    const c = config.quote
    content = (
      <>
        <Segmented
          id="quote-length"
          label="Quote length"
          value={c.length}
          onChange={(length) => updateConfig('quote', { length })}
          options={LENGTH_FILTERS.map((l) => ({ value: l.id, label: l.label }))}
        />
        <Divider />
        <Select
          compact
          label="Quote category"
          value={c.category}
          options={[{ value: 'all' as const, label: 'All categories' }, ...QUOTE_CATEGORIES.map((q) => ({ value: q.id, label: q.label }))]}
          onChange={(category) => updateConfig('quote', { category })}
        />
      </>
    )
  } else {
    content = (
      <Segmented
        id="rush-difficulty"
        label="Rush difficulty"
        value={config.rush.difficulty}
        onChange={(difficulty) => updateConfig('rush', { difficulty })}
        options={RUSH_DIFFICULTIES.map((d) => ({ value: d.id, label: d.label }))}
      />
    )
  }

  return (
    <div className="mx-auto flex max-w-full items-center overflow-x-auto rounded-xl border border-line bg-bg-2/70 p-1 [scrollbar-width:none]">
      {content}
    </div>
  )
}

export function TestPage() {
  const { mode, setMode, config, focusMode } = useApp()

  const definition = useMemo(() => (mode === 'rush' ? null : buildDefinition(mode, config)), [mode, config])
  const testKey = mode === 'rush' ? `rush-${config.rush.difficulty}` : `${mode}-${JSON.stringify(config[mode])}`

  return (
    <div className="mx-auto w-full max-w-5xl">
      <motion.div
        animate={{ opacity: focusMode ? 0 : 1 }}
        transition={{ duration: 0.25 }}
        className={cn('mb-10 flex flex-col items-center gap-3 sm:mb-14', focusMode && 'pointer-events-none')}
      >
        <div className="max-w-full overflow-x-auto [scrollbar-width:none]">
          <Segmented
            id="mode"
            label="Game mode"
            size="md"
            value={mode}
            onChange={setMode}
            options={GAME_MODES.map((m, i) => {
              const info = MODE_INFO[m]
              const Icon = info.icon
              return {
                value: m,
                label: <span className="sr-only sm:not-sr-only">{info.label}</span>,
                icon: <Icon className="size-4" aria-hidden />,
                title: `${info.label}: ${info.description} (Alt + ${i + 1})`,
              }
            })}
          />
        </div>
        <ConfigBar mode={mode} />
      </motion.div>

      <div className="mx-auto max-w-4xl">
        {mode === 'rush' ? (
          <RushGame key={testKey} difficulty={config.rush.difficulty} onChangeMode={setMode} />
        ) : (
          definition && <TypingTest key={testKey} definition={definition} onChangeMode={setMode} />
        )}
      </div>
    </div>
  )
}
