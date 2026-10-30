import type { CodeLanguage } from '../content/types'

/**
 * A small, dependency free syntax highlighter for code mode.
 * It returns one token class per character so the typing renderer can
 * colour every character individually.
 */

export type Token = 'keyword' | 'string' | 'number' | 'comment' | 'function' | 'type' | 'tag' | 'attr' | 'punct' | 'plain'

type Rule = [RegExp, Token | ((match: string) => Token)]

const words = (list: string) => new RegExp(`\\b(?:${list.trim().split(/\s+/).join('|')})\\b`, 'y')

const JS_KEYWORDS = `const let var function return if else for while do switch case break continue new class extends
  import from export default async await try catch finally throw typeof instanceof in of this null undefined true
  false void yield super delete static get set`
const TS_KEYWORDS = `${JS_KEYWORDS} interface type enum implements readonly public private protected as keyof
  abstract declare namespace satisfies never unknown any string number boolean`
const PY_KEYWORDS = `def class return if elif else for while in not and or is None True False import from as with
  try except finally raise lambda pass yield global nonlocal async await break continue assert del self`
const PY_BUILTINS = 'int str float bool list dict set tuple bytes object type len range print enumerate zip sorted open'
const SQL_KEYWORDS = `select from where and or not insert into values update set delete create table alter add drop
  index view as on join inner left right full outer cross group by order having limit offset distinct union all
  primary key foreign references unique default null is in between like exists case when then else end asc desc
  begin commit rollback transaction with recursive over partition integer int varchar text boolean date timestamp
  serial check constraint returning true false cascade if`

const jsLike = (keywords: string, typed: boolean): Rule[] => [
  [/\/\/[^\n]*/y, 'comment'],
  [/\/\*[\s\S]*?\*\//y, 'comment'],
  [/`(?:\\[\s\S]|[^`\\])*`/y, 'string'],
  [/'(?:\\.|[^'\\\n])*'/y, 'string'],
  [/"(?:\\.|[^"\\\n])*"/y, 'string'],
  [/\b\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?n?\b/iy, 'number'],
  [words(keywords), 'keyword'],
  ...(typed ? ([[/\b[A-Z][A-Za-z0-9_]*\b/y, 'type']] as Rule[]) : []),
  [/[A-Za-z_$][\w$]*(?=\s*\()/y, 'function'],
  [/#?[A-Za-z_$][\w$]*/y, 'plain'],
  [/=>|[{}()[\];,.:?!<>=+\-*/%&|^~@]/y, 'punct'],
]

const RULES: Partial<Record<CodeLanguage, Rule[]>> = {
  javascript: jsLike(JS_KEYWORDS, false),
  typescript: jsLike(TS_KEYWORDS, true),
  python: [
    [/#[^\n]*/y, 'comment'],
    [/[rbfu]{0,2}("""[\s\S]*?"""|'''[\s\S]*?''')/iy, 'string'],
    [/[rbfu]{0,2}("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')/iy, 'string'],
    [/@[A-Za-z_][\w.]*/y, 'function'],
    [/\b\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?j?\b/iy, 'number'],
    [words(PY_KEYWORDS), 'keyword'],
    [words(PY_BUILTINS), 'type'],
    [/\b[A-Z][A-Za-z0-9_]*\b/y, 'type'],
    [/[A-Za-z_][\w]*(?=\s*\()/y, 'function'],
    [/[A-Za-z_][\w]*/y, 'plain'],
    [/->|[{}()[\];,.:<>=+\-*/%&|^~!]/y, 'punct'],
  ],
  sql: [
    [/--[^\n]*/y, 'comment'],
    [/\/\*[\s\S]*?\*\//y, 'comment'],
    [/'(?:''|[^'])*'/y, 'string'],
    [/\b\d+(?:\.\d+)?\b/y, 'number'],
    [new RegExp(words(SQL_KEYWORDS).source, 'iy'), 'keyword'],
    [/[A-Za-z_][\w]*(?=\s*\()/y, 'function'],
    [/[A-Za-z_][\w]*/y, 'plain'],
    [/[(),;.*=<>!+\-/%]/y, 'punct'],
  ],
}

function runRules(code: string, rules: Rule[], out: Token[]) {
  let i = 0
  outer: while (i < code.length) {
    for (const [regex, token] of rules) {
      regex.lastIndex = i
      const match = regex.exec(code)
      if (match && match[0].length > 0) {
        const value = typeof token === 'function' ? token(match[0]) : token
        out.fill(value, i, i + match[0].length)
        i += match[0].length
        continue outer
      }
    }
    i++ // whitespace and anything unknown stays plain
  }
}

/** HTML needs a little state: are we inside a tag or in text content? */
function highlightHtml(code: string, out: Token[]) {
  let i = 0
  const at = (pattern: RegExp) => {
    pattern.lastIndex = i
    return pattern.exec(code)
  }
  while (i < code.length) {
    const comment = at(/<!--[\s\S]*?-->/y)
    if (comment) {
      out.fill('comment', i, (i += comment[0].length))
      continue
    }
    const open = at(/<\/?|<!/y)
    if (open && /[A-Za-z!]/.test(code[i + open[0].length] ?? '')) {
      out.fill('punct', i, (i += open[0].length))
      const name = at(/[A-Za-z][\w-]*/y)
      if (name) out.fill('tag', i, (i += name[0].length))
      // Attributes until the closing bracket.
      while (i < code.length && code[i] !== '>') {
        const str = at(/"[^"]*"|'[^']*'/y)
        if (str) {
          out.fill('string', i, (i += str[0].length))
          continue
        }
        const attr = at(/[A-Za-z_:@][\w:.-]*/y)
        if (attr) {
          out.fill('attr', i, (i += attr[0].length))
          continue
        }
        if (/[=/]/.test(code[i])) out[i] = 'punct'
        i++
      }
      if (code[i] === '>') out[i++] = 'punct'
      continue
    }
    const entity = at(/&[a-z#0-9]+;/iy)
    if (entity) {
      out.fill('number', i, (i += entity[0].length))
      continue
    }
    i++
  }
}

/** CSS: selectors outside blocks, properties and values inside. */
function highlightCss(code: string, out: Token[]) {
  let i = 0
  let depth = 0
  let inValue = false
  const at = (pattern: RegExp) => {
    pattern.lastIndex = i
    return pattern.exec(code)
  }
  while (i < code.length) {
    const ch = code[i]
    const comment = at(/\/\*[\s\S]*?\*\//y)
    if (comment) {
      out.fill('comment', i, (i += comment[0].length))
      continue
    }
    if (ch === '{' || ch === '}' || ch === ';' || ch === ',' || ch === '(' || ch === ')') {
      if (ch === '{') {
        depth++
        inValue = false
      } else if (ch === '}') {
        depth = Math.max(0, depth - 1)
        inValue = false
      } else if (ch === ';') inValue = false
      out[i++] = 'punct'
      continue
    }
    const atRule = at(/@[\w-]+/y)
    if (atRule) {
      out.fill('keyword', i, (i += atRule[0].length))
      continue
    }
    const str = at(/"[^"\n]*"|'[^'\n]*'/y)
    if (str) {
      out.fill('string', i, (i += str[0].length))
      continue
    }
    // A declaration starts with "property:" inside a block.
    const property = depth > 0 && !inValue ? at(/--?[\w-]+(?=\s*:)|[a-z-]+(?=\s*:(?!:?[a-z-]+\s*[,{(]))/y) : null
    if (property) {
      out.fill('attr', i, (i += property[0].length))
      continue
    }
    if (ch === ':' && depth > 0 && !inValue) {
      inValue = true
      out[i++] = 'punct'
      continue
    }
    if (inValue) {
      const num = at(/#[0-9a-f]{3,8}\b|-?\d*\.?\d+(?:px|rem|em|%|s|ms|vh|vw|fr|deg|ch|dvh)?/iy)
      if (num) {
        out.fill('number', i, (i += num[0].length))
        continue
      }
      const important = at(/!important/y)
      if (important) {
        out.fill('keyword', i, (i += important[0].length))
        continue
      }
      const fn = at(/[a-z-]+(?=\()/iy)
      if (fn) {
        out.fill('function', i, (i += fn[0].length))
        continue
      }
      const ident = at(/[\w-]+/y)
      if (ident) {
        out.fill(ident[0].startsWith('--') ? 'attr' : 'plain', i, (i += ident[0].length))
        continue
      }
      i++
      continue
    }
    // Selectors
    const cls = at(/[.#][\w-]+/y)
    if (cls) {
      out.fill('type', i, (i += cls[0].length))
      continue
    }
    const pseudo = at(/::?[\w-]+/y)
    if (pseudo) {
      out.fill('keyword', i, (i += pseudo[0].length))
      continue
    }
    const element = at(/[a-z][\w-]*|\*/iy)
    if (element) {
      out.fill(depth > 0 ? 'plain' : 'tag', i, (i += element[0].length))
      continue
    }
    if (/[>+~=[\]]/.test(ch)) out[i] = 'punct'
    i++
  }
}

const cache = new Map<string, Token[]>()

export function highlight(code: string, language: CodeLanguage): Token[] {
  const key = `${language}\u0000${code}`
  const cached = cache.get(key)
  if (cached) return cached
  const out: Token[] = new Array(code.length).fill('plain')
  if (language === 'html') highlightHtml(code, out)
  else if (language === 'css') highlightCss(code, out)
  else runRules(code, RULES[language] ?? [], out)
  if (cache.size > 64) cache.clear()
  cache.set(key, out)
  return out
}
