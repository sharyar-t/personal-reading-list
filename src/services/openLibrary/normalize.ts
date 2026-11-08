import type { BookMetadata } from '@/types/library'
import { normalizeGenres } from '@/lib/genres'
import { cleanIsbn } from '@/lib/isbn'
import { parseAuthors, splitTitle } from '@/lib/text'

/** A work as returned by /search.json (only the fields we request) */
export interface SearchDoc {
  key: string
  title: string
  subtitle?: string
  author_name?: string[]
  first_publish_year?: number
  number_of_pages_median?: number
  cover_i?: number
  isbn?: string[]
  publisher?: string[]
  subject?: string[]
  edition_count?: number
}

/** A search result ready for the UI: book metadata + every known ISBN for duplicate checks */
export interface SearchResult {
  metadata: BookMetadata
  /** All edition ISBNs (capped) — used to spot books already in the library */
  isbns: string[]
  editionCount: number
}

export const coverUrlForId = (coverId: number) =>
  `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`

// ── Genres ───────────────────────────────────────────────────────────────

/**
 * Open Library subjects mix genres with noise ("Accessible book",
 * "nyt:trade-fiction-paperback=2021-11-07", places, characters…).
 * We map recognisable keywords onto a small genre vocabulary.
 */
const GENRE_RULES: [RegExp, string][] = [
  [/science.?fiction|sci-?fi|space opera|cyberpunk/, 'Science Fiction'],
  [/fantasy|magic|dragons/, 'Fantasy'],
  [/myster|detective|crime fiction/, 'Mystery'],
  [/thriller|suspense/, 'Thriller'],
  [/horror/, 'Horror'],
  [/romance|love stories/, 'Romance'],
  [/historical fiction/, 'Historical Fiction'],
  [/dystopi/, 'Dystopian'],
  [/classic/, 'Classics'],
  [/poetry|poems/, 'Poetry'],
  [/graphic novel|comic/, 'Graphic Novels'],
  [/young adult|juvenile fiction/, 'Young Adult'],
  [/children/, "Children's"],
  [/biograph|autobiograph|memoir/, 'Biography & Memoir'],
  [/history|historical/, 'History'],
  [/psycholog/, 'Psychology'],
  [/philosoph|stoic/, 'Philosophy'],
  [/self-?help|self-?improvement|personal development|success|habits/, 'Self-Improvement'],
  [/productivity|time management/, 'Productivity'],
  [/business|management|economics|finance|money/, 'Business & Finance'],
  [/computer|programming|software|javascript|python|algorithms/, 'Tech & Programming'],
  [/science|physics|biology|chemistry|astronomy/, 'Science'],
  [/politic/, 'Politics'],
  [/travel/, 'Travel'],
  [/cook|recipes/, 'Cooking'],
  [/religio|spiritual/, 'Religion & Spirituality'],
  [/humor|humour/, 'Humor'],
]

const NOISE =
  /accessible book|protected daisy|in library|lending library|large type|nyt:|award:|open library|reading level|translations into|new york times/i

export function subjectsToGenres(subjects: readonly string[] | undefined, max = 4): string[] {
  const counts = new Map<string, number>()
  let fiction = 0
  let nonFiction = 0

  for (const raw of subjects ?? []) {
    if (typeof raw !== 'string' || NOISE.test(raw)) continue
    const subject = raw.toLowerCase()
    if (/non-?fiction/.test(subject)) nonFiction++
    else if (/fiction|novel/.test(subject)) fiction++
    for (const [pattern, genre] of GENRE_RULES) {
      if (pattern.test(subject)) counts.set(genre, (counts.get(genre) ?? 0) + 1)
    }
  }

  const genres = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([genre]) => genre)
  // Fiction subjects often mention "history" (historical settings) — don't call novels History
  const isFiction = fiction > nonFiction
  const filtered = isFiction ? genres.filter((g) => g !== 'History' && g !== 'Science') : genres
  const top = isFiction ? 'Fiction' : nonFiction > 0 ? 'Non-Fiction' : null
  return normalizeGenres([...(top ? [top] : []), ...filtered]).slice(0, max)
}

// ── Descriptions ─────────────────────────────────────────────────────────

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
}

export function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === '#') {
      const point =
        code[1]?.toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
      return Number.isFinite(point) ? String.fromCodePoint(point) : match
    }
    return ENTITIES[code.toLowerCase()] ?? match
  })
}

/**
 * Open Library descriptions are a string or `{ type, value }`, and may contain
 * HTML, entities, markdown links and trailing "----------" source sections.
 */
export function normalizeDescription(raw: unknown): string | null {
  const text =
    typeof raw === 'string'
      ? raw
      : raw && typeof raw === 'object' && typeof (raw as { value?: unknown }).value === 'string'
        ? (raw as { value: string }).value
        : null
  if (!text) return null

  const cleaned = decodeEntities(
    text
      .replace(/\r\n?/g, '\n')
      .split(/\n-{3,}\s*\n/)[0]! // drop "----------\nContains: …" / "See also" sections
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\[([^\]]+)\]\[\d+\]/g, '$1') // markdown reference links
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // markdown inline links
      .replace(/^\s*\[\d+\]:.*$/gm, '') // markdown link definitions
      .replace(/(\*\*|__)(.+?)\1/g, '$2') // markdown bold
      .replace(/(^|[\s(])[*_]([^*_\n]+)[*_](?=[\s).,;:!?]|$)/gm, '$1$2'), // markdown italics
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return cleaned || null
}

// ── Search docs ──────────────────────────────────────────────────────────

const MAX_ISBNS = 60

function pickIsbns(isbns: string[] | undefined) {
  const cleaned = (isbns ?? [])
    .slice(0, MAX_ISBNS * 2)
    .map(cleanIsbn)
    .filter((i): i is string => !!i)
  return {
    all: [...new Set(cleaned)].slice(0, MAX_ISBNS),
    // Prefer English-language registration groups (978-0 / 978-1) — the
    // edition list is in arbitrary order and often starts with translations
    isbn13:
      cleaned.find((i) => /^978[01]/.test(i)) ??
      cleaned.find((i) => i.length === 13 && /^97[89]/.test(i)) ??
      null,
    isbn10:
      cleaned.find((i) => /^[01]/.test(i) && i.length === 10) ??
      cleaned.find((i) => i.length === 10) ??
      null,
  }
}

export function searchDocToResult(doc: SearchDoc): SearchResult {
  const split = splitTitle(doc.title)
  const authors = [...new Set((doc.author_name ?? []).flatMap((name) => parseAuthors(name)))]
  const isbns = pickIsbns(doc.isbn)
  const pages = doc.number_of_pages_median

  return {
    metadata: {
      source: 'openlibrary',
      workKey: doc.key,
      title: split.title,
      subtitle: doc.subtitle?.trim() || split.subtitle,
      authors,
      coverUrl: doc.cover_i && doc.cover_i > 0 ? coverUrlForId(doc.cover_i) : null,
      isbn13: isbns.isbn13,
      isbn10: isbns.isbn10,
      pageCount: typeof pages === 'number' && pages > 0 ? Math.round(pages) : null,
      publishYear: doc.first_publish_year ?? null,
      publisher: doc.publisher?.find((p) => p.trim())?.trim() ?? null,
      description: null,
      genres: subjectsToGenres(doc.subject),
    },
    isbns: isbns.all,
    editionCount: doc.edition_count ?? 1,
  }
}
