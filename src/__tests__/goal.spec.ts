import { describe, expect, it } from 'vitest'
import { computeGoalProgress, describePace, yearElapsed } from '@/lib/goal'

const JULY_1 = new Date(2026, 6, 2) // ~half the year gone

describe('computeGoalProgress', () => {
  it('expects about half the goal by the middle of the year', () => {
    const p = computeGoalProgress(24, 12, 2026, JULY_1)
    expect(Math.round(p.expected)).toBe(12)
    expect(p.status).toBe('on-track')
  })

  it('is ahead or behind once the gap reaches a full book', () => {
    expect(computeGoalProgress(24, 15, 2026, JULY_1).status).toBe('ahead')
    expect(computeGoalProgress(24, 9, 2026, JULY_1).status).toBe('behind')
    expect(computeGoalProgress(24, 11, 2026, JULY_1).status).toBe('on-track')
  })

  it('is complete at or past the target and caps the percentage', () => {
    const p = computeGoalProgress(10, 12, 2026, JULY_1)
    expect(p.status).toBe('complete')
    expect(p.percent).toBe(100)
    expect(p.remaining).toBe(0)
    expect(p.neededPerMonth).toBeNull()
  })

  it('needs a steady monthly rate to catch up', () => {
    const p = computeGoalProgress(24, 6, 2026, JULY_1)
    expect(p.remaining).toBe(18)
    expect(p.neededPerMonth).toBeCloseTo(3, 0)
  })

  it('has no needed rate once the year is over', () => {
    const p = computeGoalProgress(12, 5, 2025, new Date(2026, 0, 5))
    expect(p.daysLeft).toBe(0)
    expect(p.neededPerMonth).toBeNull()
    expect(p.status).toBe('behind')
  })

  it('stays on track at the very start of the year', () => {
    expect(computeGoalProgress(24, 0, 2026, new Date(2026, 0, 3)).status).toBe('on-track')
  })
})

describe('yearElapsed', () => {
  it('runs from 0 to 1', () => {
    expect(yearElapsed(2026, new Date(2026, 0, 1))).toBe(0)
    expect(yearElapsed(2026, new Date(2027, 5, 1))).toBe(1)
  })
})

describe('describePace', () => {
  it('speaks plainly for each status', () => {
    expect(describePace(computeGoalProgress(24, 15, 2026, JULY_1))).toMatch(/ahead of pace/)
    expect(describePace(computeGoalProgress(24, 12, 2026, JULY_1))).toMatch(/Right on pace/)
    expect(describePace(computeGoalProgress(24, 9, 2026, JULY_1))).toMatch(/behind pace/)
    expect(describePace(computeGoalProgress(10, 10, 2026, JULY_1))).toMatch(/complete/)
  })
})
