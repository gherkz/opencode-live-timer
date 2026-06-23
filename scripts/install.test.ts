import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { linkPlugin } from './install'

let root: string
let source: string
let target: string

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'live-timer-install-'))
  source = join(root, 'source.ts')
  target = join(root, 'nested', 'plugins', 'live-timer.ts')
  writeFileSync(source, 'export default {}')
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('linkPlugin', () => {
  it('creates the target directory when it is missing', () => {
    expect(existsSync(join(root, 'nested'))).toBe(false)
    linkPlugin({ source, target })
    expect(existsSync(join(root, 'nested', 'plugins'))).toBe(true)
  })

  it('creates a symlink that resolves to the source file', () => {
    linkPlugin({ source, target })
    expect(readlinkSync(target)).toBe(source)
  })

  it('overwrites an existing file at the target', () => {
    mkdirSync(join(root, 'nested', 'plugins'), { recursive: true })
    writeFileSync(target, 'stale')
    linkPlugin({ source, target })
    expect(readlinkSync(target)).toBe(source)
  })

  it('overwrites a stale symlink pointing elsewhere', () => {
    mkdirSync(join(root, 'nested', 'plugins'), { recursive: true })
    const other = join(root, 'other.ts')
    writeFileSync(other, 'other')
    symlinkSync(other, target)
    linkPlugin({ source, target })
    expect(readlinkSync(target)).toBe(source)
  })

  it('is idempotent when the symlink already points at the source', () => {
    mkdirSync(join(root, 'nested', 'plugins'), { recursive: true })
    symlinkSync(source, target)
    linkPlugin({ source, target })
    expect(readlinkSync(target)).toBe(source)
  })

  it('leaves the source file untouched', () => {
    const before = 'export default {}'
    writeFileSync(source, before)
    linkPlugin({ source, target })
    expect(existsSync(source)).toBe(true)
  })
})
