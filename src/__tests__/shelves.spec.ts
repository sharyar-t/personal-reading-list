import { describe, expect, it } from 'vitest'
import { moveByOne } from '@/lib/shelves'

describe('moveByOne', () => {
  const ids = ['a', 'b', 'c']

  it('moves an item up or down without mutating the input', () => {
    expect(moveByOne(ids, 1, -1)).toEqual(['b', 'a', 'c'])
    expect(moveByOne(ids, 1, 1)).toEqual(['a', 'c', 'b'])
    expect(ids).toEqual(['a', 'b', 'c'])
  })

  it('leaves the order alone at the edges or for a bad index', () => {
    expect(moveByOne(ids, 0, -1)).toEqual(ids)
    expect(moveByOne(ids, 2, 1)).toEqual(ids)
    expect(moveByOne(ids, 9, 1)).toEqual(ids)
  })
})
