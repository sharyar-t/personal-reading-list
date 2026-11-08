<script setup lang="ts">
import type { Component } from 'vue'
import {
  BookCheck,
  BookMarked,
  BookOpen,
  Bookmark,
  ChartColumn,
  Heart,
  Library,
  ListOrdered,
  Search,
  Target,
  Users,
} from '@lucide/vue'
import { useLibraryStore } from '@/stores/library'
import NavItem from './NavItem.vue'

defineProps<{ collapsed?: boolean }>()

const library = useLibraryStore()

const primaryLinks = [
  { to: '/library', label: 'Library', icon: Library },
  { to: '/search', label: 'Find books', icon: Search },
  { to: '/stats', label: 'Year in review', icon: ChartColumn },
  { to: '/goals', label: 'Reading goal', icon: Target },
]

const SHELF_ICONS: Record<string, Component> = {
  'currently-reading': BookOpen,
  'want-to-read': Bookmark,
  read: BookCheck,
  favorites: Heart,
  'book-club': Users,
}
</script>

<template>
  <nav aria-label="Main" class="flex flex-col gap-6">
    <ul class="flex flex-col gap-1" role="list">
      <li v-for="link in primaryLinks" :key="link.to">
        <NavItem v-bind="link" :collapsed="collapsed" />
      </li>
    </ul>

    <section aria-labelledby="nav-shelves-heading" class="flex flex-col gap-1">
      <h2
        id="nav-shelves-heading"
        class="px-3 pb-1 font-sans text-xs font-semibold tracking-wider text-text-tertiary uppercase"
        :class="collapsed && 'sr-only'"
      >
        Shelves
      </h2>
      <ul class="flex flex-col gap-1" role="list">
        <li v-for="shelf in library.sortedShelves" :key="shelf.id">
          <NavItem
            :to="{ name: 'shelf', params: { shelfId: shelf.id } }"
            :label="shelf.name"
            :icon="SHELF_ICONS[shelf.id] ?? BookMarked"
            :count="library.status === 'ready' ? library.countFor(shelf.id) : undefined"
            :collapsed="collapsed"
          />
        </li>
        <li>
          <NavItem
            :to="{ name: 'manage-shelves' }"
            label="Manage shelves"
            :icon="ListOrdered"
            :collapsed="collapsed"
          />
        </li>
      </ul>
    </section>
  </nav>
</template>
