import { computed, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { refDebounced } from '@vueuse/core'
import { searchBooks, type SearchScope } from '@/services/openLibrary/api'
import { isAbortError, OpenLibraryError } from '@/services/openLibrary/client'
import type { SearchResult } from '@/services/openLibrary/normalize'

export type SearchStatus = 'idle' | 'loading' | 'loading-more' | 'success' | 'error'

const MIN_QUERY_LENGTH = 2
const SCOPES: SearchScope[] = ['all', 'title', 'author']

export const SEARCH_ERROR_MESSAGES: Record<OpenLibraryError['kind'], string> = {
  offline: "You're offline. Check your connection and try again.",
  timeout: 'Open Library is taking too long to respond. Try again in a moment.',
  'rate-limited':
    "We're searching a little too fast for Open Library. Wait a few seconds and try again.",
  unavailable: 'Open Library is having trouble right now. Try again in a moment.',
  'not-found': "Open Library couldn't find that. Try a different search.",
  'invalid-response': "Open Library sent back something we couldn't read. Try again.",
}

function parseScope(value: unknown): SearchScope {
  return SCOPES.includes(value as SearchScope) ? (value as SearchScope) : 'all'
}

/**
 * Book search state: debounced as-you-type search, cancellation of stale
 * requests, "load more" pagination, and the query mirrored in the URL so
 * back/forward and shared links restore the search.
 */
export function useBookSearch() {
  const route = useRoute()
  const router = useRouter()

  const query = ref(typeof route.query.q === 'string' ? route.query.q : '')
  const scope = ref<SearchScope>(parseScope(route.query.by))
  const debouncedQuery = refDebounced(query, 450)

  const results = shallowRef<SearchResult[]>([])
  const total = ref(0)
  const page = ref(0)
  const hasMore = ref(false)
  const status = ref<SearchStatus>('idle')
  const error = ref<string | null>(null)
  /** The query the current results belong to */
  const searchedQuery = ref('')

  let controller: AbortController | null = null
  let activeKey = ''
  let failed: { text: string; scope: SearchScope; page: number } | null = null

  const trimmed = computed(() => query.value.trim())
  const isLoading = computed(() => status.value === 'loading' || status.value === 'loading-more')

  async function run(text: string, searchScope: SearchScope, nextPage: number) {
    controller?.abort()
    controller = new AbortController()
    const { signal } = controller
    activeKey = `${searchScope}|${text}`
    status.value = nextPage === 1 ? 'loading' : 'loading-more'
    error.value = null

    try {
      const response = await searchBooks(text, { scope: searchScope, page: nextPage, signal })
      if (signal.aborted) return
      if (nextPage === 1) {
        results.value = response.results
      } else {
        // Pages can overlap when the index shifts — skip works we already show
        const seen = new Set(results.value.map((r) => r.metadata.workKey))
        results.value = [
          ...results.value,
          ...response.results.filter((r) => !seen.has(r.metadata.workKey)),
        ]
      }
      total.value = response.total
      page.value = nextPage
      hasMore.value = response.hasMore
      searchedQuery.value = text
      status.value = 'success'
    } catch (caught) {
      if (isAbortError(caught) || signal.aborted) return
      console.error('[bookshelf] Search failed', caught)
      error.value =
        caught instanceof OpenLibraryError
          ? SEARCH_ERROR_MESSAGES[caught.kind]
          : SEARCH_ERROR_MESSAGES.unavailable
      status.value = 'error'
      activeKey = ''
      failed = { text, scope: searchScope, page: nextPage }
      // A failed new search shouldn't leave the previous query's results on screen
      if (nextPage === 1) {
        results.value = []
        hasMore.value = false
      }
    }
  }

  function reset() {
    controller?.abort()
    activeKey = ''
    results.value = []
    total.value = 0
    page.value = 0
    hasMore.value = false
    searchedQuery.value = ''
    error.value = null
    status.value = 'idle'
  }

  function searchNow() {
    const text = trimmed.value
    router.replace({
      query: {
        ...route.query,
        q: text || undefined,
        by: scope.value === 'all' ? undefined : scope.value,
      },
    })
    if (text.length < MIN_QUERY_LENGTH) return reset()
    // Debounce catching up with a search we already ran shouldn't fetch again
    if (`${scope.value}|${text}` === activeKey) return
    run(text, scope.value, 1)
  }

  watch([debouncedQuery, scope], searchNow, { immediate: true })

  function loadMore() {
    if (!hasMore.value || isLoading.value) return
    run(searchedQuery.value, scope.value, page.value + 1)
  }

  function retry() {
    if (failed) run(failed.text, failed.scope, failed.page)
    else searchNow()
  }

  return {
    query,
    scope,
    results,
    total,
    hasMore,
    status,
    error,
    searchedQuery,
    isLoading,
    minQueryLength: MIN_QUERY_LENGTH,
    searchNow,
    loadMore,
    retry,
  }
}
