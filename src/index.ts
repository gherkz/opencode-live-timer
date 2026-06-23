import type { Plugin } from '@opencode-ai/plugin'
import { createToolExecuteAfter } from './hooks/tool-execute-after'
import { createToolExecuteBefore } from './hooks/tool-execute-before'
import type { TimerMap } from './timer/tracker'

const LiveTimer: Plugin = async ({ client }) => {
  const timers: TimerMap = new Map()

  const before = createToolExecuteBefore(timers)
  const after = createToolExecuteAfter(timers)

  return {
    'tool.execute.before': async (input) => {
      try {
        await before(input)
      } catch (err) {
        await client.app.log({
          body: {
            service: 'live-timer',
            level: 'error',
            message: `tool.execute.before failed: ${err instanceof Error ? err.message : String(err)}`,
          },
        })
      }
    },
    'tool.execute.after': async (input, output) => {
      try {
        await after(input, output)
      } catch (err) {
        await client.app.log({
          body: {
            service: 'live-timer',
            level: 'error',
            message: `tool.execute.after failed: ${err instanceof Error ? err.message : String(err)}`,
          },
        })
      }
    },
  }
}

export default LiveTimer
