<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { coverUrl, type CoverSize } from '@/lib/covers'
import { hashString } from '@/lib/hash'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    title: string
    author?: string
    src?: string | null
    size?: CoverSize
    /** Set for above-the-fold covers (e.g. landing hero) */
    eager?: boolean
    /** Hide from assistive tech when the title is already rendered next to the cover */
    decorative?: boolean
    class?: string
  }>(),
  { size: 'M', eager: false, decorative: false },
)

const PLACEHOLDER_COLORS = ['bg-cover-1', 'bg-cover-2', 'bg-cover-3', 'bg-cover-4', 'bg-cover-5']

interface ImageState {
  src: string | null
  loaded: boolean
  failed: boolean
}

const image = (src: string | null): ImageState => ({ src, loaded: false, failed: false })

/**
 * Large covers load progressively: Open Library serves "L" covers through
 * slow archive.org redirects (often 2–4 s), so the "M" version — usually
 * already cached from the library grid — shows first and the sharp one fades
 * in over it. If the large one fails, the medium one simply stays.
 */
const main = ref(image(null))
const preview = ref(image(null))

watch(
  () => [props.src, props.size] as const,
  ([src, size]) => {
    main.value = image(coverUrl(src, size))
    preview.value = image(size === 'L' ? coverUrl(src, 'M') : null)
  },
  { immediate: true },
)

const usable = (state: ImageState) => !!state.src && !state.failed
const anyLoaded = computed(
  () =>
    (usable(main.value) && main.value.loaded) || (usable(preview.value) && preview.value.loaded),
)
const anyPending = computed(() => usable(main.value) || usable(preview.value))
/** No image will ever show — the placeholder *is* the cover */
const placeholderIsContent = computed(() => !anyPending.value && !props.decorative)
const placeholderColor = computed(
  () => PLACEHOLDER_COLORS[hashString(props.title) % PLACEHOLDER_COLORS.length],
)
</script>

<template>
  <div
    :class="
      cn(
        '@container relative aspect-2/3 w-full overflow-hidden rounded-sm bg-bg-tertiary shadow-book',
        props.class,
      )
    "
  >
    <!-- Styled placeholder: shown while loading and when the cover is missing -->
    <div
      v-if="!anyLoaded"
      :class="[
        'absolute inset-0 flex flex-col justify-between p-[9cqi] text-text-primary',
        placeholderColor,
        anyPending && 'animate-pulse',
      ]"
      :role="placeholderIsContent ? 'img' : undefined"
      :aria-label="placeholderIsContent ? `Cover of ${title}` : undefined"
      :aria-hidden="placeholderIsContent ? undefined : 'true'"
    >
      <span class="h-px w-1/3 bg-current opacity-30" />
      <span
        class="line-clamp-5 font-heading text-[clamp(0.625rem,11cqi,1.5rem)] leading-tight font-semibold"
      >
        {{ title }}
      </span>
      <span
        v-if="author"
        class="line-clamp-2 text-[clamp(0.5rem,7cqi,0.875rem)] leading-snug text-text-secondary"
      >
        {{ author }}
      </span>
      <span v-else />
    </div>

    <!-- Low-res preview for large covers; hidden from AT, the main image carries the alt -->
    <img
      v-if="usable(preview)"
      :src="preview.src!"
      alt=""
      aria-hidden="true"
      :loading="eager ? 'eager' : 'lazy'"
      decoding="async"
      :class="[
        'absolute inset-0 size-full object-cover transition-opacity duration-300',
        preview.loaded ? 'opacity-100' : 'opacity-0',
      ]"
      @load="preview.loaded = true"
      @error="preview.failed = true"
    />

    <img
      v-if="usable(main)"
      :src="main.src!"
      :alt="decorative ? '' : `Cover of ${title}`"
      :loading="eager ? 'eager' : 'lazy'"
      :fetchpriority="eager ? 'high' : 'auto'"
      decoding="async"
      :class="[
        'absolute inset-0 size-full object-cover transition-opacity duration-500',
        main.loaded ? 'opacity-100' : 'opacity-0',
      ]"
      @load="main.loaded = true"
      @error="main.failed = true"
    />
    <!-- If only the preview survived, it needs to carry the description -->
    <span v-if="!decorative && !usable(main) && usable(preview)" class="sr-only">
      Cover of {{ title }}
    </span>

    <!-- Spine highlight for a subtle physical feel -->
    <span
      class="pointer-events-none absolute inset-y-0 left-0 w-[4%] bg-linear-to-r from-black/15 to-transparent"
      aria-hidden="true"
    />
  </div>
</template>
