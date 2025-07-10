import { describe, it, expect } from 'vitest'
import { cn, severityConfig } from '../../lib/utils'
import type { SeverityLevel } from '../../types/ash'

describe('Utility Functions', () => {
  describe('cn function', () => {
    it('merges class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('handles undefined and null values', () => {
      expect(cn('base', undefined, null, 'valid')).toBe('base valid')
    })

    it('handles conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'ignored'))
        .toBe('base conditional')
    })

    it('removes duplicate Tailwind classes', () => {
      expect(cn('bg-red-100', 'bg-blue-100')).toBe('bg-blue-100')
    })

    it('handles empty input', () => {
      expect(cn()).toBe('')
    })

    it('handles complex Tailwind class merging', () => {
      expect(cn('px-4 py-2', 'px-6')).toBe('py-2 px-6')
    })
  })

  describe('severityConfig', () => {
    it('contains all severity levels', () => {
      expect(severityConfig).toHaveProperty('CRITICAL')
      expect(severityConfig).toHaveProperty('HIGH')
      expect(severityConfig).toHaveProperty('MEDIUM')
      expect(severityConfig).toHaveProperty('LOW')
    })

    it('has correct priority ordering', () => {
      expect(severityConfig.CRITICAL.priority).toBe(4)
      expect(severityConfig.HIGH.priority).toBe(3)
      expect(severityConfig.MEDIUM.priority).toBe(2)
      expect(severityConfig.LOW.priority).toBe(1)
    })

    it('contains proper styling for each severity', () => {
      const severities: SeverityLevel[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
      
      severities.forEach(severity => {
        const config = severityConfig[severity]
        expect(config).toHaveProperty('color')
        expect(config).toHaveProperty('icon')
        expect(config).toHaveProperty('priority')
        
        // Verify color contains expected Tailwind classes
        expect(config.color).toMatch(/bg-\w+-\d+/)
        expect(config.color).toMatch(/text-\w+-\d+/)
        expect(config.color).toMatch(/border-\w+-\d+/)
        
        // Verify icon is an emoji
        expect(config.icon).toMatch(/^[\u{1F300}-\u{1F9FF}]$/u)
        
        // Verify priority is a positive number
        expect(config.priority).toBeGreaterThan(0)
        expect(config.priority).toBeLessThanOrEqual(4)
      })
    })

    it('has unique priorities for each severity level', () => {
      const priorities = Object.values(severityConfig).map(config => config.priority)
      const uniquePriorities = new Set(priorities)
      expect(uniquePriorities.size).toBe(priorities.length)
    })

    it('uses correct color schemes for severity levels', () => {
      expect(severityConfig.CRITICAL.color).toContain('red')
      expect(severityConfig.HIGH.color).toContain('orange')
      expect(severityConfig.MEDIUM.color).toContain('yellow')
      expect(severityConfig.LOW.color).toContain('green')
    })

    it('provides correct emoji icons for severity levels', () => {
      expect(severityConfig.CRITICAL.icon).toBe('🔴')
      expect(severityConfig.HIGH.icon).toBe('🟠')
      expect(severityConfig.MEDIUM.icon).toBe('🟡')
      expect(severityConfig.LOW.icon).toBe('🟢')
    })
  })
}) 