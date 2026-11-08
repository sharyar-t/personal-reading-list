import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BookCover from '@/components/book/BookCover.vue'

describe('BookCover', () => {
  it('renders a labelled placeholder when there is no cover', () => {
    const wrapper = mount(BookCover, { props: { title: 'Piranesi', author: 'Susanna Clarke' } })

    expect(wrapper.find('img').exists()).toBe(false)
    const placeholder = wrapper.get('[role="img"]')
    expect(placeholder.attributes('aria-label')).toBe('Cover of Piranesi')
    expect(placeholder.text()).toContain('Susanna Clarke')
  })

  it('falls back to the placeholder when the image fails to load', async () => {
    const wrapper = mount(BookCover, {
      props: { title: 'Dune', src: 'https://covers.openlibrary.org/b/isbn/1-L.jpg' },
    })

    await wrapper.get('img').trigger('error')

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.get('[role="img"]').attributes('aria-label')).toBe('Cover of Dune')
  })

  it('hides the cover from assistive tech when decorative', () => {
    const wrapper = mount(BookCover, { props: { title: 'Dune', decorative: true } })
    expect(wrapper.find('[role="img"]').exists()).toBe(false)
  })

  it('keeps the medium cover when the large one fails to load', async () => {
    const wrapper = mount(BookCover, {
      props: { title: 'Circe', size: 'L', src: 'https://covers.openlibrary.org/b/isbn/1-L.jpg' },
    })
    const [preview, main] = wrapper.findAll('img')
    expect(preview!.attributes('src')).toContain('-M.jpg')
    expect(main!.attributes('src')).toContain('-L.jpg')

    await preview!.trigger('load')
    await main!.trigger('error')

    expect(wrapper.findAll('img')).toHaveLength(1)
    expect(wrapper.find('[role="img"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Cover of Circe') // sr-only description moves to preview
  })
})
