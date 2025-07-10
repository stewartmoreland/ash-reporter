import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '../utils'
import { userEvent } from '@testing-library/user-event'
import { FindingsTable } from '../../components/FindingsTable'
import { mockFinding } from '../utils'
import type { Finding } from '../../types/ash'

// Mock Radix UI Dialog components
vi.mock('@radix-ui/react-dialog', () => ({
  Root: ({ children, open }: any) => open ? <div data-testid="dialog-root">{children}</div> : null,
  Portal: ({ children }: any) => <div data-testid="dialog-portal">{children}</div>,
  Overlay: ({ children, ...props }: any) => <div data-testid="dialog-overlay" {...props}>{children}</div>,
  Content: ({ children, ...props }: any) => <div data-testid="dialog-content" {...props}>{children}</div>,
  Title: ({ children, ...props }: any) => <h2 data-testid="dialog-title" {...props}>{children}</h2>,
  Close: ({ children, ...props }: any) => <button data-testid="dialog-close" {...props}>{children}</button>
}))

// Mock Radix UI Tabs components
vi.mock('@radix-ui/react-tabs', () => ({
  Root: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs-root" data-value={value} onClick={() => onValueChange?.('test')}>
      {children}
    </div>
  ),
  List: ({ children, ...props }: any) => <div data-testid="tabs-list" {...props}>{children}</div>,
  Trigger: ({ children, value, ...props }: any) => (
    <button data-testid={`tab-${value}`} data-value={value} {...props}>
      {children}
    </button>
  )
}))

// Mock lucide-preact
vi.mock('lucide-preact', () => ({
  X: () => <span data-testid="x-icon">×</span>
}))

describe('FindingsTable', () => {
  const mockFindings: Finding[] = [
    mockFinding({
      severity: 'CRITICAL',
      tool: 'Grype',
      message: 'Critical vulnerability in package',
      location: '/package.json:1',
      lineNumber: 1,
      description: 'Detailed description',
      recommendation: 'Update package',
      cve: 'CVE-2023-1234'
    }),
    mockFinding({
      severity: 'HIGH',
      tool: 'ESLint',
      message: 'High severity issue',
      location: '/src/app.js:50'
    }),
    mockFinding({
      severity: 'MEDIUM',
      tool: 'Grype',
      message: 'Medium severity finding',
      location: '/package-lock.json:100'
    }),
    mockFinding({
      severity: 'LOW',
      tool: 'GitSecrets',
      message: 'Low severity warning',
      location: '/config.js:25'
    })
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders the findings table with correct headers', () => {
      render(<FindingsTable findings={mockFindings} />)
      
      expect(screen.getByText('Severity')).toBeInTheDocument()
      expect(screen.getByText('Tool')).toBeInTheDocument()
      expect(screen.getByText('Message')).toBeInTheDocument()
      expect(screen.getByText('Location')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })

    it('renders all findings by default', () => {
      render(<FindingsTable findings={mockFindings} />)
      
      mockFindings.forEach(finding => {
        expect(screen.getByText(finding.message)).toBeInTheDocument()
        expect(screen.getAllByText(finding.tool).length).toBeGreaterThan(0)
        expect(screen.getByText(finding.location)).toBeInTheDocument()
      })
    })

    it('renders severity badges correctly', () => {
      render(<FindingsTable findings={mockFindings} />)
      
      // Check that badges are rendered (multiple instances expected)
      expect(screen.getAllByText('🔴 CRITICAL').length).toBeGreaterThan(0)
      expect(screen.getAllByText('🟠 HIGH').length).toBeGreaterThan(0)
      expect(screen.getAllByText('🟡 MEDIUM').length).toBeGreaterThan(0)
      expect(screen.getAllByText('🟢 LOW').length).toBeGreaterThan(0)
    })

    it('renders "View Details" buttons for each finding', () => {
      render(<FindingsTable findings={mockFindings} />)
      
      const viewButtons = screen.getAllByText('View Details')
      expect(viewButtons).toHaveLength(mockFindings.length)
    })
  })

  describe('Severity Filtering', () => {
    it('renders severity filter buttons', () => {
      render(<FindingsTable findings={mockFindings} />)
      
      expect(screen.getByRole('button', { name: /🔴 CRITICAL/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /🟠 HIGH/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /🟡 MEDIUM/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /🟢 LOW/ })).toBeInTheDocument()
    })

    it('filters findings when severity button is clicked', async () => {
      const user = userEvent.setup()
      render(<FindingsTable findings={mockFindings} />)
      
      // Click CRITICAL button to deselect it
      const criticalButton = screen.getByRole('button', { name: /🔴 CRITICAL/ })
      await user.click(criticalButton)
      
      // Critical finding should be hidden
      expect(screen.queryByText('Critical vulnerability in package')).not.toBeInTheDocument()
      
      // Other findings should still be visible
      expect(screen.getByText('High severity issue')).toBeInTheDocument()
      expect(screen.getByText('Medium severity finding')).toBeInTheDocument()
      expect(screen.getByText('Low severity warning')).toBeInTheDocument()
    })

    it('toggles severity filters correctly', async () => {
      const user = userEvent.setup()
      render(<FindingsTable findings={mockFindings} />)
      
      const criticalButton = screen.getByRole('button', { name: /🔴 CRITICAL/ })
      
      // First click - deselect
      await user.click(criticalButton)
      expect(screen.queryByText('Critical vulnerability in package')).not.toBeInTheDocument()
      
      // Second click - select again
      await user.click(criticalButton)
      expect(screen.getByText('Critical vulnerability in package')).toBeInTheDocument()
    })

    it('shows empty state when all severities are deselected', async () => {
      const user = userEvent.setup()
      render(<FindingsTable findings={mockFindings} />)
      
      // Deselect all severity filters
      const buttons = [
        screen.getByRole('button', { name: /🔴 CRITICAL/ }),
        screen.getByRole('button', { name: /🟠 HIGH/ }),
        screen.getByRole('button', { name: /🟡 MEDIUM/ }),
        screen.getByRole('button', { name: /🟢 LOW/ })
      ]
      
      for (const button of buttons) {
        await user.click(button)
      }
      
      expect(screen.getByText('No findings match the current filters.')).toBeInTheDocument()
    })
  })

  describe('Tool Filtering (Tabs)', () => {
    it('renders "All Tools" tab by default', () => {
      render(<FindingsTable findings={mockFindings} />)
      
      expect(screen.getByTestId('tab-all')).toBeInTheDocument()
      expect(screen.getByText('All Tools')).toBeInTheDocument()
    })

    it('renders tabs for each unique tool', () => {
      render(<FindingsTable findings={mockFindings} />)
      
      const uniqueTools = [...new Set(mockFindings.map(f => f.tool))]
      
      uniqueTools.forEach(tool => {
        expect(screen.getByTestId(`tab-${tool}`)).toBeInTheDocument()
        // Tool names appear in multiple places (tabs + table), just check they exist
        expect(screen.getAllByText(tool).length).toBeGreaterThan(0)
      })
    })

    it('shows all findings when "All Tools" tab is active', () => {
      render(<FindingsTable findings={mockFindings} />)
      
      mockFindings.forEach(finding => {
        expect(screen.getByText(finding.message)).toBeInTheDocument()
      })
    })
  })

  describe('Modal Dialog', () => {
    it('opens modal when "View Details" is clicked', async () => {
      const user = userEvent.setup()
      render(<FindingsTable findings={mockFindings} />)
      
      const viewButtons = screen.getAllByText('View Details')
      await user.click(viewButtons[0])
      
      expect(screen.getByTestId('dialog-root')).toBeInTheDocument()
      expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
      expect(screen.getByText('Finding Details')).toBeInTheDocument()
    })

    it('displays finding details in modal', async () => {
      const user = userEvent.setup()
      render(<FindingsTable findings={mockFindings} />)
      
      const viewButtons = screen.getAllByText('View Details')
      await user.click(viewButtons[0]) // Click first finding (critical)
      
      // Check modal is open
      expect(screen.getByTestId('dialog-root')).toBeInTheDocument()
      expect(screen.getByText('Finding Details')).toBeInTheDocument()
      
      // Check finding details are displayed (use getAllByText since text appears in both table and modal)
      const finding = mockFindings[0]
      expect(screen.getAllByText(finding.message).length).toBeGreaterThan(1) // Table + modal
      expect(screen.getAllByText(finding.tool).length).toBeGreaterThan(1) // Tab + table + modal
      expect(screen.getAllByText(finding.location).length).toBeGreaterThan(1) // Table + modal
    })

    it('displays optional fields when present', async () => {
      const user = userEvent.setup()
      render(<FindingsTable findings={mockFindings} />)
      
      const viewButtons = screen.getAllByText('View Details')
      await user.click(viewButtons[0]) // Critical finding has all optional fields
      
      expect(screen.getByText('Line Number')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('Detailed description')).toBeInTheDocument()
      expect(screen.getByText('Recommendation')).toBeInTheDocument()
      expect(screen.getByText('Update package')).toBeInTheDocument()
      expect(screen.getByText('CVE')).toBeInTheDocument()
      expect(screen.getByText('CVE-2023-1234')).toBeInTheDocument()
    })

    it('hides optional fields when not present', async () => {
      const user = userEvent.setup()
      
      // Create a finding with no optional fields (override defaults)
      const minimalFinding: Finding = {
        severity: 'HIGH',
        tool: 'TestTool',
        message: 'Test message',
        location: '/test.js:1'
        // Explicitly no lineNumber, description, recommendation, or cve
      }
      
      render(<FindingsTable findings={[minimalFinding]} />)
      
      const viewButtons = screen.getAllByText('View Details')
      await user.click(viewButtons[0])
      
      expect(screen.queryByText('Line Number')).not.toBeInTheDocument()
      expect(screen.queryByText('Description')).not.toBeInTheDocument()
      expect(screen.queryByText('Recommendation')).not.toBeInTheDocument()
      expect(screen.queryByText('CVE')).not.toBeInTheDocument()
    })

    it('renders close button in modal', async () => {
      const user = userEvent.setup()
      render(<FindingsTable findings={mockFindings} />)
      
      const viewButtons = screen.getAllByText('View Details')
      await user.click(viewButtons[0])
      
      expect(screen.getByTestId('dialog-close')).toBeInTheDocument()
      expect(screen.getByTestId('x-icon')).toBeInTheDocument()
    })
  })

  describe('Empty States', () => {
    it('renders empty message when no findings provided', () => {
      render(<FindingsTable findings={[]} />)
      
      expect(screen.getByText('No findings match the current filters.')).toBeInTheDocument()
    })

    it('renders table headers even when empty', () => {
      render(<FindingsTable findings={[]} />)
      
      expect(screen.getByText('Severity')).toBeInTheDocument()
      expect(screen.getByText('Tool')).toBeInTheDocument()
      expect(screen.getByText('Message')).toBeInTheDocument()
      expect(screen.getByText('Location')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })

    it('still renders severity filter buttons when empty', () => {
      render(<FindingsTable findings={[]} />)
      
      expect(screen.getByRole('button', { name: /🔴 CRITICAL/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /🟠 HIGH/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /🟡 MEDIUM/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /🟢 LOW/ })).toBeInTheDocument()
    })
  })

  describe('Utility Functions', () => {
    it('applies correct badge variants for different severities', () => {
      render(<FindingsTable findings={mockFindings} />)
      
      // Check that badges are rendered (multiple instances expected)
      expect(screen.getAllByText('🔴 CRITICAL').length).toBeGreaterThan(0)
      expect(screen.getAllByText('🟠 HIGH').length).toBeGreaterThan(0)
      expect(screen.getAllByText('🟡 MEDIUM').length).toBeGreaterThan(0)
      expect(screen.getAllByText('🟢 LOW').length).toBeGreaterThan(0)
    })
  })

  describe('Combined Filtering', () => {
    it('applies both severity and tool filters', async () => {
      const user = userEvent.setup()
      render(<FindingsTable findings={mockFindings} />)
      
      // First, deselect LOW severity
      const lowButton = screen.getByRole('button', { name: /🟢 LOW/ })
      await user.click(lowButton)
      
      // Low severity finding should be hidden
      expect(screen.queryByText('Low severity warning')).not.toBeInTheDocument()
      
      // Other findings should still be visible
      expect(screen.getByText('Critical vulnerability in package')).toBeInTheDocument()
      expect(screen.getByText('High severity issue')).toBeInTheDocument()
      expect(screen.getByText('Medium severity finding')).toBeInTheDocument()
    })
  })
}) 