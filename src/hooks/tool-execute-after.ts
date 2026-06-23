import { formatDuration } from '../timer/duration'
import type { Clock, TimerMap } from '../timer/tracker'
import { stopTimer, systemClock } from '../timer/tracker'

export type ToolExecuteAfterInput = {
  tool: string
  sessionID: string
  callID: string
  args: unknown
}

export type ToolExecuteAfterOutput = {
  title: string
  output: string
  metadata: unknown
}

export type ToolExecuteAfterHook = (
  input: ToolExecuteAfterInput,
  output: ToolExecuteAfterOutput,
) => Promise<void>

export function createToolExecuteAfter(
  timers: TimerMap,
  clock: Clock = systemClock,
): ToolExecuteAfterHook {
  return async (input, output) => {
    const elapsed = stopTimer(timers, input.callID, clock)
    const duration = formatDuration(elapsed)
    output.output = `${output.output}\n\nDuration: ${duration}`
  }
}
