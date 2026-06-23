import { describe, expect, it } from 'bun:test'
import LiveTimer from '../index'

const ctx = {} as unknown as Parameters<typeof LiveTimer>[0]

describe('plugin', () => {
  it('loads and returns a hooks object', async () => {
    const hooks = await LiveTimer(ctx)
    expect(hooks).toBeDefined()
    expect(typeof hooks).toBe('object')
  })
})
