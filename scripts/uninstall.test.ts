import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { unlinkPlugin } from './uninstall'

let root: string
let target: string
let source: string

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'live-timer-uninstall-'))
  source = join(root, 'source.ts')
  target = join(root, 'plugins', 'live-timer.ts')
  writeFileSync(source, 'export default {}')
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('unlinkPlugin', () => {
  it('is a no-op when the target is absent', () => {
    expect(() => unlinkPlugin({ target })).not.toThrow()
    expect(existsSync(target)).toBe(false)
  })

  it('removes an existing regular file at the target', () => {
    mkdirSync(join(root, 'plugins'), { recursive: true })
    writeFileSync(target, 'stale')
    unlinkPlugin({ target })
    expect(existsSync(target)).toBe(false)
  })

  it('removes an existing symlink at the target', () => {
    mkdirSync(join(root, 'plugins'), { recursive: true })
    symlinkSync(source, target)
    unlinkPlugin({ target })
    expect(existsSync(target)).toBe(false)
  })

  it('does not touch the file the symlink pointed at', () => {
    mkdirSync(join(root, 'plugins'), { recursive: true })
    symlinkSync(source, target)
    unlinkPlugin({ target })
    expect(existsSync(source)).toBe(true)
  })

  it('reports the target as a symlink before removal', () => {
    mkdirSync(join(root, 'plugins'), { recursive: true })
    symlinkSync(source, target)
    expect(lstatSync(target).isSymbolicLink()).toBe(true)
    unlinkPlugin({ target })
    expect(existsSync(target)).toBe(false)
  })
})
