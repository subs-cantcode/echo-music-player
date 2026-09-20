import { describe, it, expect } from 'vitest'
import { parseSyncedLyrics, isSyncedLyrics } from './lyrics.js'

describe('parseSyncedLyrics', () => {
  it('parses standard [mm:ss.xx] timestamps', () => {
    const parsed = parseSyncedLyrics('[00:12.34]First line\n[01:05.00]Second line')
    expect(parsed).toEqual([
      { time: 12.34, text: 'First line' },
      { time: 65, text: 'Second line' },
    ])
  })

  it('parses single-digit minutes and tenths pasted from LRC variants', () => {
    const parsed = parseSyncedLyrics('[1:5.5]Line one\n[0:12]Line two')
    expect(parsed).toEqual([
      { time: 12, text: 'Line two' },
      { time: 65.5, text: 'Line one' },
    ])
  })

  it('ignores section headers like [Verse 1]', () => {
    expect(parseSyncedLyrics('[Verse 1]\n[00:01.00]Hello')).toEqual([{ time: 1, text: 'Hello' }])
  })
})

describe('isSyncedLyrics', () => {
  it('detects timestamped lyrics', () => {
    expect(isSyncedLyrics('[00:01.00]Hi')).toBe(true)
    expect(isSyncedLyrics('[1:5.5]Hi')).toBe(true)
  })

  it('rejects plain lyrics and section headers', () => {
    expect(isSyncedLyrics('Just a plain line\nAnother line')).toBe(false)
    expect(isSyncedLyrics('[Chorus]\nSing along')).toBe(false)
  })
})
