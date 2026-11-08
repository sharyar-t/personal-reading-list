/** Lowercase, strip diacritics and punctuation, collapse whitespace. */
export function foldText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function slugify(value: string): string {
  return foldText(value).replace(/\s+/g, '-').slice(0, 60).replace(/-+$/, '')
}

/** Splits "Sapiens: A Brief History of Humankind" into title and subtitle. */
export function splitTitle(raw: string): { title: string; subtitle: string | null } {
  const clean = raw.replace(/\s+/g, ' ').trim()
  const index = clean.indexOf(': ')
  if (index <= 0) return { title: clean, subtitle: null }
  return { title: clean.slice(0, index), subtitle: clean.slice(index + 2) || null }
}

const wordCount = (value: string) => value.split(/\s+/).length
const ENDS_WITH_INITIAL = /(^|\s)[A-Z](\.[A-Z])*\.?$/

/**
 * "Tolkien, J.R.R." / "Herbert, Frank" / "Le Guin, Ursula K." are one inverted name;
 * "David Thomas, Andrew Hunt" is two people. A full "First Last" name never
 * ends with an initial and is never a single word.
 */
function isInvertedName(surname: string, given: string): boolean {
  return wordCount(surname) === 1 || wordCount(given) === 1 || ENDS_WITH_INITIAL.test(given)
}

/**
 * Parses an author field into display names ("First Last"), handling
 * co-authors, "and" / "&" / ";" separators and inverted "Last, First" names.
 */
export function parseAuthors(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return []
  const names: string[] = []

  for (const group of raw.split(/\s*(?:;|&|\band\b)\s*/i)) {
    const parts = group
      .split(',')
      .map((part) => part.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
    if (parts.length === 2 && isInvertedName(parts[0]!, parts[1]!)) {
      names.push(`${parts[1]} ${parts[0]}`)
    } else {
      names.push(...parts)
    }
  }

  return [...new Set(names)]
}

/** "1925", "2004-05-01", "May 2004" → 1925 / 2004 / 2004 */
export function parseYear(raw: string | number | null | undefined): number | null {
  if (raw == null) return null
  const match = String(raw).match(/\b(1[0-9]{3}|20[0-9]{2})\b/)
  return match ? Number(match[1]) : null
}
