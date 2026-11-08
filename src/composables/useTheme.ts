import { computed } from 'vue'
import { useColorMode } from '@vueuse/core'

/** Must stay in sync with the inline script in index.html */
export const THEME_STORAGE_KEY = 'bookshelf-theme'

export type ThemePreference = 'light' | 'dark' | 'auto'

const ORDER: ThemePreference[] = ['auto', 'light', 'dark']

export const THEME_LABELS: Record<ThemePreference, string> = {
  auto: 'System',
  light: 'Light',
  dark: 'Dark',
}

export function useTheme() {
  const mode = useColorMode({
    attribute: 'data-theme',
    storageKey: THEME_STORAGE_KEY,
    initialValue: 'auto',
  })

  /** What the user picked: light, dark or follow the system */
  const preference = computed<ThemePreference>({
    get: () => mode.store.value,
    set: (value) => {
      mode.store.value = value
    },
  })

  /** The theme actually applied right now */
  const resolved = computed(() => mode.state.value)

  const next = computed(() => ORDER[(ORDER.indexOf(preference.value) + 1) % ORDER.length]!)

  function cycle() {
    preference.value = next.value
  }

  return { preference, resolved, next, cycle }
}
