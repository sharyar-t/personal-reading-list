/**
 * Returns a copy of `ids` with the item at `index` moved one step up (-1) or
 * down (+1). Out-of-range moves return the list unchanged.
 */
export function moveByOne(ids: string[], index: number, direction: -1 | 1): string[] {
  const target = index + direction
  if (index < 0 || index >= ids.length || target < 0 || target >= ids.length) return [...ids]
  const next = [...ids]
  ;[next[index], next[target]] = [next[target]!, next[index]!]
  return next
}
