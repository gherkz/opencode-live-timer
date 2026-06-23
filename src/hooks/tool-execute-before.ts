import type { Clock, TimerMap } from '../timer/tracker'
import { startTimer, systemClock } from '../timer/tracker'

export type ToolExecuteBeforeInput = {
  tool: string
  sessionID: string
  callID: string
}

export type ToolExecuteBeforeHook = (input: ToolExecuteBeforeInput) => Promise<void>

export function createToolExecuteBefore(
  timers: TimerMap,
  clock: Clock = systemClock,
): ToolExecuteBeforeHook {
  return async (input) => {
    startTimer(timers, input.callID, clock)
  }
}
