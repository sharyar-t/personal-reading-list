<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Menu, Search, X } from '@lucide/vue'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from 'reka-ui'
import AppLogo from './AppLogo.vue'
import SidebarNav from './SidebarNav.vue'
import ThemeToggle from './ThemeToggle.vue'

const open = ref(false)
const route = useRoute()

watch(
  () => route.fullPath,
  () => {
    open.value = false
  },
)

const iconButton =
  'grid size-11 place-items-center rounded-md text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary'
</script>

<template>
  <header
    class="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-border-subtle bg-bg-primary/90 px-2 backdrop-blur sm:px-4 lg:hidden"
  >
    <DialogRoot v-model:open="open">
      <DialogTrigger :class="iconButton" aria-label="Open navigation">
        <Menu class="size-6" aria-hidden="true" />
      </DialogTrigger>

      <DialogPortal>
        <DialogOverlay
          class="fixed inset-0 z-40 bg-black/40 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
        />
        <DialogContent
          class="fixed inset-y-0 left-0 z-50 flex w-[min(20rem,85vw)] flex-col bg-bg-secondary shadow-lg data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:animate-in data-[state=open]:slide-in-from-left"
        >
          <div class="flex h-16 items-center justify-between pr-2 pl-4">
            <AppLogo to="/library" />
            <DialogClose :class="iconButton" aria-label="Close navigation">
              <X class="size-6" aria-hidden="true" />
            </DialogClose>
          </div>
          <DialogTitle class="sr-only">Navigation</DialogTitle>
          <DialogDescription class="sr-only"
            >Browse your library, shelves and stats</DialogDescription
          >

          <div class="flex-1 overflow-y-auto px-3 py-4">
            <SidebarNav />
          </div>

          <div class="flex items-center justify-between border-t border-border-subtle p-4">
            <span class="text-sm text-text-secondary">Theme</span>
            <ThemeToggle />
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <AppLogo to="/library" />

    <RouterLink to="/search" :class="iconButton" aria-label="Find books">
      <Search class="size-6" aria-hidden="true" />
    </RouterLink>
  </header>
</template>
