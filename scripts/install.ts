import { copyFileSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

export type InstallPluginOptions = {
  source: string
  target: string
}

export function installPlugin(options: InstallPluginOptions): void {
  const { source, target } = options
  mkdirSync(dirname(target), { recursive: true })
  if (existsSync(target)) {
    rmSync(target, { force: true })
  }
  copyFileSync(source, target)
}

function main(): void {
  const projectRoot = resolve(import.meta.dir, '..')
  const source = join(projectRoot, 'src', 'index.ts')
  const target = join(homedir(), '.config', 'opencode', 'plugins', 'live-timer.ts')
  installPlugin({ source, target })
  process.stdout.write(`Installed ${source} -> ${target}\n`)
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
