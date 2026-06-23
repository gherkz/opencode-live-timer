import { describe, expect, it } from 'bun:test'
import type { TimerMap } from '../timer/tracker'
import { createToolExecuteAfter } from './tool-execute-after'

function map(): TimerMap {
  return new Map()
}

describe('tool.execute.after', () => {
  it('appends the duration footer to the output', async () => {
    const timers = map()
    let now = 1_000
    const clock = (): number => now
    const hook = createToolExecuteAfter(timers, clock)
    timers.set('c1', 1_000)
    now = 1_750
    const output = { title: 'Bash', output: 'hello world', metadata: {} }
    await hook({ tool: 'bash', sessionID: 's1', callID: 'c1', args: {} }, output)
    expect(output.output).toBe('hello world\n\nDuration: 750ms')
  })

  it('formats sub-second durations as ms', async () => {
    const timers = map()
    let now = 1_000
    const clock = (): number => now
    const hook = createToolExecuteAfter(timers, clock)
    timers.set('c1', 1_000)
    now = 1_500
    const output = { title: 'Bash', output: 'x', metadata: {} }
    await hook({ tool: 'bash', sessionID: 's1', callID: 'c1', args: {} }, output)
    expect(output.output).toBe('x\n\nDuration: 500ms')
  })

  it('formats multi-second durations with one decimal', async () => {
    const timers = map()
    let now = 1_000
    const clock = (): number => now
    const hook = createToolExecuteAfter(timers, clock)
    timers.set('c1', 1_000)
    now = 1_234
    const output = { title: 'Bash', output: 'x', metadata: {} }
    await hook({ tool: 'bash', sessionID: 's1', callID: 'c1', args: {} }, output)
    expect(output.output).toBe('x\n\nDuration: 234ms')
  })

  it('formats minute-scale durations as Nm Ns', async () => {
    const timers = map()
    let now = 1_000
    const clock = (): number => now
    const hook = createToolExecuteAfter(timers, clock)
    timers.set('c1', 1_000)
    now = 1_000 + 65_000
    const output = { title: 'Bash', output: 'x', metadata: {} }
    await hook({ tool: 'bash', sessionID: 's1', callID: 'c1', args: {} }, output)
    expect(output.output).toBe('x\n\nDuration: 1m 5s')
  })

  it('appends to empty output', async () => {
    const timers = map()
    let now = 1_000
    const clock = (): number => now
    const hook = createToolExecuteAfter(timers, clock)
    timers.set('c1', 1_000)
    now = 1_500
    const output = { title: 'Bash', output: '', metadata: {} }
    await hook({ tool: 'bash', sessionID: 's1', callID: 'c1', args: {} }, output)
    expect(output.output).toBe('\n\nDuration: 500ms')
  })

  it('appends Duration: 0s when no matching start was recorded', async () => {
    const timers = map()
    const clock = (): number => 1_000
    const hook = createToolExecuteAfter(timers, clock)
    const output = { title: 'Bash', output: 'x', metadata: {} }
    await hook({ tool: 'bash', sessionID: 's1', callID: 'unknown', args: {} }, output)
    expect(output.output).toBe('x\n\nDuration: 0s')
  })

  it('removes the timer entry after stop', async () => {
    const timers = map()
    let now = 1_000
    const clock = (): number => now
    const hook = createToolExecuteAfter(timers, clock)
    timers.set('c1', 1_000)
    now = 1_500
    const output = { title: 'Bash', output: 'x', metadata: {} }
    await hook({ tool: 'bash', sessionID: 's1', callID: 'c1', args: {} }, output)
    expect(timers.has('c1')).toBe(false)
  })

  it('appends the duration footer to metadata.output when metadata has a string output', async () => {
    const timers = map()
    let now = 1_000
    const clock = (): number => now
    const hook = createToolExecuteAfter(timers, clock)
    timers.set('c1', 1_000)
    now = 1_750
    const metadata = { output: 'hello world', exit: 0, description: 'echo', truncated: false }
    const output = { title: 'Bash', output: 'hello world', metadata }
    await hook({ tool: 'bash', sessionID: 's1', callID: 'c1', args: {} }, output)
    expect(metadata.output).toBe('hello world\n\nDuration: 750ms')
    expect(metadata.exit).toBe(0)
    expect(metadata.description).toBe('echo')
    expect(metadata.truncated).toBe(false)
  })

  it('does not throw when metadata is null', async () => {
    const timers = map()
    const clock = (): number => 1_000
    const hook = createToolExecuteAfter(timers, clock)
    const output = { title: 'Bash', output: 'x', metadata: null }
    await expect(
      hook({ tool: 'bash', sessionID: 's1', callID: 'unknown', args: {} }, output),
    ).resolves.toBeUndefined()
    expect(output.output).toBe('x\n\nDuration: 0s')
  })

  it('does not throw when metadata has no output field', async () => {
    const timers = map()
    const clock = (): number => 1_000
    const hook = createToolExecuteAfter(timers, clock)
    const output = { title: 'Bash', output: 'x', metadata: { exit: 0 } }
    await expect(
      hook({ tool: 'bash', sessionID: 's1', callID: 'unknown', args: {} }, output),
    ).resolves.toBeUndefined()
    expect(output.metadata).toEqual({ exit: 0 })
  })

  it('does not throw when metadata.output is not a string', async () => {
    const timers = map()
    const clock = (): number => 1_000
    const hook = createToolExecuteAfter(timers, clock)
    const output = { title: 'Read', output: 'x', metadata: { output: { bytes: 12 } } }
    await expect(
      hook({ tool: 'read', sessionID: 's1', callID: 'unknown', args: {} }, output),
    ).resolves.toBeUndefined()
    expect(output.metadata).toEqual({ output: { bytes: 12 } })
  })
})
