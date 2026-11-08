import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NO_FILTERS,
  hasActiveFilters,
  isSortKey,
  type BookFilters,
  type SortKey,
} from '@/lib/browse'

/**
 * Sort + filter state for a book list, kept in the URL query so it survives
 * reloads, works with the back button and can be shared as a link.
 * Defaults are omitted to keep URLs clean.
 */
export function useBrowseState() {
  const route = useRoute()
  const router = useRouter()

  const first = (value: unknown) => (Array.isArray(value) ? value[0] : value)
  const text = (key: string) => {
    const value = first(route.query[key])
    return typeof value === 'string' ? value : ''
  }

  const sort = computed<SortKey>(() => {
    const value = text('sort')
    return isSortKey(value) ? value : 'default'
  })

  const filters = computed<BookFilters>(() => {
    const rating = Number(text('rating'))
    return {
      genre: text('genre'),
      author: text('author'),
      minRating: Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : 0,
    }
  })

  const isFiltered = computed(() => hasActiveFilters(filters.value))

  function update(next: { sort?: SortKey; filters?: BookFilters }) {
    const s = next.sort ?? sort.value
    const f = next.filters ?? filters.value
    const query: Record<string, string> = {}
    if (s !== 'default') query.sort = s
    if (f.genre) query.genre = f.genre
    if (f.author) query.author = f.author
    if (f.minRating) query.rating = String(f.minRating)
    // replace: tweaking a dropdown shouldn't fill the history stack
    router.replace({ query })
  }

  return {
    sort,
    filters,
    isFiltered,
    setSort: (value: SortKey) => update({ sort: value }),
    setFilters: (value: BookFilters) => update({ filters: value }),
    clearFilters: () => update({ filters: NO_FILTERS }),
  }
}
