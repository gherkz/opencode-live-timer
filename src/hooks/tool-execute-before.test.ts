import { describe, expect, it } from 'bun:test'
import type { TimerMap } from '../timer/tracker'
import { createToolExecuteBefore } from './tool-execute-before'

function map(): TimerMap {
  return new Map()
}

describe('tool.execute.before', () => {
  it('records a start time for the callID', async () => {
    const timers = map()
    const now = 1_000
    const hook = createToolExecuteBefore(timers, () => now)
    await hook({ tool: 'bash', sessionID: 's1', callID: 'c1' })
    expect(timers.get('c1')).toBe(1_000)
  })

  it('keeps entries per callID', async () => {
    const timers = map()
    let now = 1_000
    const hook = createToolExecuteBefore(timers, () => now)
    await hook({ tool: 'bash', sessionID: 's1', callID: 'a' })
    now = 2_000
    await hook({ tool: 'bash', sessionID: 's1', callID: 'b' })
    expect(timers.get('a')).toBe(1_000)
    expect(timers.get('b')).toBe(2_000)
  })

  it('is idempotent across repeated calls for the same callID', async () => {
    const timers = map()
    let now = 1_000
    const hook = createToolExecuteBefore(timers, () => now)
    await hook({ tool: 'bash', sessionID: 's1', callID: 'c1' })
    now = 1_500
    await hook({ tool: 'bash', sessionID: 's1', callID: 'c1' })
    expect(timers.get('c1')).toBe(1_500)
  })
})
