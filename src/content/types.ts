export type Difficulty = 'easy' | 'medium' | 'hard'
export type LengthCategory = 'short' | 'medium' | 'long'

export type PassageCategory =
  | 'everyday'
  | 'technology'
  | 'nature'
  | 'science'
  | 'travel'
  | 'business'
  | 'history'
  | 'creativity'
  | 'random'

export type QuoteCategory = 'motivation' | 'philosophy' | 'science' | 'technology' | 'literature' | 'everyday'

export type CodeLanguage = 'javascript' | 'typescript' | 'python' | 'html' | 'css' | 'sql'

export interface Passage {
  id: string
  category: PassageCategory
  difficulty: Difficulty
  text: string
}

export interface Quote {
  id: string
  category: QuoteCategory
  text: string
  /** Only set for quotations with a verified author. Original passages have no author. */
  author?: string
  /** Work, speech or letter the quotation comes from, when known. */
  source?: string
}

export interface CodeSnippet {
  id: string
  language: CodeLanguage
  title: string
  code: string
}

export type PassageEntry = [Difficulty, string]

/** Builds passage objects with stable ids, e.g. "travel-04". */
export function definePassages(category: PassageCategory, entries: PassageEntry[]): Passage[] {
  return entries.map(([difficulty, text], index) => ({
    id: `${category}-${String(index + 1).padStart(2, '0')}`,
    category,
    difficulty,
    text,
  }))
}

export type QuoteEntry = { text: string; author?: string; source?: string }

export function defineQuotes(category: QuoteCategory, entries: QuoteEntry[]): Quote[] {
  return entries.map((entry, index) => ({
    id: `quote-${category}-${String(index + 1).padStart(2, '0')}`,
    category,
    ...entry,
  }))
}

export type SnippetEntry = { title: string; code: string }

export function defineSnippets(language: CodeLanguage, entries: SnippetEntry[]): CodeSnippet[] {
  return entries.map((entry, index) => ({
    id: `code-${language}-${String(index + 1).padStart(2, '0')}`,
    language,
    title: entry.title,
    code: entry.code,
  }))
}
