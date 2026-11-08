import type { BookMetadata, SampleBook } from '@/types/library'
import { cleanIsbn } from './isbn'
import { parseAuthors, parseYear, splitTitle } from './text'

function cleanText(value: string | null | undefined): string | null {
  const trimmed = value?.replace(/\s+/g, ' ').trim()
  return trimmed ? trimmed : null
}

function positiveInt(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.round(value) : null
}

export function normalizeSampleBook(raw: SampleBook): BookMetadata {
  const { title, subtitle } = splitTitle(raw.title)
  return {
    source: 'sample',
    workKey: null,
    title,
    subtitle,
    authors: parseAuthors(raw.author),
    coverUrl: cleanText(raw.coverUrl),
    isbn13: cleanIsbn(raw.isbn13),
    isbn10: cleanIsbn(raw.isbn10),
    pageCount: positiveInt(raw.pageCount),
    publishYear: parseYear(raw.publishedDate),
    publisher: cleanText(raw.publisher),
    description: cleanText(raw.description),
    genres: [...new Set(raw.genres.map((genre) => genre.trim()).filter(Boolean))],
  }
}
