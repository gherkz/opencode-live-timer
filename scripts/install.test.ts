import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { installPlugin } from './install'

let root: string
let source: string
let target: string
const sourceContent = 'export default {}\n'

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'live-timer-install-'))
  source = join(root, 'source.ts')
  target = join(root, 'nested', 'plugins', 'live-timer.ts')
  writeFileSync(source, sourceContent)
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('installPlugin', () => {
  it('creates the target directory when it is missing', () => {
    expect(existsSync(join(root, 'nested'))).toBe(false)
    installPlugin({ source, target })
    expect(existsSync(join(root, 'nested', 'plugins'))).toBe(true)
  })

  it('copies the source content to the target', () => {
    installPlugin({ source, target })
    expect(readFileSync(target, 'utf8')).toBe(sourceContent)
  })

  it('produces a regular file at the target, not a symlink', () => {
    installPlugin({ source, target })
    const stat = lstatSync(target)
    expect(stat.isSymbolicLink()).toBe(false)
    expect(stat.isFile()).toBe(true)
  })

  it('overwrites an existing regular file at the target', () => {
    mkdirSync(join(root, 'nested', 'plugins'), { recursive: true })
    writeFileSync(target, 'stale content')
    installPlugin({ source, target })
    expect(readFileSync(target, 'utf8')).toBe(sourceContent)
  })

  it('overwrites a symlink already present at the target', () => {
    mkdirSync(join(root, 'nested', 'plugins'), { recursive: true })
    const other = join(root, 'other.ts')
    writeFileSync(other, 'other content')
    symlinkSync(other, target)
    installPlugin({ source, target })
    expect(lstatSync(target).isSymbolicLink()).toBe(false)
    expect(readFileSync(target, 'utf8')).toBe(sourceContent)
  })

  it('re-runs are idempotent when the source is unchanged', () => {
    installPlugin({ source, target })
    installPlugin({ source, target })
    expect(readFileSync(target, 'utf8')).toBe(sourceContent)
  })

  it('leaves the source file untouched', () => {
    installPlugin({ source, target })
    expect(readFileSync(source, 'utf8')).toBe(sourceContent)
  })
})
