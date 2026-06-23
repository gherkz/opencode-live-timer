import { describe, expect, it } from 'bun:test'
import { type TimerMap, startTimer, stopTimer } from './tracker'

function map(): TimerMap {
  return new Map()
}

describe('tracker', () => {
  it('records start time for a call', () => {
    const timers = map()
    const clock = (): number => 1_000
    startTimer(timers, 'call-1', clock)
    expect(timers.get('call-1')).toBe(1_000)
  })

  it('returns elapsed milliseconds when stopped', () => {
    const timers = map()
    let now = 1_000
    const clock = (): number => now
    startTimer(timers, 'call-1', clock)
    now = 1_750
    expect(stopTimer(timers, 'call-1', clock)).toBe(750)
  })

  it('removes the entry after stop', () => {
    const timers = map()
    const clock = (): number => 1_000
    startTimer(timers, 'call-1', clock)
    stopTimer(timers, 'call-1', clock)
    expect(timers.has('call-1')).toBe(false)
  })

  it('returns 0 when stopping an unknown call', () => {
    const timers = map()
    const clock = (): number => 1_000
    expect(stopTimer(timers, 'missing', clock)).toBe(0)
  })

  it('keeps per-call entries independent', () => {
    const timers = map()
    let now = 1_000
    const clock = (): number => now
    startTimer(timers, 'a', clock)
    now = 1_500
    startTimer(timers, 'b', clock)
    now = 1_900
    expect(stopTimer(timers, 'a', clock)).toBe(900)
    expect(stopTimer(timers, 'b', clock)).toBe(400)
  })

  it('overwrites an existing start on repeated startTimer', () => {
    const timers = map()
    let now = 1_000
    const clock = (): number => now
    startTimer(timers, 'call-1', clock)
    now = 1_500
    startTimer(timers, 'call-1', clock)
    now = 1_800
    expect(stopTimer(timers, 'call-1', clock)).toBe(300)
  })

  it('uses Date.now by default', () => {
    const timers = map()
    startTimer(timers, 'call-1')
    const started = timers.get('call-1')
    expect(typeof started).toBe('number')
    expect(started).toBeGreaterThan(0)
  })
})
