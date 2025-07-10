# ASH Security Reporter - Testing Plan with Vitest

## 📋 Overview

This document outlines a comprehensive testing strategy for the ASH Security Reporter application using Vitest, targeting **90% code coverage**. The plan covers unit tests, component tests, integration tests, and utility function tests.

## 🎯 Testing Goals

- **Primary Goal**: Achieve 90% code coverage across the entire application
- **Secondary Goals**:
  - Ensure all critical security data rendering is tested
  - Validate component interactions and state management
  - Test error handling and edge cases
  - Establish reliable test automation for CI/CD

## 📊 Current Coverage Status

| Category | Files Planned | Tests Written | Coverage Target | Current Coverage |
|----------|---------------|---------------|-----------------|------------------|
| Components | 6 | 1 | 95% | SummaryCards: 98% |
| Utilities | 1 | 1 | 100% | utils.ts: 100% |
| UI Components | 2 | ✅ | 90% | badge.tsx: 100%, card.tsx: 100% |
| Types | 1 | 0 | 90% | 0% |
| Scripts | 1 | 0 | 85% | 0% |
| **Total** | **11** | **4** | **90%** | **~25%** |

## 🛠️ Setup and Configuration

### Step 1: Install Testing Dependencies

```bash
# Core testing framework and utilities
npm install --save-dev vitest jsdom @vitest/coverage-v8

# React/Preact testing utilities
npm install --save-dev @testing-library/preact @testing-library/jest-dom @testing-library/user-event

# Additional testing utilities
npm install --save-dev msw @types/jsdom
```

### Step 2: Vitest Configuration

**File:** `vitest.config.ts`

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

export default defineConfig({
  plugins: [preact()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
      ],
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
    },
  },
})
```

### Step 3: Test Setup File

**File:** `src/test/setup.ts`

```typescript
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock DOM APIs that aren't available in jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))
```

### Step 4: Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch"
  }
}
```

## 📁 Testing Categories & Priorities

### Priority 1: Core Components (Critical Path)
- [ ] **App.tsx** - Main application logic and data loading
- [ ] **FindingsTable.tsx** - Security findings display and filtering
- [ ] **SummaryCards.tsx** - Summary statistics display

### Priority 2: Utility Functions (High Impact)
- [ ] **lib/utils.ts** - Utility functions and configurations

### Priority 3: UI Components (Foundation)
- [ ] **components/ui/card.tsx** - Card component
- [ ] **components/ui/badge.tsx** - Badge component
- [ ] **components/Header.tsx** - Header component

### Priority 4: Types & Scripts (Supporting)
- [ ] **types/ash.ts** - Type definitions validation
- [ ] **scripts/generate-report.js** - Report generation logic

## 🧪 Detailed Testing Plan

### 1. App Component (`src/App.tsx`)

**Coverage Target: 95%**

#### Test Cases:
- [ ] **Data Loading States**
  - Loading state display
  - Error state when JSON parsing fails
  - No data state display
  - Successful data load from embedded JSON
  - Fallback to sample data

- [ ] **Sample Data Rendering**
  - Renders with sample data when no embedded data
  - Displays correct findings count
  - Shows proper metadata information

- [ ] **Component Integration**
  - SummaryCards receives correct props
  - FindingsTable receives correct props
  - Header displays scan date and metadata

**Test File:** `src/test/App.test.tsx`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/preact'
import App from '../App'
import type { ASHReport } from '../types/ash'

// Mock child components for isolated testing
vi.mock('../components/SummaryCards', () => ({
  SummaryCards: ({ findings }: { findings: any[] }) => 
    <div data-testid="summary-cards">Summary: {findings.length} findings</div>
}))

vi.mock('../components/FindingsTable', () => ({
  FindingsTable: ({ findings }: { findings: any[] }) => 
    <div data-testid="findings-table">Table: {findings.length} findings</div>
}))

describe('App Component', () => {
  beforeEach(() => {
    // Clear DOM before each test
    document.body.innerHTML = ''
  })

  it('shows loading state initially', () => {
    render(<App />)
    expect(screen.getByText('Loading security report...')).toBeInTheDocument()
  })

  it('renders with sample data when no embedded data exists', async () => {
    render(<App />)
    
    await waitFor(() => {
      expect(screen.queryByText('Loading security report...')).not.toBeInTheDocument()
    })
    
    expect(screen.getByText('ASH Security Report')).toBeInTheDocument()
    expect(screen.getByTestId('summary-cards')).toBeInTheDocument()
    expect(screen.getByTestId('findings-table')).toBeInTheDocument()
  })

  // Additional test cases...
})
```

### 2. FindingsTable Component (`src/components/FindingsTable.tsx`)

**Coverage Target: 95%**

#### Test Cases:
- [ ] **Rendering**
  - Displays all findings correctly
  - Shows proper severity badges
  - Renders tool names and messages

- [ ] **Filtering**
  - Severity filter toggles work
  - Tool tab filtering works
  - Combined filters work correctly

- [ ] **Modal Interactions**
  - Opens detail modal on click
  - Displays complete finding information
  - Closes modal properly

- [ ] **Edge Cases**
  - Empty findings array
  - Findings with missing optional fields
  - Very long messages truncation

**Test File:** `src/test/components/FindingsTable.test.tsx`

### 3. SummaryCards Component (`src/components/SummaryCards.tsx`)

**Coverage Target: 95%**

#### Test Cases:
- [ ] **Count Calculations**
  - Correct counts for each severity level
  - Handles empty findings array
  - Handles findings with unknown severity

- [ ] **Badge Variants**
  - Correct badge variants for severity levels
  - Proper severity icons display

- [ ] **Responsive Layout**
  - Grid layout renders correctly
  - Cards display proper content

**Test File:** `src/test/components/SummaryCards.test.tsx`

### 4. Utility Functions (`src/lib/utils.ts`)

**Coverage Target: 100%**

#### Test Cases:
- [ ] **cn Function**
  - Merges class names correctly
  - Handles conditional classes
  - Removes duplicate Tailwind classes

- [ ] **severityConfig**
  - Contains all severity levels
  - Has correct priority ordering
  - Contains proper styling classes

**Test File:** `src/test/lib/utils.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { cn, severityConfig } from '../../lib/utils'

describe('Utility Functions', () => {
  describe('cn function', () => {
    it('merges class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('handles conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'ignored'))
        .toBe('base conditional')
    })

    it('removes duplicate Tailwind classes', () => {
      expect(cn('bg-red-100', 'bg-blue-100')).toBe('bg-blue-100')
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
  })
})
```

### 5. UI Components

#### Card Component (`src/components/ui/card.tsx`)
**Coverage Target: 90%**

#### Badge Component (`src/components/ui/badge.tsx`)
**Coverage Target: 90%**

### 6. Report Generation Script (`scripts/generate-report.js`)

**Coverage Target: 85%**

#### Test Cases:
- [ ] **File Operations**
  - Finds asset files correctly
  - Reads files properly
  - Handles missing files

- [ ] **Template Generation**
  - Injects data correctly
  - Handles CSS/JS content
  - Generates valid HTML

**Test File:** `src/test/scripts/generate-report.test.js`

## 🎯 Test Execution Strategy

### Phase 1: Foundation (Week 1)
1. Set up Vitest configuration
2. Create test utilities and mocks
3. Write utility function tests
4. Write basic component tests

### Phase 2: Core Components (Week 2)
1. App component comprehensive tests
2. FindingsTable component tests
3. SummaryCards component tests

### Phase 3: Integration & Polish (Week 3)
1. Integration tests
2. Edge case coverage
3. Performance testing
4. CI/CD integration

## 📈 Coverage Monitoring

### Daily Coverage Checks
```bash
npm run test:coverage
```

### Coverage Thresholds
- **Critical Components**: 95%
- **Utility Functions**: 100%
- **UI Components**: 90%
- **Scripts**: 85%
- **Overall Target**: 90%

### Coverage Reporting
- HTML reports generated in `coverage/` directory
- JSON coverage data for CI integration
- Failed builds if coverage drops below threshold

## 🔄 Continuous Integration

### GitHub Actions Integration
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:coverage
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/
```

## ✅ Progress Tracking

### Completed Tasks
- [x] Initial setup and configuration
- [x] Test infrastructure
- [x] Utility function tests (100% coverage)
- [x] SummaryCards component tests (98% coverage)
- [x] UI component tests (100% coverage - implicit)
- [ ] App component tests
- [ ] FindingsTable component tests
- [ ] Integration tests
- [ ] CI/CD integration

### Current Status
**Overall Progress: 40% Complete**

**Next Steps:**
1. Create App component tests (critical path)
2. Create FindingsTable component tests
3. Add remaining component tests
4. Set up CI/CD integration

## 📚 Testing Best Practices

### Test Structure
- Use AAA pattern (Arrange, Act, Assert)
- Keep tests focused and isolated
- Use descriptive test names
- Group related tests with describe blocks

### Mocking Strategy
- Mock external dependencies
- Use MSW for API mocking
- Mock heavy components for unit tests
- Preserve component contracts in mocks

### Data Management
- Create test data factories
- Use realistic test data
- Test with edge case data
- Validate type safety in tests

---

**Last Updated:** January 15, 2025  
**Target Completion:** February 5, 2025  
**Current Coverage:** 0% → Target: 90% 