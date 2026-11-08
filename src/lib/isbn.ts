/**
 * Strips formatting from an ISBN: hyphens, spaces, and Goodreads' `="…"` wrapping.
 * Returns null unless the result looks like an ISBN-10 or ISBN-13. Checksums are
 * not enforced — real-world catalog data has enough bad check digits that
 * rejecting them would lose more books than it protects.
 */
export function cleanIsbn(raw: string | null | undefined): string | null {
  if (!raw) return null
  const value = raw.replace(/[^0-9Xx]/g, '').toUpperCase()
  if (/^\d{13}$/.test(value)) return value
  if (/^\d{9}[\dX]$/.test(value)) return value
  return null
}

function isbn13CheckDigit(first12: string): string {
  const sum = [...first12].reduce((acc, digit, i) => acc + Number(digit) * (i % 2 ? 3 : 1), 0)
  return String((10 - (sum % 10)) % 10)
}

/** Converts any valid-looking ISBN to ISBN-13 so editions compare consistently. */
export function toIsbn13(raw: string | null | undefined): string | null {
  const isbn = cleanIsbn(raw)
  if (!isbn) return null
  if (isbn.length === 13) return isbn
  const core = `978${isbn.slice(0, 9)}`
  return core + isbn13CheckDigit(core)
}
