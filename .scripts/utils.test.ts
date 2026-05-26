/**
 * Unit tests for utils.ts
 * Run with: bun test .scripts/utils.test.ts
 */

import { describe, test, expect } from 'bun:test'
import { mkdtempSync, writeFileSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { toWikipediaStyleId, parseTSV } from './utils'

/**
 * Helper: write a TSV body to a temp file and parse it.
 * Returns the parsed records.
 */
function parseTSVString(body: string): Record<string, string>[] {
  const dir = mkdtempSync(join(tmpdir(), 'parseTSV-test-'))
  const file = join(dir, 'fixture.tsv')
  writeFileSync(file, body, 'utf-8')
  try {
    return parseTSV<Record<string, string>>(file)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

describe('toWikipediaStyleId', () => {
  describe('basic transformations', () => {
    test('replaces spaces with underscores', () => {
      expect(toWikipediaStyleId('Chief Executives')).toBe('Chief_Executives')
      expect(toWikipediaStyleId('hello world')).toBe('hello_world')
    })

    test('preserves original case', () => {
      expect(toWikipediaStyleId('chief executives')).toBe('chief_executives')
      expect(toWikipediaStyleId('CHIEF EXECUTIVES')).toBe('CHIEF_EXECUTIVES')
      expect(toWikipediaStyleId('Chief Executives')).toBe('Chief_Executives')
    })

    test('trims whitespace', () => {
      expect(toWikipediaStyleId('  hello world  ')).toBe('hello_world')
    })

    test('handles multiple spaces', () => {
      expect(toWikipediaStyleId('hello   world')).toBe('hello_world')
    })
  })

  describe('slash handling', () => {
    test('replaces / with underscore', () => {
      expect(toWikipediaStyleId('AI/ML')).toBe('AI_ML')
      expect(toWikipediaStyleId('CI/CD')).toBe('CI_CD')
      expect(toWikipediaStyleId('I/O')).toBe('I_O')
    })

    test('handles slash with spaces', () => {
      expect(toWikipediaStyleId('Farm/Farm and Ranch Management')).toBe('Farm_Farm_and_Ranch_Management')
      expect(toWikipediaStyleId('Agribusiness/Agricultural Business Operations')).toBe('Agribusiness_Agricultural_Business_Operations')
    })

    test('handles multiple slashes', () => {
      expect(toWikipediaStyleId('A/B/C')).toBe('A_B_C')
      expect(toWikipediaStyleId('path/to/thing')).toBe('path_to_thing')
    })
  })

  describe('question mark handling', () => {
    test('replaces ? with underscore', () => {
      expect(toWikipediaStyleId('What is this?')).toBe('What_is_this')
      expect(toWikipediaStyleId('Why?')).toBe('Why')
    })

    test('handles trailing question mark', () => {
      expect(toWikipediaStyleId('Is this correct?')).toBe('Is_this_correct')
    })
  })

  describe('preserves other characters', () => {
    test('preserves hyphens', () => {
      expect(toWikipediaStyleId('software-developer')).toBe('software-developer')
      expect(toWikipediaStyleId('time-based media')).toBe('time-based_media')
    })

    test('preserves parentheses', () => {
      expect(toWikipediaStyleId('IT Manager (Senior)')).toBe('IT_Manager_(Senior)')
      expect(toWikipediaStyleId('C++ (Programming)')).toBe('C++_(Programming)')
    })

    test('preserves plus signs', () => {
      expect(toWikipediaStyleId('C++')).toBe('C++')
      expect(toWikipediaStyleId('Google+')).toBe('Google+')
    })

    test('preserves ampersands', () => {
      expect(toWikipediaStyleId('R&D')).toBe('R&D')
      expect(toWikipediaStyleId('Research & Development')).toBe('Research_&_Development')
    })

    test('preserves dots', () => {
      expect(toWikipediaStyleId('Node.js')).toBe('Node.js')
      expect(toWikipediaStyleId('v1.0.0')).toBe('v1.0.0')
    })

    test('preserves numbers', () => {
      expect(toWikipediaStyleId('ISO 9001')).toBe('ISO_9001')
      expect(toWikipediaStyleId('Level 3')).toBe('Level_3')
    })
  })

  describe('edge cases', () => {
    test('handles empty string', () => {
      expect(toWikipediaStyleId('')).toBe('')
    })

    test('handles single word', () => {
      expect(toWikipediaStyleId('Hello')).toBe('Hello')
    })

    test('handles only special characters being removed', () => {
      expect(toWikipediaStyleId('???')).toBe('')
      expect(toWikipediaStyleId('///')).toBe('')
    })

    test('cleans up double underscores', () => {
      expect(toWikipediaStyleId('hello  /  world')).toBe('hello_world')
    })

    test('removes leading/trailing underscores', () => {
      expect(toWikipediaStyleId('/hello')).toBe('hello')
      expect(toWikipediaStyleId('hello/')).toBe('hello')
      expect(toWikipediaStyleId('?hello?')).toBe('hello')
    })
  })

  describe('real-world examples', () => {
    test('WCAG success criteria', () => {
      const input = 'An alternative for time-based media is provided for all prerecorded synchronized media.'
      expect(toWikipediaStyleId(input)).toBe('An_alternative_for_time-based_media_is_provided_for_all_prerecorded_synchronized_media.')
    })

    test('CIP program names', () => {
      expect(toWikipediaStyleId('Agribusiness/Agricultural Business Operations.')).toBe('Agribusiness_Agricultural_Business_Operations.')
      expect(toWikipediaStyleId('Veterinary/Animal Health Technology/Technician')).toBe('Veterinary_Animal_Health_Technology_Technician')
    })

    test('tech terms', () => {
      expect(toWikipediaStyleId('TCP/IP')).toBe('TCP_IP')
      expect(toWikipediaStyleId('Input/Output')).toBe('Input_Output')
      expect(toWikipediaStyleId('Client/Server Architecture')).toBe('Client_Server_Architecture')
    })

    test('occupation titles', () => {
      expect(toWikipediaStyleId('I/O Psychology Professor (Industrial/Organizational Psychology Professor)')).toBe('I_O_Psychology_Professor_(Industrial_Organizational_Psychology_Professor)')
    })
  })
})

describe('parseTSV', () => {
  test('parses a simple TSV with no quotes', () => {
    const body = ['a\tb\tc', '1\t2\t3', '4\t5\t6'].join('\n')
    const rows = parseTSVString(body)
    expect(rows).toEqual([
      { a: '1', b: '2', c: '3' },
      { a: '4', b: '5', c: '6' },
    ])
  })

  test('preserves balanced quoted fields', () => {
    const body = [
      'a\tb',
      '"hello, world"\t"foo"',
      '"another"\t"bar"',
    ].join('\n')
    const rows = parseTSVString(body)
    expect(rows).toEqual([
      { a: 'hello, world', b: 'foo' },
      { a: 'another', b: 'bar' },
    ])
  })

  describe('stray-quote resilience (the ONET.ToolsUsed.tsv:881 bug class)', () => {
    test('does NOT collapse rows after a single stray double-quote', () => {
      // This mirrors the exact shape of the .source/ONET/ONET.ToolsUsed.tsv
      // bug: a stray `"` mid-value would, with the old quote-tracking parser,
      // flip inQuotes=true and never close — concatenating every subsequent
      // newline into one mega-row that fails the column-count check and
      // is silently dropped. We must keep parsing past it.
      const body = [
        'soc\texample\tcode',
        '11-1011.00\t10-key calculators\t44101809',
        '13-1032.00\tLaser facsimile machines"\t44101508', // <-- stray quote
        '15-1011.00\tNotebook computers\t43211503',
        '17-2051.00\tMeasuring tapes\t27111801',
        '19-1011.00\tMicroscopes\t41112224',
      ].join('\n')

      const rows = parseTSVString(body)

      // Critical: we keep all 5 data rows; no silent collapse.
      expect(rows.length).toBe(5)
      // SOC majors span the full spread, not just 11/13.
      const socMajors = new Set(rows.map(r => r.soc.slice(0, 2)))
      expect(socMajors.size).toBe(5)
      expect(socMajors.has('15')).toBe(true)
      expect(socMajors.has('17')).toBe(true)
      expect(socMajors.has('19')).toBe(true)
    })

    test('downstream rows after a stray-quote row parse cleanly', () => {
      const body = [
        'soc\texample\tcode',
        '13-1032.00\tLaser facsimile machines"\t44101508',
        '15-1011.00\tNotebook\t43211503',
      ].join('\n')

      const rows = parseTSVString(body)
      expect(rows.length).toBe(2)
      // The offending row's column boundaries may slip (its single trailing
      // `"` is still seen as a quote opener by the per-line tab-splitter),
      // but that's a per-cell blemish — the critical invariant is that the
      // next row parses cleanly instead of being silently swallowed.
      const after = rows.find(r => r.soc === '15-1011.00')
      expect(after).toBeDefined()
      expect(after).toEqual({ soc: '15-1011.00', example: 'Notebook', code: '43211503' })
    })

    test('huge file with one stray quote still yields all rows', () => {
      // Stronger regression test: ~200 rows where row 50 has the stray quote.
      // Old parser: would yield ~50 rows then collapse the rest into one
      // mega-row that fails column-count and gets dropped. New parser: all rows survive.
      const header = 'soc\tname\tcode'
      const rows: string[] = [header]
      for (let i = 0; i < 200; i++) {
        const soc = `${10 + (i % 30)}-${1000 + i}.00`
        const name = i === 50 ? `Stray quote here"` : `name-${i}`
        rows.push(`${soc}\t${name}\t${i}`)
      }
      const parsed = parseTSVString(rows.join('\n'))
      expect(parsed.length).toBe(200)
      // Row that came after the stray-quote row still parses.
      const after = parsed.find(r => r.code === '51')
      expect(after).toBeDefined()
      expect(after!.name).toBe('name-51')
    })
  })

  describe('legitimate multi-line quoted fields (must keep working)', () => {
    test('a balanced quoted field with one embedded newline is preserved', () => {
      const body = [
        'id\tdescription',
        '1\t"line one',
        'line two"',
        '2\t"single-line"',
      ].join('\n')
      const rows = parseTSVString(body)
      expect(rows.length).toBe(2)
      expect(rows[0].id).toBe('1')
      expect(rows[0].description).toContain('line one')
      expect(rows[0].description).toContain('line two')
      expect(rows[1]).toEqual({ id: '2', description: 'single-line' })
    })
  })
})
