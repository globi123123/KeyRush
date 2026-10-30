import { daysBetween } from '../lib/date'
import { hashString, pickRandom, seededRandom, shuffle } from '../lib/random'
import type { LengthFilter } from '../types'
import { cssSnippets } from './code/css'
import { htmlSnippets } from './code/html'
import { javascriptSnippets } from './code/javascript'
import { pythonSnippets } from './code/python'
import { sqlSnippets } from './code/sql'
import { typescriptSnippets } from './code/typescript'
import { businessPassages } from './passages/business'
import { creativityPassages } from './passages/creativity'
import { everydayPassages } from './passages/everyday'
import { historyPassages } from './passages/history'
import { naturePassages } from './passages/nature'
import { randomPassages } from './passages/random'
import { sciencePassages } from './passages/science'
import { technologyPassages } from './passages/technology'
import { travelPassages } from './passages/travel'
import { quotes as quoteList } from './quotes'
import type {
  CodeLanguage,
  CodeSnippet,
  Difficulty,
  LengthCategory,
  Passage,
  PassageCategory,
  Quote,
  QuoteCategory,
} from './types'
import { advancedWords, commonWords } from './words'

export type { CodeLanguage, CodeSnippet, Difficulty, LengthCategory, Passage, PassageCategory, Quote, QuoteCategory }

/* ------------------------------------------------------------------ */
/*  Library                                                            */
/* ------------------------------------------------------------------ */

export const passages: Passage[] = [
  ...everydayPassages,
  ...technologyPassages,
  ...naturePassages,
  ...sciencePassages,
  ...travelPassages,
  ...businessPassages,
  ...historyPassages,
  ...creativityPassages,
  ...randomPassages,
]

/** Code snippets are written with a leading newline for readability; trim it here. */
export const snippets: CodeSnippet[] = [
  ...javascriptSnippets,
  ...typescriptSnippets,
  ...pythonSnippets,
  ...htmlSnippets,
  ...cssSnippets,
  ...sqlSnippets,
].map((snippet) => ({ ...snippet, code: snippet.code.replace(/^\n+/, '').replace(/\s+$/, '') }))

export const quotes: Quote[] = quoteList

export const PASSAGE_CATEGORIES: { id: PassageCategory; label: string }[] = [
  { id: 'everyday', label: 'Everyday Life' },
  { id: 'technology', label: 'Technology' },
  { id: 'nature', label: 'Nature' },
  { id: 'science', label: 'Science' },
  { id: 'travel', label: 'Travel' },
  { id: 'business', label: 'Business' },
  { id: 'history', label: 'History' },
  { id: 'creativity', label: 'Creativity' },
  { id: 'random', label: 'Random' },
]

export const QUOTE_CATEGORIES: { id: QuoteCategory; label: string }[] = [
  { id: 'motivation', label: 'Motivation' },
  { id: 'philosophy', label: 'Philosophy' },
  { id: 'science', label: 'Science' },
  { id: 'technology', label: 'Technology' },
  { id: 'literature', label: 'Literature' },
  { id: 'everyday', label: 'Everyday Life' },
]

export const CODE_LANGUAGES: { id: CodeLanguage; label: string }[] = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'sql', label: 'SQL' },
]

export const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
]

export const LENGTH_FILTERS: { id: LengthFilter; label: string }[] = [
  { id: 'short', label: 'Short' },
  { id: 'medium', label: 'Medium' },
  { id: 'long', label: 'Long' },
  { id: 'random', label: 'Random' },
]

export const passageCategoryLabel = (id: PassageCategory) =>
  PASSAGE_CATEGORIES.find((c) => c.id === id)?.label ?? id
export const quoteCategoryLabel = (id: QuoteCategory) => QUOTE_CATEGORIES.find((c) => c.id === id)?.label ?? id
export const languageLabel = (id: CodeLanguage) => CODE_LANGUAGES.find((c) => c.id === id)?.label ?? id

/* ------------------------------------------------------------------ */
/*  Length classification                                              */
/* ------------------------------------------------------------------ */

export function passageLength(text: string): LengthCategory {
  if (text.length < 180) return 'short'
  if (text.length <= 340) return 'medium'
  return 'long'
}

export function quoteLength(text: string): LengthCategory {
  if (text.length < 80) return 'short'
  if (text.length <= 180) return 'medium'
  return 'long'
}

const matchesLength = (length: LengthCategory, filter: LengthFilter) => filter === 'random' || length === filter

/* ------------------------------------------------------------------ */
/*  Selection helpers                                                  */
/* ------------------------------------------------------------------ */

/** Remembers recently used ids so the same text does not come up twice in a row. */
const recent: string[] = []
const RECENT_LIMIT = 24

function remember(id: string) {
  const index = recent.indexOf(id)
  if (index !== -1) recent.splice(index, 1)
  recent.push(id)
  if (recent.length > RECENT_LIMIT) recent.shift()
}

/** Picks a random item, preferring ones that were not used recently. */
function pickFresh<T extends { id: string }>(items: T[], exclude?: string): T | null {
  if (items.length === 0) return null
  const candidates = items.filter((item) => item.id !== exclude)
  const pool = candidates.length > 0 ? candidates : items
  const unseen = pool.filter((item) => !recent.includes(item.id))
  const choice = pickRandom(unseen.length > 0 ? unseen : pool)
  remember(choice.id)
  return choice
}

export type CategoryFilter<T extends string> = T | 'all'
export type DifficultyFilter = Difficulty | 'any'

export interface PassageQuery {
  length?: LengthFilter
  category?: CategoryFilter<PassageCategory>
  difficulty?: DifficultyFilter
}

export function filterPassages({ length = 'random', category = 'all', difficulty = 'any' }: PassageQuery): Passage[] {
  return passages.filter(
    (p) =>
      (category === 'all' || p.category === category) &&
      (difficulty === 'any' || p.difficulty === difficulty) &&
      matchesLength(passageLength(p.text), length),
  )
}

/**
 * Picks a passage for the given filters. Filters are relaxed step by step
 * when a combination has no matches, so a text is always returned.
 */
export function pickPassage(query: PassageQuery, exclude?: string): Passage {
  const attempts: PassageQuery[] = [
    query,
    { ...query, difficulty: 'any' },
    { ...query, length: 'random' },
    { category: query.category },
    {},
  ]
  for (const attempt of attempts) {
    const choice = pickFresh(filterPassages(attempt), exclude)
    if (choice) return choice
  }
  return passages[0]
}

/** Joins random passages until the text is at least `minChars` long. */
export function buildPassageStream(query: PassageQuery, minChars: number): { text: string; ids: string[] } {
  const parts: string[] = []
  const ids: string[] = []
  let length = 0
  while (length < minChars) {
    const passage = pickPassage(query, ids[ids.length - 1])
    parts.push(passage.text)
    ids.push(passage.id)
    length += passage.text.length + 1
  }
  return { text: parts.join(' '), ids }
}

/**
 * Generates a word sequence. Mostly common words, with a few advanced ones
 * mixed in depending on the difficulty.
 */
export function generateWords(count: number, difficulty: DifficultyFilter = 'any', rng: () => number = Math.random): string {
  const advancedShare = difficulty === 'easy' ? 0 : difficulty === 'hard' ? 0.35 : difficulty === 'medium' ? 0.12 : 0.08
  const words: string[] = []
  for (let i = 0; i < count; i++) {
    const source = rng() < advancedShare ? advancedWords : commonWords
    let word = pickRandom(source, rng)
    // Avoid the same word twice in a row.
    if (word === words[words.length - 1]) word = pickRandom(source, rng)
    words.push(word)
  }
  return words.join(' ')
}

export function pickSnippet(language: CategoryFilter<CodeLanguage>, exclude?: string): CodeSnippet {
  const pool = language === 'all' ? snippets : snippets.filter((s) => s.language === language)
  return pickFresh(pool, exclude) ?? snippets[0]
}

export interface QuoteQuery {
  category?: CategoryFilter<QuoteCategory>
  length?: LengthFilter
}

export function filterQuotes({ category = 'all', length = 'random' }: QuoteQuery): Quote[] {
  return quotes.filter(
    (q) => (category === 'all' || q.category === category) && matchesLength(quoteLength(q.text), length),
  )
}

export function pickQuote(query: QuoteQuery, exclude?: string): Quote {
  return (
    pickFresh(filterQuotes(query), exclude) ??
    pickFresh(filterQuotes({ category: query.category }), exclude) ??
    pickFresh(quotes, exclude) ??
    quotes[0]
  )
}

/* ------------------------------------------------------------------ */
/*  Daily challenge                                                    */
/* ------------------------------------------------------------------ */

const DAILY_EPOCH = '2024-01-01'

/** Medium and long passages work best as a daily challenge. */
const dailyPool: Passage[] = shuffle(
  passages.filter((p) => passageLength(p.text) !== 'short'),
  seededRandom(hashString('keyrush-daily')),
)

/**
 * Returns the challenge passage for a calendar day (YYYY-MM-DD).
 * The order is fixed, so every visitor gets the same passage on the same day
 * and no passage repeats until the whole pool has been used.
 */
export function getDailyPassage(key: string): Passage {
  const day = daysBetween(DAILY_EPOCH, key)
  const index = ((day % dailyPool.length) + dailyPool.length) % dailyPool.length
  return dailyPool[index]
}

export const librarySize = {
  passages: passages.length,
  snippets: snippets.length,
  quotes: quotes.length,
}
