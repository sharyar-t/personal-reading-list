import type { ReadingProgress } from '@/types/library'

export function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)))
}

export type ProgressInput = { page: number } | { percent: number }

/**
 * Turns a page or percentage update into a progress record. Books without a
 * page count can only be tracked by percentage.
 */
export function computeProgress(
  input: ProgressInput,
  pageCount: number | null,
  at: string,
): ReadingProgress {
  if ('page' in input && pageCount) {
    const currentPage = Math.min(pageCount, Math.max(0, Math.round(input.page)))
    return { currentPage, percent: clampPercent((currentPage / pageCount) * 100), updatedAt: at }
  }
  const percent = clampPercent('percent' in input ? input.percent : 0)
  return {
    currentPage: pageCount ? Math.round((percent / 100) * pageCount) : null,
    percent,
    updatedAt: at,
  }
}
