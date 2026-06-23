import { existsSync, mkdirSync, rmSync, symlinkSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

export type LinkPluginOptions = {
  source: string
  target: string
}

export function linkPlugin(options: LinkPluginOptions): void {
  const { source, target } = options
  const targetDir = dirname(target)
  mkdirSync(targetDir, { recursive: true })
  if (existsSync(target)) {
    rmSync(target, { force: true })
  }
  symlinkSync(source, target)
}

function main(): void {
  const projectRoot = resolve(import.meta.dir, '..')
  const source = join(projectRoot, 'src', 'index.ts')
  const target = join(homedir(), '.config', 'opencode', 'plugins', 'live-timer.ts')
  linkPlugin({ source, target })
  process.stdout.write(`Linked ${source} -> ${target}\n`)
}

if (import.meta.main) {
  try {
    main()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    process.stderr.write(`install failed: ${message}\n`)
    process.exit(1)
  }
}
