/**
 * Paired always-armed suite for the #105 digital bizStep vocabulary.
 *
 * Honest-grade law: this suite enforces the invariants declared in
 * .scripts/gs1-digital-bizsteps-ratchet.json — that the digital-interaction
 * bizSteps remain OUR openly-marked DRAFT SUPERSET of GS1 CBV, never claimed
 * as ratified GS1. It also pins the declared scope narrowing (Rendering
 * excluded) and the conceptual-only down-projections (pure superset terms
 * carry NO fabricated ref.gs1.org target).
 *
 * If any of these invariants drift, this suite fails — surfacing the debt
 * instead of letting it be papered over to green.
 */

import { describe, it, expect } from 'bun:test'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const ROOT = process.cwd()
const DATA_FILE = join(ROOT, '.data', 'GS1.BusinessSteps.tsv')
const SOURCE_FILE = join(ROOT, '.source', 'GS1', 'GS1.BusinessStep.VerbMapping.tsv')
const MDX_FILE = join(ROOT, 'GS1', 'cbv', '[BizStep].mdx')
const RATCHET_FILE = join(ROOT, '.scripts', 'gs1-digital-bizsteps-ratchet.json')

interface Row {
  ns: string
  type: string
  id: string
  name: string
  description: string
  code: string
  sameAs: string
  includedIn: string
}

function loadRows(): Row[] {
  // Skip when .data is an unresolved git-LFS pointer (CI without lfs pull).
  const content = readFileSync(DATA_FILE, 'utf-8')
  if (content.startsWith('version https://git-lfs.github.com/spec/v1')) return []
  const lines = content.split('\n').filter(l => l.trim())
  const headers = lines[0].split('\t')
  return lines.slice(1).map(line => {
    const cells = line.split('\t')
    const r: Record<string, string> = {}
    headers.forEach((h, i) => (r[h] = cells[i] ?? ''))
    return r as unknown as Row
  })
}

const DIGITAL = ['Resolving', 'Requesting', 'Scanning', 'Viewing'] as const
const PURE_SUPERSET = ['Resolving', 'Requesting', 'Scanning'] as const

describe('#105 digital bizStep vocabulary — draft superset invariants', () => {
  const rows = loadRows()
  const isLFS = rows.length === 0

  it('the ratchet file exists and stays armed', () => {
    expect(existsSync(RATCHET_FILE)).toBe(true)
    const ratchet = JSON.parse(readFileSync(RATCHET_FILE, 'utf-8'))
    expect(ratchet.armed).toBe(true)
    expect(ratchet.issue).toBe('#105')
  })

  it('emits exactly the 4 sanctioned digital bizSteps, typed DigitalBusinessStep', () => {
    if (isLFS) return
    const digital = rows.filter(r => r.type === 'DigitalBusinessStep')
    expect(digital.map(r => r.name).sort()).toEqual([...DIGITAL].sort())
    for (const r of digital) {
      expect(r.ns).toBe('gs1.org.ai')
      expect(r.id).toBe(`BizStep-${r.name.toLowerCase()}`)
      expect(r.code).toBe(`bizstep-${r.name.toLowerCase()}`)
    }
  })

  it('marks every digital row as draft superset (never ratified GS1)', () => {
    if (isLFS) return
    const digital = rows.filter(r => r.type === 'DigitalBusinessStep')
    for (const r of digital) {
      expect(r.description).toContain('Vin digital superset (draft, not ratified GS1)')
    }
  })

  it('Viewing down-projects to ratified CBV BizStep-inspecting', () => {
    if (isLFS) return
    const viewing = rows.find(r => r.type === 'DigitalBusinessStep' && r.name === 'Viewing')
    expect(viewing?.sameAs).toBe('https://ref.gs1.org/cbv/BizStep-inspecting')
  })

  it('pure-superset digital rows carry NO fabricated down-projection', () => {
    if (isLFS) return
    for (const name of PURE_SUPERSET) {
      const r = rows.find(x => x.type === 'DigitalBusinessStep' && x.name === name)
      expect(r?.sameAs).toBe('')
    }
  })

  it('declared narrowing: Rendering is NOT shipped', () => {
    if (isLFS) return
    const rendering = rows.find(r => r.name === 'Rendering')
    expect(rendering).toBeUndefined()
    // and it is not lurking in the source vocabulary either
    const src = readFileSync(SOURCE_FILE, 'utf-8')
    if (!src.startsWith('version https://git-lfs.github.com/spec/v1')) {
      expect(/\bRendering\b/.test(src)).toBe(false)
    }
  })

  it('physical bizSteps are untouched (37 rows, type BusinessStep)', () => {
    if (isLFS) return
    const physical = rows.filter(r => r.type === 'BusinessStep')
    expect(physical.length).toBe(37)
  })

  it('the #105 MDX route carries the DRAFT / NOT-ratified banner', () => {
    if (!existsSync(MDX_FILE)) throw new Error('missing GS1/cbv/[BizStep].mdx')
    const mdx = readFileSync(MDX_FILE, 'utf-8')
    expect(mdx).toContain('$type: GS1/cbv/DigitalBusinessStep')
    expect(mdx).toContain('canonical: https://gs1.org.ai/cbv/{bizStep.id}')
    expect(mdx.toLowerCase()).toContain('not ratified gs1 cbv')
  })
})
