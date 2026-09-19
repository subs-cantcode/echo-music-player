import '@testing-library/jest-dom/vitest'

// jsdom reports 0 for every layout metric, so MarqueeText's overflow check
// (scrollWidth > parent clientWidth) would never fire. Fake a deterministic
// measurement: the container is 100px and any text longer than 10 characters
// is treated as overflowing it.
Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
  configurable: true,
  get() {
    return 100
  },
})

Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
  configurable: true,
  get() {
    return (this.textContent || '').length > 10 ? 500 : 40
  },
})
