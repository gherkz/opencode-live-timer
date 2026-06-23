import { describe, expect, it } from 'bun:test'
import type { PluginInput } from '@opencode-ai/plugin'
import LiveTimer from '../index'

function makeCtx(): PluginInput {
  return {
    client: {
      app: {
        log: async () => ({}),
      },
    },
  } as unknown as PluginInput
}

describe('plugin', () => {
  it('loads and returns a hooks object', async () => {
    const hooks = await LiveTimer(makeCtx())
    expect(hooks).toBeDefined()
    expect(typeof hooks).toBe('object')
  })

  it('registers tool.execute.before', async () => {
    const hooks = await LiveTimer(makeCtx())
    expect(typeof hooks['tool.execute.before']).toBe('function')
  })

  it('registers tool.execute.after', async () => {
    const hooks = await LiveTimer(makeCtx())
    expect(typeof hooks['tool.execute.after']).toBe('function')
  })
})
