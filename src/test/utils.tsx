import { render, RenderOptions } from '@testing-library/preact'
import { ComponentChildren } from 'preact'
import { expect } from 'vitest'
import type { ASHReport, Finding } from '../types/ash'

// Custom render function for consistent setup
export function renderWithProviders(
  ui: ComponentChildren,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, {
    ...options,
  })
}

// Mock data generators
export const mockFinding = (overrides: Partial<Finding> = {}): Finding => ({
  tool: 'Grype',
  severity: 'HIGH',
  message: 'Test vulnerability',
  location: 'package.json',
  description: 'Test description',
  recommendation: 'Test recommendation',
  ...overrides,
})

export const mockFindings = (count: number = 3): Finding[] => [
  mockFinding({
    severity: 'CRITICAL',
    tool: 'Grype',
    message: 'Critical vulnerability CVE-2024-1234',
    cve: 'CVE-2024-1234',
  }),
  mockFinding({
    severity: 'HIGH',
    tool: 'git-secrets',
    message: 'AWS secret detected',
    pattern: 'AKIA[0-9A-Z]{16}',
    lineNumber: 42,
  }),
  mockFinding({
    severity: 'MEDIUM',
    tool: 'Semgrep',
    message: 'Potential SQL injection',
    lineNumber: 128,
  }),
  ...Array.from({ length: Math.max(0, count - 3) }, (_, i) =>
    mockFinding({
      severity: 'LOW',
      message: `Finding ${i + 4}`,
      location: `file${i + 4}.js`,
    })
  ),
].slice(0, count)

export const mockASHReport = (overrides: Partial<ASHReport> = {}): ASHReport => ({
  findings: mockFindings(4),
  metadata: {
    scanDate: '2025-01-15T10:30:00Z',
    totalFindings: 4,
    tools: ['Grype', 'git-secrets', 'Semgrep', 'CDK-nag'],
    duration: 127,
    version: '1.2.3',
  },
  ...overrides,
})

// Common test assertions
export const expectToBeInDocument = (element: HTMLElement | null) => {
  expect(element).toBeInTheDocument()
}

export const expectNotToBeInDocument = (element: HTMLElement | null) => {
  expect(element).not.toBeInTheDocument()
}

// Mock DOM element for embedded JSON data
export const mockEmbeddedData = (data: ASHReport) => {
  const mockElement = document.createElement('script')
  mockElement.id = 'ash-data'
  mockElement.type = 'application/json' // Prevent JSDOM from executing as JavaScript
  mockElement.textContent = JSON.stringify(data)
  document.body.appendChild(mockElement)
  return mockElement
}

export const clearMockEmbeddedData = () => {
  const existing = document.getElementById('ash-data')
  if (existing) {
    existing.remove()
  }
}

// Re-export everything from testing library for convenience
export * from '@testing-library/preact'
export { userEvent } from '@testing-library/user-event' 