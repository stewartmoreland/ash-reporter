import { describe, it, expect } from 'vitest'
import { render, screen } from '../utils'
import { SummaryCards } from '../../components/SummaryCards'
import { mockFindings, mockFinding } from '../utils'

describe('SummaryCards Component', () => {
  it('renders all severity level cards', () => {
    const findings = mockFindings(4)
    render(<SummaryCards findings={findings} />)

    // Check that all severity level cards are rendered
    expect(screen.getByText('🔴 CRITICAL')).toBeInTheDocument()
    expect(screen.getByText('🟠 HIGH')).toBeInTheDocument()
    expect(screen.getByText('🟡 MEDIUM')).toBeInTheDocument()
    expect(screen.getByText('🟢 LOW')).toBeInTheDocument()
  })

  it('displays correct counts for each severity level', () => {
    const findings = [
      mockFinding({ severity: 'CRITICAL' }),
      mockFinding({ severity: 'CRITICAL' }),
      mockFinding({ severity: 'HIGH' }),
      mockFinding({ severity: 'MEDIUM' }),
      mockFinding({ severity: 'LOW' }),
      mockFinding({ severity: 'LOW' }),
      mockFinding({ severity: 'LOW' }),
    ]

    render(<SummaryCards findings={findings} />)

    // Check the large count displays
    const criticalCard = screen.getByText('🔴 CRITICAL').closest('div')?.parentElement
    const highCard = screen.getByText('🟠 HIGH').closest('div')?.parentElement
    const mediumCard = screen.getByText('🟡 MEDIUM').closest('div')?.parentElement
    const lowCard = screen.getByText('🟢 LOW').closest('div')?.parentElement

    expect(criticalCard).toHaveTextContent('2') // 2 critical findings
    expect(highCard).toHaveTextContent('1') // 1 high finding
    expect(mediumCard).toHaveTextContent('1') // 1 medium finding
    expect(lowCard).toHaveTextContent('3') // 3 low findings
  })

  it('handles empty findings array', () => {
    render(<SummaryCards findings={[]} />)

    // All counts should be 0
    expect(screen.getByText('🔴 CRITICAL')).toBeInTheDocument()
    expect(screen.getByText('🟠 HIGH')).toBeInTheDocument()
    expect(screen.getByText('🟡 MEDIUM')).toBeInTheDocument()
    expect(screen.getByText('🟢 LOW')).toBeInTheDocument()

    // Check that all counts are 0
    const criticalCard = screen.getByText('🔴 CRITICAL').closest('div')?.parentElement
    const highCard = screen.getByText('🟠 HIGH').closest('div')?.parentElement
    const mediumCard = screen.getByText('🟡 MEDIUM').closest('div')?.parentElement
    const lowCard = screen.getByText('🟢 LOW').closest('div')?.parentElement

    expect(criticalCard).toHaveTextContent('0')
    expect(highCard).toHaveTextContent('0')
    expect(mediumCard).toHaveTextContent('0')
    expect(lowCard).toHaveTextContent('0')
  })

  it('displays singular "finding" for count of 1', () => {
    const findings = [mockFinding({ severity: 'CRITICAL' })]
    render(<SummaryCards findings={findings} />)

    expect(screen.getByText('finding')).toBeInTheDocument()
  })

  it('displays plural "findings" for count of 0 or > 1', () => {
    const findings = [
      mockFinding({ severity: 'HIGH' }),
      mockFinding({ severity: 'HIGH' }),
    ]
    render(<SummaryCards findings={findings} />)

    // Should have 3 "findings" (CRITICAL: 0, MEDIUM: 0, LOW: 0) and 1 "findings" for HIGH: 2
    const findingsElements = screen.getAllByText('findings')
    expect(findingsElements).toHaveLength(4) // 3 cards with 0 findings + 1 card with 2 findings
  })

  it('renders cards with proper hover styling', () => {
    const findings = mockFindings(1)
    render(<SummaryCards findings={findings} />)

    // Find a card element and check for hover classes
    const criticalCard = screen.getByText('🔴 CRITICAL').closest('div')?.parentElement?.parentElement
    expect(criticalCard).toHaveClass('transition-all', 'hover:shadow-md')
  })

  it('handles all severity levels being present', () => {
    const findings = [
      mockFinding({ severity: 'CRITICAL' }),
      mockFinding({ severity: 'HIGH' }),
      mockFinding({ severity: 'MEDIUM' }),
      mockFinding({ severity: 'LOW' }),
    ]

    render(<SummaryCards findings={findings} />)

    // Should have 4 "finding" texts (one for each severity level with count 1)
    const findingElements = screen.getAllByText('finding')
    expect(findingElements).toHaveLength(4)
  })

  it('renders in grid layout', () => {
    const findings = mockFindings(1)
    const { container } = render(<SummaryCards findings={findings} />)

    // Check for grid layout classes
    const gridContainer = container.firstChild
    expect(gridContainer).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4', 'gap-4', 'mb-6')
  })

  it('displays badges with correct counts', () => {
    const findings = [
      mockFinding({ severity: 'CRITICAL' }),
      mockFinding({ severity: 'HIGH' }),
      mockFinding({ severity: 'MEDIUM' }),
      mockFinding({ severity: 'LOW' }),
    ]

    render(<SummaryCards findings={findings} />)

    // Verify that each severity card has the number 1 displayed (both in badge and main count)
    // There are 2 instances of "1" per card: one in the badge, one in the main display
    const oneElements = screen.getAllByText('1')
    expect(oneElements.length).toBeGreaterThanOrEqual(4) // At least 4 (could be 8 if both badge and count show "1")
  })

  it('handles findings with unknown severity gracefully', () => {
    // This tests edge case where findings might have unexpected severity values
    const findings = [
      mockFinding({ severity: 'CRITICAL' }),
      // Note: TypeScript would prevent this, but it could happen with real data
      // Cast to any to test runtime behavior with invalid data
      { ...mockFinding(), severity: 'UNKNOWN' } as any,
    ]

    render(<SummaryCards findings={findings} />)

    // Should still render all standard severity cards
    expect(screen.getByText('🔴 CRITICAL')).toBeInTheDocument()
    expect(screen.getByText('🟠 HIGH')).toBeInTheDocument()
    expect(screen.getByText('🟡 MEDIUM')).toBeInTheDocument()
    expect(screen.getByText('🟢 LOW')).toBeInTheDocument()

    // Critical should show count of 1
    const criticalCard = screen.getByText('🔴 CRITICAL').closest('div')?.parentElement
    expect(criticalCard).toHaveTextContent('1')
  })
}) 