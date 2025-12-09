/**
 * Unit tests for utils.ts
 * Run with: bun test .scripts/utils.test.ts
 */

import { describe, test, expect } from 'bun:test'
import { toWikipediaStyleId } from './utils'

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
