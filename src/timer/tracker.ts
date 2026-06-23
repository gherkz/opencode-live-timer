export type Clock = () => number

export const systemClock: Clock = () => Date.now()

export type TimerMap = Map<string, number>

export function startTimer(map: TimerMap, callID: string, clock: Clock = systemClock): void {
  map.set(callID, clock())
}

export function stopTimer(map: TimerMap, callID: string, clock: Clock = systemClock): number {
  const start = map.get(callID)
  if (start === undefined) return 0
  map.delete(callID)
  return clock() - start
}
