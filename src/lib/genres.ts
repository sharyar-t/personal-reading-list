import { foldText } from '@/lib/text'

/*
 * One genre vocabulary for the whole app. Genres arrive from two very
 * different sources — hand-curated sample data and Open Library subjects —
 * and without a shared vocabulary the stats and filters show near-duplicates
 * ("Sci-Fi & Fantasy", "Science Fiction", "Fantasy") as separate genres.
 */

/** Synonyms and over-specific tags → the canonical genre. Keys are `foldText`-ed. */
const ALIASES: Record<string, string> = {
  'non fiction': 'Non-Fiction',
  nonfiction: 'Non-Fiction',

  'sci fi': 'Science Fiction',
  scifi: 'Science Fiction',
  sf: 'Science Fiction',
  'science fiction': 'Science Fiction',
  cyberpunk: 'Science Fiction',
  'space opera': 'Science Fiction',
  mythology: 'Fantasy',

  dystopia: 'Dystopian',
  'post apocalyptic': 'Dystopian',
  classic: 'Classics',
  'classic literature': 'Classics',

  memoir: 'Biography & Memoir',
  memoirs: 'Biography & Memoir',
  biography: 'Biography & Memoir',
  biographies: 'Biography & Memoir',
  autobiography: 'Biography & Memoir',
  'biography and memoir': 'Biography & Memoir',

  finance: 'Business & Finance',
  'personal finance': 'Business & Finance',
  business: 'Business & Finance',
  economics: 'Business & Finance',
  money: 'Business & Finance',
  'project management': 'Business & Finance',
  'business and finance': 'Business & Finance',

  'tech and programming': 'Tech & Programming',
  programming: 'Tech & Programming',
  software: 'Tech & Programming',
  'software engineering': 'Tech & Programming',
  'software development': 'Tech & Programming',
  'systems design': 'Tech & Programming',
  'computer science': 'Tech & Programming',
  javascript: 'Tech & Programming',
  'web development': 'Tech & Programming',

  'ux design': 'Design',
  stoicism: 'Philosophy',
  'decision making': 'Self-Improvement',
  'self help': 'Self-Improvement',
  'self improvement': 'Self-Improvement',
  'personal development': 'Self-Improvement',
  humour: 'Humor',
  'religion and spirituality': 'Religion & Spirituality',
}

/**
 * Broad buckets that merely restate their members. Dropped when a specific
 * member is present; replaced by all members when none is.
 */
const UMBRELLAS: Record<string, string[]> = {
  'sci fi and fantasy': ['Science Fiction', 'Fantasy'],
  'science fiction and fantasy': ['Science Fiction', 'Fantasy'],
}

/** "historical   fiction" → "Historical Fiction"; SHOUTING labels are calmed, short acronyms kept */
function titleCase(value: string): string {
  const tidy = value.trim().replace(/\s+/g, ' ')
  const shouting = tidy.length > 4 && tidy === tidy.toUpperCase()
  return (shouting ? tidy.toLowerCase() : tidy).replace(
    /(^|[\s(])([a-z])/g,
    (_, lead: string, letter: string) => lead + letter.toUpperCase(),
  )
}

/**
 * Maps raw genre labels onto the canonical vocabulary: synonyms merged,
 * umbrellas resolved, case and spacing tidied, duplicates removed. Keeps the
 * order genres first appeared in. Idempotent.
 */
export function normalizeGenres(raw: readonly string[]): string[] {
  const result: string[] = []
  const seen = new Set<string>()
  const add = (genre: string) => {
    const key = foldText(genre)
    if (key && !seen.has(key)) {
      seen.add(key)
      result.push(genre)
    }
  }

  const umbrellas: string[][] = []
  for (const label of raw) {
    if (typeof label !== 'string') continue
    const key = foldText(label)
    if (!key) continue
    const umbrella = UMBRELLAS[key]
    if (umbrella) umbrellas.push(umbrella)
    else add(ALIASES[key] ?? titleCase(label))
  }

  for (const members of umbrellas) {
    if (!members.some((member) => seen.has(foldText(member)))) members.forEach(add)
  }
  return result
}

export function sameGenres(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((genre, i) => genre === b[i])
}
