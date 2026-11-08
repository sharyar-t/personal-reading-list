import { beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useLibraryStore } from '@/stores/library'
import { createMemoryStorage } from '@/services/storage'
import StarRating from '@/components/book/StarRating.vue'
import ReadingProgress from '@/components/book/ReadingProgress.vue'
import BookDetailView from '@/views/BookDetailView.vue'

// jsdom lacks rAF timing guarantees used by the announcer
globalThis.requestAnimationFrame ??= (cb) => setTimeout(cb, 0) as unknown as number

async function readyLibrary() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const library = useLibraryStore()
  await library.init(createMemoryStorage())
  return { pinia, library }
}

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/library', component: { template: '<div />' } },
      { path: '/search', component: { template: '<div />' } },
      { path: '/shelves/:shelfId', name: 'shelf', component: { template: '<div />' } },
      { path: '/books/:bookId', name: 'book', component: BookDetailView, props: true },
    ],
  })
}

describe('StarRating', () => {
  it('emits the chosen star and can be cleared', async () => {
    const wrapper = mount(StarRating, { props: { modelValue: 3 } })
    await wrapper.findAll('input[type="radio"]')[4]!.setValue()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([5])

    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([null])
  })
})

describe('ReadingProgress', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('updates by page with quick increments and validates input', async () => {
    const { pinia, library } = await readyLibrary()
    const wrapper = mount(ReadingProgress, {
      props: { book: library.getBook('circe')! },
      global: { plugins: [pinia] },
    })
    expect(wrapper.text()).toContain('Page 212 of 393')
    expect(wrapper.text()).toContain('181 pages left')

    await wrapper.get('button[aria-label="Add 25 pages"]').trigger('click')
    await flushPromises()
    expect(library.getBook('circe')!.progress).toMatchObject({ currentPage: 237, percent: 60 })

    await wrapper.get('input').setValue('999')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.get('[role="alert"]').text()).toBe('This edition has 393 pages.')
    expect(library.getBook('circe')!.progress?.currentPage).toBe(237)
  })

  it('tracks percent for books without a page count', async () => {
    const { pinia, library } = await readyLibrary()
    const wrapper = mount(ReadingProgress, {
      props: { book: library.getBook('eloquent-javascript')! },
      global: { plugins: [pinia] },
    })
    expect(wrapper.text()).toContain('no page count')
    await wrapper.get('button[aria-label="Add 10%"]').trigger('click')
    await flushPromises()
    expect(library.getBook('eloquent-javascript')!.progress).toMatchObject({
      currentPage: null,
      percent: 45,
    })
  })
})

describe('BookDetailView', () => {
  beforeEach(() => setActivePinia(createPinia()))

  async function mountBook(bookId: string) {
    const { pinia, library } = await readyLibrary()
    const router = makeRouter()
    await router.push(`/books/${bookId}`)
    const wrapper = mount(BookDetailView, {
      props: { bookId },
      global: { plugins: [pinia, router] },
      attachTo: document.body,
    })
    return { wrapper, library, router }
  }

  it('hides metadata the book does not have', async () => {
    const { wrapper } = await mountBook('the-mythical-man-month')
    expect(wrapper.find('#about-heading').exists()).toBe(false) // no description
    expect(wrapper.text()).toContain('ISBN-13')

    const { wrapper: eloquent } = await mountBook('eloquent-javascript')
    expect(eloquent.text()).not.toContain('ISBN')
    expect(eloquent.text()).not.toContain('Pages')
    wrapper.unmount()
    eloquent.unmount()
  })

  it('celebrates reaching the last page and moves the book to Read on request', async () => {
    const { wrapper, library } = await mountBook('circe')

    await wrapper.get('input[type="number"]').setValue('393')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('You finished Circe!')
    expect(library.getBook('circe')!.shelfId).toBe('currently-reading')

    // Rate it from the celebration card, then finish
    const card = wrapper.get('[aria-labelledby="finished-heading"]')
    await card.findAll('input[type="radio"]')[3]!.setValue()
    const moveButton = card.findAll('button').find((b) => b.text() === 'Move to Read')!
    await moveButton.trigger('click')
    await flushPromises()

    const circe = library.getBook('circe')!
    expect(circe).toMatchObject({ shelfId: 'read', rating: 4 })
    expect(circe.finishedAt).not.toBeNull()
    wrapper.unmount()
  })

  it('"Not yet" keeps the book on Currently Reading', async () => {
    const { wrapper, library } = await mountBook('circe')
    await wrapper.get('input[type="number"]').setValue('393')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    const notYet = wrapper.findAll('button').find((b) => b.text() === 'Not yet')!
    await notYet.trigger('click')
    expect(wrapper.text()).not.toContain('You finished')
    expect(wrapper.find('#progress-heading').exists()).toBe(true)
    expect(library.getBook('circe')!.shelfId).toBe('currently-reading')
    wrapper.unmount()
  })

  it('shows a helpful state for unknown books', async () => {
    const { wrapper } = await mountBook('no-such-book')
    expect(wrapper.get('h1').text()).toBe('Book not found')
    wrapper.unmount()
  })
})
