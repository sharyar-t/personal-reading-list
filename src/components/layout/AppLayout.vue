<script setup lang="ts">
import { nextTick, useTemplateRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useLocalStorage } from '@vueuse/core'
import { useLibraryStore } from '@/stores/library'
import AppSidebar from './AppSidebar.vue'
import MobileHeader from './MobileHeader.vue'
import StorageNotice from './StorageNotice.vue'

const library = useLibraryStore()
library.init()

const sidebarCollapsed = useLocalStorage('bookshelf-sidebar-collapsed', false)

const route = useRoute()
const main = useTemplateRef<HTMLElement>('main')

// Move focus to the new page heading after client-side navigation so screen
// reader and keyboard users land on the new content (not on the clicked link).
watch(
  () => route.path,
  async () => {
    await nextTick()
    const target = main.value?.querySelector<HTMLElement>('h1') ?? main.value
    if (!target) return
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
    target.focus({ preventScroll: true })
    window.scrollTo({ top: 0 })
  },
)
</script>

<template>
  <a
    href="#main-content"
    class="fixed top-3 left-3 z-100 -translate-y-24 rounded-md bg-accent px-4 py-2 font-semibold text-white shadow-lg transition-transform focus:translate-y-0 dark:text-bg-primary"
  >
    Skip to main content
  </a>

  <div class="flex min-h-dvh">
    <AppSidebar v-model:collapsed="sidebarCollapsed" />

    <div class="flex min-w-0 flex-1 flex-col">
      <MobileHeader />
      <main
        id="main-content"
        ref="main"
        tabindex="-1"
        class="mx-auto w-full max-w-library flex-1 px-4 py-6 outline-none sm:px-6 lg:px-10 lg:py-10"
      >
        <StorageNotice class="mb-6" />
        <slot />
      </main>
    </div>
  </div>
</template>
