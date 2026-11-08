import { ref } from 'vue'

const message = ref('')

/**
 * Screen-reader announcements for things that change without a page load
 * ("Added Dune to Want to Read"). Rendered once by <LiveAnnouncer /> in App.vue.
 */
export function useAnnouncer() {
  function announce(text: string) {
    // Clear first so repeating the same message is announced again
    message.value = ''
    requestAnimationFrame(() => {
      message.value = text
    })
  }
  return { message, announce }
}
