import type { BookMetadata, SampleBook } from '@/types/library'
import { normalizeSampleBook } from '@/lib/normalize'

/*
 * Starter packs: small curated sets a new reader can add in one click.
 * Books come from the bundled sample catalog, so packs work offline, always
 * have real covers and metadata, and never depend on a flaky API.
 */

export interface StarterPack {
  id: string
  title: string
  blurb: string
  /** Exact titles from data/sample-books.json */
  titles: string[]
}

export const STARTER_PACKS: StarterPack[] = [
  {
    id: 'classics',
    title: 'Classics worth the hype',
    blurb: 'Six novels that earned their reputation.',
    titles: [
      'The Great Gatsby',
      'To Kill a Mockingbird',
      '1984',
      'Pride and Prejudice',
      'The Catcher in the Rye',
      'Beloved',
    ],
  },
  {
    id: 'sci-fi-fantasy',
    title: 'Sci-fi & fantasy starter',
    blurb: 'Other worlds, from desert planets to dreamlike houses.',
    titles: [
      'Dune',
      'Project Hail Mary',
      'The Name of the Wind',
      'Piranesi',
      'The Left Hand of Darkness',
      'Neuromancer',
    ],
  },
  {
    id: 'big-ideas',
    title: 'Big ideas, well told',
    blurb: 'Non-fiction that changes how you see things.',
    titles: [
      'Sapiens: A Brief History of Humankind',
      'Thinking, Fast and Slow',
      'Educated',
      'Atomic Habits',
      'Range: Why Generalists Triumph in a Specialized World',
      'The Body: A Guide for Occupants',
    ],
  },
  {
    id: 'for-developers',
    title: 'For developers',
    blurb: 'The books people keep recommending to each other.',
    titles: [
      'The Pragmatic Programmer',
      'Clean Code',
      'Designing Data-Intensive Applications',
      'A Philosophy of Software Design',
      'The Mythical Man-Month',
      'Eloquent JavaScript',
    ],
  },
  {
    id: 'short-and-satisfying',
    title: 'Short & satisfying',
    blurb: 'Under 300 pages each — easy to start, easy to finish.',
    titles: [
      'The Great Gatsby',
      'A Philosophy of Software Design',
      "Don't Make Me Think",
      'The Obstacle Is the Way',
      'The Psychology of Money',
      'Piranesi',
    ],
  },
]

let catalog: Promise<Map<string, BookMetadata>> | null = null

/** The sample catalog keyed by exact title; loaded once, on demand */
export function loadCatalog(): Promise<Map<string, BookMetadata>> {
  catalog ??= import('../../data/sample-books.json').then(({ default: samples }) => {
    const map = new Map<string, BookMetadata>()
    for (const sample of samples as SampleBook[]) {
      map.set(sample.title, normalizeSampleBook(sample))
    }
    return map
  })
  return catalog
}

/** The pack's books in order; titles missing from the catalog are skipped */
export async function loadPackBooks(pack: StarterPack): Promise<BookMetadata[]> {
  const map = await loadCatalog()
  return pack.titles.flatMap((title) => {
    const book = map.get(title)
    return book ? [book] : []
  })
}
