import { onScopeDispose, ref, shallowRef, watch, type Ref } from 'vue'
import { isAbortError, OpenLibraryError } from '@/services/openLibrary/client'
import { fetchTrending, type TrendingPeriod } from '@/services/openLibrary/trending'
import type { SearchResult } from '@/services/openLibrary/normalize'
import { SEARCH_ERROR_MESSAGES } from '@/composables/useBookSearch'

export type TrendingStatus = 'loading' | 'success' | 'error'

/** Loads trending books for a period, cancelling the previous request when it changes. */
export function useTrending(period: Ref<TrendingPeriod>) {
  const results = shallowRef<SearchResult[]>([])
  const status = ref<TrendingStatus>('loading')
  const error = ref<string | null>(null)
  let controller: AbortController | null = null

  async function load() {
    controller?.abort()
    controller = new AbortController()
    const { signal } = controller
    status.value = 'loading'
    error.value = null
    try {
      const books = await fetchTrending(period.value, signal)
      if (signal.aborted) return
      results.value = books
      status.value = 'success'
    } catch (caught) {
      if (isAbortError(caught) || signal.aborted) return
      error.value =
        caught instanceof OpenLibraryError
          ? SEARCH_ERROR_MESSAGES[caught.kind]
          : 'We couldn’t load trending books. Please try again.'
      status.value = 'error'
    }
  }

  watch(period, load, { immediate: true })
  onScopeDispose(() => controller?.abort())

  return { results, status, error, retry: load }
}
