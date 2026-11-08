export type PaceStatus = 'complete' | 'ahead' | 'on-track' | 'behind'

export interface GoalProgress {
  target: number
  read: number
  /** 0–100, capped */
  percent: number
  /** Where a steady reader would be today: target × share of the year elapsed */
  expected: number
  /** read − expected; positive means ahead */
  difference: number
  status: PaceStatus
  remaining: number
  daysLeft: number
  /** Books per month needed from now to finish; null once complete or the year is over */
  neededPerMonth: number | null
}

/** Share of the calendar year gone by `now`, 0–1 (can pass 1 for past years). */
export function yearElapsed(year: number, now: Date): number {
  const start = new Date(year, 0, 1).getTime()
  const end = new Date(year + 1, 0, 1).getTime()
  return Math.min(1, Math.max(0, (now.getTime() - start) / (end - start)))
}

/**
 * Compares books read with a straight-line pace (24 books by 1 July ≈ 12).
 * Within one book either way counts as "on track" — nobody is behind for
 * being half a book short.
 */
export function computeGoalProgress(
  target: number,
  read: number,
  year: number,
  now = new Date(),
): GoalProgress {
  const elapsed = yearElapsed(year, now)
  const expected = target * elapsed
  const difference = read - expected
  const remaining = Math.max(0, target - read)

  const status: PaceStatus =
    read >= target
      ? 'complete'
      : difference >= 1
        ? 'ahead'
        : difference <= -1
          ? 'behind'
          : 'on-track'

  const msLeft = new Date(year + 1, 0, 1).getTime() - now.getTime()
  const daysLeft = Math.max(0, Math.ceil(msLeft / 86_400_000))
  const monthsLeft = daysLeft / (365 / 12)

  return {
    target,
    read,
    percent: Math.min(100, Math.round((read / target) * 100)),
    expected,
    difference,
    status,
    remaining,
    daysLeft,
    neededPerMonth: remaining > 0 && monthsLeft > 0 ? remaining / monthsLeft : null,
  }
}

const plural = (n: number, one: string) => `${n} ${n === 1 ? one : `${one}s`}`

/** One honest sentence about where the reader stands */
export function describePace(progress: GoalProgress): string {
  const { status, difference, remaining, daysLeft, neededPerMonth } = progress
  const books = Math.max(1, Math.round(Math.abs(difference)))
  switch (status) {
    case 'complete':
      return 'Goal complete — everything from here is a bonus.'
    case 'ahead':
      return `${plural(books, 'book')} ahead of pace. Nicely done.`
    case 'on-track':
      return 'Right on pace. Keep doing what you are doing.'
    case 'behind': {
      if (daysLeft === 0) return `${plural(remaining, 'book')} short of the goal.`
      const need =
        neededPerMonth !== null && neededPerMonth > 0
          ? ` About ${neededPerMonth < 1 ? 'one book every ' + Math.round(1 / neededPerMonth) + ' months' : `${Math.round(neededPerMonth * 10) / 10} books a month`} gets you there.`
          : ''
      return `${plural(books, 'book')} behind pace — still very catchable.${need}`
    }
  }
}

/** A few words for a compact card: "2 books ahead of pace", "Right on pace"… */
export function paceHeadline(progress: GoalProgress): string {
  const books = Math.max(1, Math.round(Math.abs(progress.difference)))
  switch (progress.status) {
    case 'complete':
      return 'Goal complete'
    case 'ahead':
      return `${plural(books, 'book')} ahead of pace`
    case 'on-track':
      return 'Right on pace'
    case 'behind':
      return `${plural(books, 'book')} behind pace`
  }
}
