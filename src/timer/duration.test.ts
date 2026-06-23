import { describe, expect, it } from 'bun:test'
import { formatDuration } from './duration'

describe('formatDuration', () => {
  it('returns 0s for 0 milliseconds', () => {
    expect(formatDuration(0)).toBe('0s')
  })

  it('returns 0s for negative milliseconds', () => {
    expect(formatDuration(-1)).toBe('0s')
    expect(formatDuration(-9999)).toBe('0s')
  })

  it('returns 0s for non-finite values', () => {
    expect(formatDuration(Number.NaN)).toBe('0s')
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBe('0s')
    expect(formatDuration(Number.NEGATIVE_INFINITY)).toBe('0s')
  })

  it('formats sub-second durations in milliseconds', () => {
    expect(formatDuration(1)).toBe('1ms')
    expect(formatDuration(500)).toBe('500ms')
    expect(formatDuration(999)).toBe('999ms')
  })

  it('formats seconds with one decimal under one minute', () => {
    expect(formatDuration(1000)).toBe('1.0s')
    expect(formatDuration(1500)).toBe('1.5s')
    expect(formatDuration(12_345)).toBe('12.3s')
    expect(formatDuration(59_999)).toBe('60.0s')
  })

  it('formats minutes and seconds for durations over one minute', () => {
    expect(formatDuration(60_000)).toBe('1m 0s')
    expect(formatDuration(65_000)).toBe('1m 5s')
    expect(formatDuration(125_500)).toBe('2m 5s')
    expect(formatDuration(3_599_000)).toBe('59m 59s')
  })
})
