import { existsSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export type UnlinkPluginOptions = {
  target: string
}

export function unlinkPlugin(options: UnlinkPluginOptions): void {
  const { target } = options
  if (existsSync(target)) {
    rmSync(target, { force: true })
  }
}

function main(): void {
  const target = join(homedir(), '.config', 'opencode', 'plugins', 'live-timer.ts')
  if (!existsSync(target)) {
    process.stdout.write(`Not installed at ${target}\n`)
    return
  }
  unlinkPlugin({ target })
  process.stdout.write(`Removed ${target}\n`)
}

if (import.meta.main) {
  try {
    main()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    process.stderr.write(`uninstall failed: ${message}\n`)
    process.exit(1)
  }
}
