# Building Static ASH Security Reports with Preact, Tailwind CSS v4, and Radix UI

## Table of Contents

1. [Introduction](#introduction)
2. [Understanding ASH JSON Structure](#understanding-ash-json-structure)
3. [Technology Stack](#technology-stack)
4. [Project Setup](#project-setup)
5. [UI Component Design](#ui-component-design)
6. [Implementation](#implementation)
7. [Static Generation](#static-generation)
8. [CI/CD Integration](#ci-cd-integration)
9. [Deployment Examples](#deployment-examples)
10. [Best Practices](#best-practices)

## Introduction

AWS Automated Security Helper (ASH) is a powerful tool that runs multiple security scanners (git-secrets, Bandit, Semgrep, Grype, CDK-nag, etc.) and outputs aggregated JSON reports. This guide demonstrates how to build a **static, interactive HTML artifact** that renders these reports using modern web technologies.

### Why Build a Custom UI for ASH Reports?

**The Problem**: ASH outputs JSON data that's difficult for developers to consume. Raw JSON files require:

- Manual parsing to understand findings
- No visual hierarchy for severity levels
- Difficult to share with non-technical stakeholders
- No filtering or search capabilities
- Poor mobile/responsive experience

**The Solution**: A static HTML report that:

- Transforms JSON into an interactive dashboard
- Provides visual severity indicators and filtering
- Works offline and can be shared as a single file
- Requires no server infrastructure
- Integrates seamlessly with CI/CD pipelines

### Why This Technology Stack?

**Preact (~4KB) vs React (~45KB)**

- **Performance**: Faster initial load times crucial for CI/CD artifacts
- **Size**: Smaller bundle means faster downloads from CI systems
- **Compatibility**: Same API as React, easy to learn and migrate
- **Static Generation**: Excellent support for pre-rendering to HTML

**Tailwind CSS v4 vs Traditional CSS**

- **Consistency**: Utility classes prevent CSS conflicts and inconsistencies
- **Maintainability**: No need to write custom CSS, easier for teams
- **Performance**: Built-in purging removes unused styles automatically
- **Responsive**: Mobile-first design patterns built-in

**Radix UI vs Building from Scratch**

- **Accessibility**: WCAG compliant out-of-the-box (critical for enterprise)
- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Focus Management**: Handles complex focus scenarios in modals/dialogs

**Static Generation vs Server-Side Application**

- **No Infrastructure**: Works in any environment without servers
- **Security**: No attack surface, just static files
- **Portability**: Can be opened from filesystem or any web server
- **CI/CD Friendly**: Perfect for artifact generation in pipelines

## Understanding ASH JSON Structure

Before building the UI, it's crucial to understand the data structure we're working with. ASH aggregates findings from multiple scanners into a unified JSON structure:

```json
{
  "findings": [
    {
      "tool": "Grype",
      "severity": "HIGH",
      "message": "Vulnerability CVE-2025-1234 in libfoo",
      "location": "package.json",
      "description": "Detailed vulnerability description...",
      "recommendation": "Upgrade to version 2.3.4 or later"
    },
    {
      "tool": "git-secrets",
      "severity": "CRITICAL",
      "message": "AWS secret detected",
      "location": "src/config.js",
      "lineNumber": 42,
      "pattern": "AKIA[0-9A-Z]{16}"
    }
  ],
  "metadata": {
    "scanDate": "2025-01-15T10:30:00Z",
    "totalFindings": 15,
    "tools": ["Grype", "git-secrets", "Semgrep", "CDK-nag"]
  }
}
```

### Why This Structure Matters for UI Design

**Understanding the Data Drives UI Decisions:**

1. **Findings Array**: Each finding is a separate security issue
   - **UI Implication**: We need a table/list view to display multiple findings
   - **Filtering Need**: Users want to filter by tool, severity, or location
   - **Detail View**: Each finding needs an expandable detail section

2. **Tool Field**: Different scanners have different purposes
   - **Grype**: Dependency vulnerabilities (focus on CVE numbers, versions)
   - **git-secrets**: Exposed secrets (focus on patterns, line numbers)
   - **Semgrep**: Code quality issues (focus on code snippets, rules)
   - **CDK-nag**: Infrastructure issues (focus on resources, policies)
   - **UI Implication**: We need tabbed or filtered views per tool type

3. **Severity Levels**: Critical > High > Medium > Low
   - **UI Implication**: Color coding, priority sorting, filter controls
   - **Visual Hierarchy**: Critical issues should stand out immediately
   - **User Workflow**: Developers typically want to see "High+" issues first

4. **Metadata**: Context about the scan itself
   - **Scan Date**: When the scan was performed (important for report freshness)
   - **Total Findings**: Summary statistics for dashboard cards
   - **Tools**: Which scanners were used (affects available tabs/filters)

### Key Fields Explained

- **`tool`**: Scanner name (used for categorization and filtering)
  - **Why Important**: Different tools require different presentation styles
  - **UI Usage**: Tab navigation, filter dropdowns, grouping

- **`severity`**: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`
  - **Why Important**: Determines visual priority and user attention
  - **UI Usage**: Color coding, sorting, primary filtering mechanism

- **`message`**: Brief description of the finding
  - **Why Important**: First line of information users see
  - **UI Usage**: Main table column, search functionality

- **`location`**: File path or resource identifier
  - **Why Important**: Helps developers locate and fix issues
  - **UI Usage**: Clickable links, file filtering, breadcrumbs

- **`description`**: Detailed explanation (optional)
  - **Why Important**: Provides context for understanding the issue
  - **UI Usage**: Expandable details, modal dialogs

- **`recommendation`**: Remediation guidance (optional)
  - **Why Important**: Actionable steps for developers
  - **UI Usage**: Highlighted call-to-action sections

### TypeScript Interfaces

Since we've chosen TypeScript, we need to define type-safe interfaces for the ASH data. This step is crucial for maintaining code quality and preventing runtime errors.

#### Why TypeScript for Security Reports?

**Type Safety Prevents Runtime Errors:**

- Security data is critical - a typo in a severity level could hide critical vulnerabilities
- Different scanners may have slightly different data structures
- TypeScript catches these mismatches at compile time, not in production

**Better Developer Experience:**

- Auto-completion helps when working with complex nested data
- IDEs can provide real-time error checking
- Refactoring becomes safer with type checking

**Self-Documenting Code:**

- Interfaces serve as living documentation
- New team members can understand data structures quickly
- API contracts are explicit and enforced

#### The Interface Design

```typescript
// src/types/ash.ts
export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export interface Finding {
  tool: string
  severity: SeverityLevel
  message: string
  location: string
  description?: string
  recommendation?: string
  lineNumber?: number
  pattern?: string
  cve?: string
  score?: number
}

export interface ScanMetadata {
  scanDate: string
  totalFindings: number
  tools: string[]
  duration?: number
  version?: string
}

export interface ASHReport {
  findings: Finding[]
  metadata: ScanMetadata
}

export interface SeverityConfig {
  color: string
  icon: string
  priority: number
}
```

#### Interface Design Reasoning

**1. `SeverityLevel` Union Type**

```typescript
export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
```

- **Why Union Type**: Only these exact strings are valid severity levels
- **Prevents Typos**: TypeScript will error if you use 'critical' instead of 'CRITICAL'
- **IDE Support**: Auto-completion will only show valid options
- **Future-Proof**: Easy to add new severity levels if ASH changes

**2. `Finding` Interface with Optional Properties**

```typescript
description?: string  // Optional - not all findings have detailed descriptions
recommendation?: string  // Optional - some tools don't provide remediation steps
```

- **Why Optional**: Different scanners provide different levels of detail
- **Flexibility**: Can handle various ASH output formats
- **Graceful Degradation**: UI can work with minimal data

**3. `SeverityConfig` for UI Consistency**

```typescript
export interface SeverityConfig {
  color: string // CSS class for color coding
  icon: string // Emoji or icon character
  priority: number // For sorting (higher = more important)
}
```

- **Why Separate**: Keeps UI logic separate from data logic
- **Maintainability**: Easy to change colors/icons without touching components
- **Consistency**: Ensures all severity displays use the same styling

**Benefits of This TypeScript Setup:**

- **Compile-Time Safety**: Catch data structure mismatches before deployment
- **IntelliSense**: Auto-completion for finding properties and methods
- **Refactoring**: Safe renaming and restructuring of components
- **Documentation**: Interfaces serve as living documentation
- **Team Collaboration**: Clear contracts between frontend and data processing

## Technology Stack

This section explains our technology choices in detail, helping beginners understand why each tool was selected and how they work together.

### Preact (React Alternative)

**What is Preact?**
Preact is a fast, lightweight alternative to React with the same API. It's designed to be a drop-in replacement for React with better performance and smaller bundle size.

**Why Preact over React for ASH Reports?**

1. **Size Comparison**: ~4KB gzipped vs React's ~45KB
   - **Impact**: Faster loading in CI/CD environments with limited bandwidth
   - **User Experience**: Instant report opening, especially on mobile devices
   - **Deployment**: Smaller artifacts in CI systems mean faster uploads/downloads

2. **Performance Benefits**: Faster virtual DOM with same API
   - **Rendering**: Quicker updates when filtering large datasets
   - **Memory Usage**: Lower memory footprint for long-running reports
   - **Battery Life**: Less CPU usage on mobile devices

3. **Static Site Generation**: Excellent support with `@preact/preset-vite`
   - **Pre-rendering**: Can generate static HTML at build time
   - **SEO**: Search engines can index the content
   - **Offline**: Works without JavaScript if needed

4. **Ecosystem Compatibility**: Works with React ecosystem (Radix UI)
   - **Libraries**: Can use most React libraries without modification
   - **Skills Transfer**: React developers can use Preact immediately
   - **Migration**: Easy to switch to React later if needed

**When to Choose Preact:**

- ✅ Static reports and dashboards
- ✅ Performance-critical applications
- ✅ Mobile-first experiences
- ✅ CI/CD artifacts
- ❌ Complex state management (Redux works but adds overhead)
- ❌ Server-side rendering (Preact/compat required)

### Tailwind CSS v4

**What is Tailwind CSS?**
Tailwind is a utility-first CSS framework that provides low-level utility classes to build custom designs directly in HTML.

**Why Tailwind CSS v4 for ASH Reports?**

1. **Utility-First Philosophy**
   - **Rapid Development**: Build UI without writing custom CSS
   - **Consistency**: Predefined spacing, colors, and typography
   - **Maintainability**: Changes are localized to HTML, not global CSS files

2. **Version 4 Improvements**
   - **CSS-First Configuration**: Configuration in CSS files, not JavaScript
   - **Performance**: 3-5x faster builds with microsecond incremental updates
   - **Modern CSS**: Uses cascade layers, `color-mix()`, logical properties
   - **Simplified Setup**: Single `@import "tailwindcss"` directive

3. **Perfect for Security Reports**
   - **Color Coding**: Built-in color utilities for severity levels
   - **Responsive Design**: Mobile-first approach for various screen sizes
   - **Component Styling**: Easy to style Radix UI components
   - **Purging**: Automatically removes unused styles for smaller bundles

**Example: Why Utility Classes Work Well**

```html
<!-- Traditional CSS approach -->
<div class="severity-critical">Critical Finding</div>

<!-- Tailwind approach -->
<div class="bg-red-100 text-red-800 border-red-300 px-3 py-1 rounded">
  Critical Finding
</div>
```

**Benefits:**

- **Self-Documenting**: The HTML tells you exactly what styles are applied
- **No CSS Conflicts**: Utility classes don't override each other
- **Responsive**: Built-in responsive modifiers (`md:`, `lg:`, etc.)
- **Customizable**: Easy to adjust colors, spacing, etc.

### Radix UI Components

**What is Radix UI?**
Radix UI is a collection of low-level, accessible component primitives for building high-quality design systems and web applications.

**Why Radix UI for ASH Reports?**

1. **Accessibility First (Critical for Enterprise)**
   - **WCAG Compliance**: Meets accessibility standards out of the box
   - **Screen Reader Support**: Proper ARIA labels and descriptions
   - **Keyboard Navigation**: Full keyboard support for all interactions
   - **Focus Management**: Handles complex focus scenarios in modals/dialogs

2. **Unstyled Components (Perfect with Tailwind)**
   - **Complete Control**: Style components exactly how you want
   - **No CSS Conflicts**: No default styles to override
   - **Consistent Behavior**: Same interaction patterns across all components
   - **Theming**: Easy to implement dark mode or custom themes

3. **Composable Architecture**
   - **Flexible**: Build complex UI patterns from simple primitives
   - **Reusable**: Components can be combined in multiple ways
   - **Maintainable**: Clear separation between behavior and appearance

4. **Production Ready**
   - **Battle Tested**: Used by companies like GitHub, Atlassian, and Stripe
   - **TypeScript First**: Excellent type safety and IDE support
   - **Well Documented**: Comprehensive guides and examples
   - **Active Development**: Regular updates and bug fixes

**Key Components We'll Use:**

- **Accordion**: For expandable finding details
- **Dialog**: For detailed finding views
- **Tabs**: For filtering by scanner type
- **Tooltip**: For additional context
- **Progress**: For loading states

**Example: Why Radix UI Accessibility Matters**

```typescript
// Radix UI Dialog provides:
// - Focus trap (can't tab outside modal)
// - Escape key handling
// - Proper ARIA labels
// - Screen reader announcements
// - Backdrop click closing
// - All automatically!

<Dialog.Root>
  <Dialog.Trigger>Open Finding Details</Dialog.Trigger>
  <Dialog.Content>
    {/* Content automatically gets proper ARIA roles */}
  </Dialog.Content>
</Dialog.Root>
```

### How These Technologies Work Together

**The Integration Strategy:**

1. **Preact** provides the component architecture and reactivity
2. **Tailwind CSS** handles all styling without custom CSS
3. **Radix UI** provides accessible, interactive components
4. **TypeScript** ensures type safety across all layers

**Benefits of This Combination:**

- **Small Bundle**: Preact + Tailwind + Radix UI = ~15KB gzipped
- **Fast Development**: Utility classes + composable components
- **Accessible**: Enterprise-ready accessibility by default
- **Maintainable**: Clear separation of concerns
- **Future-Proof**: All technologies are actively maintained

## Project Setup

This section walks through the initial project setup, explaining each decision and configuration choice to help beginners understand the reasoning behind each step.

### 1. Initialize Project

The first step is creating a new Preact project using the official scaffolding tool:

```bash
npm create preact@latest ash-report-ui
cd ash-report-ui
```

**Why Use the Official Scaffolding?**

- **Battle-tested**: Includes proven configurations and best practices
- **Maintained**: Regularly updated with latest tooling improvements
- **Comprehensive**: Handles complex setup (TypeScript, bundling, etc.)
- **Time-saving**: Avoids manual configuration of build tools

### 2. Configuration Choices Explained

When prompted by the create-preact script, choose the following options. Each choice is explained with its reasoning:

#### **Project language:** `TypeScript` ✅

**Why Choose TypeScript for ASH Reports?**

**The Problem with JavaScript:**

```javascript
// JavaScript - errors only appear at runtime
function processFinding(finding) {
  // Typo in severity check - will fail silently
  if (finding.severety === 'CRITICAL') {
    // This code never runs due to typo
    highlightCritical(finding)
  }
}
```

**The TypeScript Solution:**

```typescript
// TypeScript - errors caught at compile time
function processFinding(finding: Finding) {
  // TypeScript error: Property 'severety' does not exist on type 'Finding'
  if (finding.severety === 'CRITICAL') {
    highlightCritical(finding)
  }
}
```

**Specific Benefits for ASH Reports:**

- **Complex Data Structures**: ASH JSON has nested objects with optional fields
- **Security Critical**: Typos in severity levels could hide critical vulnerabilities
- **Team Collaboration**: Clear interfaces help multiple developers work together
- **IDE Support**: Better autocomplete and refactoring for large codebases
- **Maintenance**: Easier to update when ASH changes its output format

#### **Use router:** `Yes` ✅

**Why Routing for Security Reports?**

**Enhanced User Experience:**

- **Deep Linking**: Share URLs to specific findings or tool categories
- **Navigation**: Breadcrumb navigation for large reports
- **Bookmarking**: Users can bookmark specific views
- **Back Button**: Browser back/forward works as expected

**Technical Benefits:**

- **Code Splitting**: Only load components when needed
- **Lazy Loading**: Improve initial load time for large reports
- **State Management**: URL as single source of truth for view state
- **Future Expansion**: Easy to add new views (settings, export, etc.)

**Example URL Structure:**

```
/                       # Dashboard overview
/by-tool/grype         # Filter by specific tool
/by-severity/critical  # Show only critical findings
/finding/123           # Individual finding detail
```

#### **Prerender app (SSG):** `Yes` ✅

**Why Static Site Generation for CI/CD?**

**The Problem with Client-Side Only:**

```javascript
// Client-side only - requires JavaScript to work
function App() {
  const [data, setData] = useState(null)

  useEffect(() => {
    // Report is blank until JavaScript loads
    fetchASHData().then(setData)
  }, [])

  return data ? <Report data={data} /> : <Loading />
}
```

**The SSG Solution:**

```typescript
// SSG - HTML is pre-generated with data
export async function prerender() {
  // Data is embedded in HTML at build time
  return {
    html: render(<Report data={ashData} />),
    head: { title: 'ASH Security Report' }
  }
}
```

**Benefits for ASH Reports:**

- **Self-Contained**: HTML works without external dependencies
- **Fast Loading**: No JavaScript required for initial render
- **Offline Capable**: Works when opened from filesystem
- **CI/CD Friendly**: Perfect for artifact generation in pipelines
- **SEO**: Search engines can index the content

#### **Use ESLint:** `Yes` ✅

**Why Code Quality Tools for Security Applications?**

**Catching Bugs Early:**

```typescript
// ESLint catches potential issues:
function processFinding(finding: Finding) {
  // ESLint error: 'severity' is assigned but never used
  const severity = finding.severity

  // ESLint error: Missing return statement
  if (severity === 'CRITICAL') {
    console.log('Critical finding!')
  }
}
```

**Security-Specific Benefits:**

- **Consistency**: All team members follow same coding standards
- **Bug Prevention**: Catches common JavaScript/TypeScript pitfalls
- **Security Rules**: Can add rules to prevent security vulnerabilities
- **CI/CD Integration**: Automated code quality checks in pipelines

**Example Interaction:**

```bash
$ npm create preact@latest ash-report-ui
✔ Project language › TypeScript
✔ Use router? › Yes
✔ Prerender app (SSG)? › Yes
✔ Use ESLint? › Yes

Creating project in /path/to/ash-report-ui...
Done! 🎉
```

**What This Creates:**

- **Project Structure**: Well-organized folder structure
- **Build Configuration**: Vite bundler with TypeScript support
- **Development Server**: Hot reload for rapid development
- **Production Build**: Optimized static file generation
- **Code Quality**: ESLint and TypeScript configured together

### 3. TypeScript Configuration Deep Dive

The create-preact script generates a `tsconfig.json` with sensible defaults. For ASH reports, we need additional configurations to ensure maximum type safety and developer experience.

#### Base Configuration Analysis

**Default tsconfig.json:**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": false,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "resolution": "node",
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "jsxImportSource": "preact"
  }
}
```

#### Enhanced Configuration for ASH Reports

```json
// tsconfig.json (additions/modifications)
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*", "src/**/*.tsx", "src/**/*.ts"]
}
```

#### Configuration Choices Explained

**1. `"strict": true` - Maximum Type Safety**

```typescript
// Without strict mode - potential runtime errors
function processFinding(finding) {
  // 'finding' could be null/undefined
  return finding.severity.toLowerCase() // Runtime error if finding is null
}

// With strict mode - compile-time safety
function processFinding(finding: Finding | null) {
  // TypeScript error: Object is possibly 'null'
  return finding.severity.toLowerCase()

  // Correct approach:
  return finding?.severity?.toLowerCase() ?? 'unknown'
}
```

**Why Critical for ASH Reports:**

- **Null Safety**: Prevents crashes when ASH data is malformed
- **Type Inference**: Better detection of type mismatches
- **Runtime Safety**: Catches errors before deployment

**2. `"noUnusedLocals": true` - Clean Code Enforcement**

```typescript
// TypeScript error: 'unusedVariable' is declared but never used
function processFinding(finding: Finding) {
  const unusedVariable = finding.severity // Error!
  const usedVariable = finding.message
  return usedVariable
}
```

**Benefits:**

- **Code Quality**: Prevents dead code accumulation
- **Performance**: Smaller bundle size
- **Maintenance**: Easier to understand codebase

**3. `"noUnusedParameters": true` - Function Clarity**

```typescript
// TypeScript error: 'index' is declared but never used
findings.map((finding, index) => {
  // Error! 'index' is not used
  return processFinding(finding)
})

// Correct approach:
findings.map(finding => processFinding(finding))
// Or if index is needed:
findings.map((finding, index) => ({ ...finding, id: index }))
```

**4. `"exactOptionalPropertyTypes": true` - Precise Optional Handling**

```typescript
// Without exactOptionalPropertyTypes
interface Finding {
  description?: string
}

const finding: Finding = {
  description: undefined, // This would be allowed
}

// With exactOptionalPropertyTypes
const finding: Finding = {
  description: undefined, // TypeScript error!
}

// Correct approach:
const finding: Finding = {
  // Just omit the property
}
```

**Why Important for ASH:**

- **Data Integrity**: Ensures optional fields are truly optional
- **API Consistency**: Prevents inconsistent data structures
- **JSON Serialization**: Matches actual JSON behavior

**5. `"noUncheckedIndexedAccess": true` - Array Safety**

```typescript
// Without noUncheckedIndexedAccess
const findings: Finding[] = []
const firstFinding = findings[0] // Type: Finding (wrong!)
console.log(firstFinding.severity) // Runtime error!

// With noUncheckedIndexedAccess
const findings: Finding[] = []
const firstFinding = findings[0] // Type: Finding | undefined (correct!)

// Forces safe access:
if (firstFinding) {
  console.log(firstFinding.severity) // Safe!
}
```

**Critical for ASH Reports:**

- **Array Safety**: Prevents crashes when filtering returns empty arrays
- **Defensive Programming**: Encourages proper error handling
- **Data Validation**: Ensures robust data processing

**6. Path Mapping - Developer Experience**

```typescript
// Without path mapping - relative imports
import { Finding } from '../../../types/ash'
import { SeverityBadge } from '../../ui/badge'
import { formatDate } from '../../../utils/date'

// With path mapping - clean imports
import { Finding } from '@/types/ash'
import { SeverityBadge } from '@/components/ui/badge'
import { formatDate } from '@/utils/date'
```

**Benefits:**

- **Readability**: Clear import paths
- **Refactoring**: Easy to move files around
- **IDE Support**: Better autocomplete and navigation

#### Include Patterns Explained

```json
"include": ["src/**/*", "src/**/*.tsx", "src/**/*.ts"]
```

**What This Covers:**

- **`src/**/\*`\*\*: All files in src directory and subdirectories
- **`src/**/\*.tsx`\*\*: All TypeScript JSX files (Preact components)
- **`src/**/\*.ts`\*\*: All TypeScript files (utilities, types, etc.)

**Why Specific Patterns:**

- **Performance**: Only check files that matter
- **Clarity**: Explicit about what's included
- **Build Optimization**: Faster compilation

#### Real-World Impact Example

**Before Enhanced Configuration:**

```typescript
// This code would compile but fail at runtime
function createSeverityBadge(findings) {
  const criticalFindings = findings.filter(f => f.severity === 'CRITICAL')
  return criticalFindings[0].message // Runtime error if no critical findings!
}
```

**After Enhanced Configuration:**

```typescript
// TypeScript forces safe code
function createSeverityBadge(findings: Finding[]) {
  const criticalFindings = findings.filter(f => f.severity === 'CRITICAL')
  const firstCritical = criticalFindings[0] // Type: Finding | undefined

  if (firstCritical) {
    return firstCritical.message // Safe!
  }
  return 'No critical findings'
}
```

**Key Benefits for ASH Projects:**

- **Compile-Time Safety**: Catches errors before they reach users
- **Better IDE Support**: Enhanced autocomplete and error detection
- **Team Consistency**: All developers get the same strict checking
- **Future-Proof**: Easier to maintain and extend the codebase

### 4. Install Dependencies with Detailed Reasoning

Understanding what each package does and why it's needed is crucial for beginners. This section breaks down every dependency and explains its role in the ASH report system.

#### Core Framework Dependencies

```bash
# Core Preact ecosystem
npm install preact @preact/preset-vite preact-iso
```

**1. `preact` - The Core Framework**

- **Purpose**: Provides the React-like component system and virtual DOM
- **Why Not React**: 90% smaller bundle size (4KB vs 45KB)
- **What It Does**: Manages component state, renders UI, handles events

**2. `@preact/preset-vite` - Build Tool Integration**

- **Purpose**: Configures Vite (our bundler) to work perfectly with Preact
- **What It Provides**:
  - TypeScript support for JSX
  - Hot module replacement (instant updates during development)
  - Production optimization
  - Static site generation capabilities

**3. `preact-iso` - Isomorphic Rendering**

- **Purpose**: Enables the same code to run on server (build time) and client
- **Critical for ASH**: Allows us to generate static HTML with embedded data
- **What It Provides**:
  - `render()` function for static generation
  - `hydrate()` function for client-side interactivity
  - Routing system that works in both environments

#### UI and Styling Dependencies

```bash
# Modern CSS framework
npm install tailwindcss @tailwindcss/vite
```

**4. `tailwindcss` - CSS Framework**

- **Purpose**: Provides utility-first CSS classes for rapid UI development
- **Why Not Regular CSS**:
  - Consistent design system
  - No class naming conflicts
  - Automatic purging of unused styles
  - Mobile-first responsive design

**5. `@tailwindcss/vite` - Tailwind v4 Integration**

- **Purpose**: Integrates Tailwind CSS v4 with Vite bundler
- **Performance Benefits**:
  - 3-5x faster builds
  - Microsecond incremental updates
  - CSS-first configuration
  - Better tree-shaking

#### Radix UI Components

```bash
# Accessible, unstyled component primitives
npm install @radix-ui/react-accordion @radix-ui/react-alert-dialog
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-progress @radix-ui/react-tabs
npm install @radix-ui/react-toast @radix-ui/react-tooltip
npm install @radix-ui/react-separator @radix-ui/react-label
```

**Why Each Radix Component:**

**6. `@radix-ui/react-accordion` - Expandable Sections**

- **ASH Use Case**: Expanding finding details without cluttering the main view
- **Benefits**: Built-in keyboard navigation, ARIA labels, smooth animations
- **Example**: Click to expand vulnerability details, CVE information

**7. `@radix-ui/react-dialog` - Modal Windows**

- **ASH Use Case**: Detailed finding views, confirmation dialogs
- **Benefits**: Focus management, escape key handling, backdrop clicks
- **Example**: Full-screen view of finding with recommendation details

**8. `@radix-ui/react-tabs` - Content Organization**

- **ASH Use Case**: Separate findings by tool type (Grype, git-secrets, etc.)
- **Benefits**: Keyboard navigation, proper ARIA roles, URL synchronization
- **Example**: Tabs for "All Findings", "Vulnerabilities", "Secrets", "Code Issues"

**9. `@radix-ui/react-dropdown-menu` - Filter Controls**

- **ASH Use Case**: Severity filters, export options, view settings
- **Benefits**: Keyboard navigation, proper positioning, accessibility
- **Example**: Dropdown to select severity levels (Critical, High, Medium, Low)

**10. `@radix-ui/react-progress` - Loading States**

- **ASH Use Case**: Show progress while parsing large ASH JSON files
- **Benefits**: Screen reader announcements, customizable styling
- **Example**: Progress bar while loading 1000+ findings

**11. `@radix-ui/react-tooltip` - Contextual Help**

- **ASH Use Case**: Explain severity levels, tool descriptions, CVE details
- **Benefits**: Proper positioning, keyboard triggering, ARIA compliance
- **Example**: Hover over CVE number to see vulnerability description

**12. `@radix-ui/react-separator` - Visual Dividers**

- **ASH Use Case**: Separate sections in the UI clearly
- **Benefits**: Semantic HTML, proper ARIA roles
- **Example**: Divide summary cards from detailed findings table

**13. `@radix-ui/react-label` - Form Accessibility**

- **ASH Use Case**: Filter controls, search inputs, form fields
- **Benefits**: Proper association with form controls, screen reader support
- **Example**: Label for severity filter checkboxes

#### Utility Dependencies

```bash
# Styling and component utilities
npm install class-variance-authority clsx tailwind-merge
npm install lucide-preact # Icons
```

**14. `class-variance-authority` - Component Variants**

- **Purpose**: Create consistent component APIs with multiple styling variants
- **ASH Use Case**: Severity badges with different colors/styles
- **Example**:

  ```typescript
  const badge = cva('px-2 py-1 rounded', {
    variants: {
      severity: {
        critical: 'bg-red-500 text-white',
        high: 'bg-orange-500 text-white',
        medium: 'bg-yellow-500 text-black',
        low: 'bg-green-500 text-white',
      },
    },
  })
  ```

**15. `clsx` - Conditional Classes**

- **Purpose**: Conditionally combine CSS classes
- **ASH Use Case**: Apply different styles based on finding properties
- **Example**:

  ```typescript
  const className = clsx('finding-row', {
    'bg-red-50': finding.severity === 'CRITICAL',
    'opacity-50': finding.resolved,
  })
  ```

**16. `tailwind-merge` - Class Conflict Resolution**

- **Purpose**: Merge Tailwind classes without conflicts
- **ASH Use Case**: Override default styles while maintaining Tailwind utilities
- **Example**:

  ```typescript
  // Without tailwind-merge: both classes applied, conflicts possible
  className = 'px-4 px-2' // Which padding wins?

  // With tailwind-merge: intelligently resolves conflicts
  className = twMerge('px-4 px-2') // Results in "px-2"
  ```

**17. `lucide-preact` - Icon Library**

- **Purpose**: Provide consistent, accessible icons
- **ASH Use Case**: Severity indicators, action buttons, navigation
- **Why Lucide**:
  - Optimized for React/Preact
  - Consistent design language
  - Tree-shakable (only imports used icons)
  - Accessibility-friendly

#### Why This Specific Combination Works

**Synergistic Benefits:**

1. **Performance**: Preact + Tailwind + Radix UI = ~15KB total
2. **Accessibility**: Radix UI ensures enterprise-grade accessibility
3. **Developer Experience**: TypeScript + utilities provide excellent DX
4. **Maintainability**: Clear separation of concerns between libraries
5. **Flexibility**: Can easily customize or replace individual pieces

**Alternative Approaches and Why We Didn't Choose Them:**

- **Material-UI**: Too opinionated, large bundle size
- **Chakra UI**: Good but larger than our stack
- **Ant Design**: Enterprise-focused but heavyweight
- **Vanilla CSS**: Too much custom code, no design system
- **Styled Components**: Runtime CSS-in-JS overhead

**Installation Tips:**

```bash
# Install all at once for better dependency resolution
npm install preact @preact/preset-vite preact-iso tailwindcss @tailwindcss/vite @radix-ui/react-accordion @radix-ui/react-dialog @radix-ui/react-tabs @radix-ui/react-dropdown-menu @radix-ui/react-progress @radix-ui/react-tooltip @radix-ui/react-separator @radix-ui/react-label class-variance-authority clsx tailwind-merge lucide-preact

# Or group logically for better understanding
npm install preact @preact/preset-vite preact-iso
npm install tailwindcss @tailwindcss/vite
npm install @radix-ui/react-accordion @radix-ui/react-dialog @radix-ui/react-tabs @radix-ui/react-dropdown-menu @radix-ui/react-progress @radix-ui/react-tooltip @radix-ui/react-separator @radix-ui/react-label
npm install class-variance-authority clsx tailwind-merge lucide-preact
```

### 5. Configure Vite Build Tool

Vite is our build tool and development server. Understanding its configuration is crucial for both development workflow and production builds. This section explains each configuration option and its impact on the ASH report system.

#### What is Vite?

Vite is a modern build tool that provides:

- **Lightning-fast development server** with instant hot module replacement
- **Optimized production builds** using Rollup bundler
- **TypeScript support** out of the box
- **Modern JavaScript features** (ES modules, dynamic imports)
- **Plugin ecosystem** for framework integration

#### Complete Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    preact({
      prerender: { enabled: true },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'radix-ui': ['@radix-ui/react-accordion', '@radix-ui/react-dialog'],
          vendor: ['preact', 'preact-iso'],
        },
      },
    },
  },
})
```

#### Configuration Breakdown

**1. Plugin System**

```typescript
plugins: [
  tailwindcss(),
  preact({
    prerender: { enabled: true },
  }),
]
```

**`tailwindcss()` Plugin:**

- **Purpose**: Integrates Tailwind CSS v4 with Vite
- **What It Does**:
  - Processes `@import "tailwindcss"` directives
  - Generates utility classes on-demand
  - Purges unused CSS in production
  - Provides fast rebuilds during development

**`preact()` Plugin with Prerendering:**

- **Purpose**: Configures Preact for both development and production
- **Key Configuration**: `prerender: { enabled: true }`
- **What Prerendering Does**:
  - Generates static HTML at build time
  - Embeds data directly into HTML
  - Creates self-contained artifacts
  - Improves initial loading performance

**Why Prerendering is Critical for ASH Reports:**

```typescript
// Without prerendering - client-side only
function App() {
  const [data, setData] = useState(null)

  useEffect(() => {
    // User sees blank page until this loads
    fetch('/ash-data.json').then(setData)
  }, [])

  return data ? <Report data={data} /> : <Loading />
}

// With prerendering - static HTML generated
export async function prerender() {
  const ashData = await loadASHData()
  return {
    html: render(<Report data={ashData} />),
    // HTML contains rendered content immediately
  }
}
```

**2. Build Optimization**

```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'radix-ui': ['@radix-ui/react-accordion', '@radix-ui/react-dialog'],
        vendor: ['preact', 'preact-iso'],
      },
    },
  },
}
```

**Manual Chunk Splitting Explained:**

**What is Code Splitting?**

- Divides your code into separate files (chunks)
- Allows browser to cache parts separately
- Improves loading performance for repeat visits

**Why Manual Chunks for ASH Reports:**

```typescript
manualChunks: {
  'radix-ui': ['@radix-ui/react-accordion', '@radix-ui/react-dialog'],
  vendor: ['preact', 'preact-iso'],
}
```

**`'radix-ui'` Chunk:**

- **Contents**: All Radix UI components grouped together
- **Benefit**: UI components change less frequently than application code
- **Caching**: Browser can cache UI components separately
- **Loading**: Only loads when UI interactions are needed

**`'vendor'` Chunk:**

- **Contents**: Core framework code (Preact, routing)
- **Benefit**: Framework code rarely changes
- **Caching**: Excellent caching characteristics
- **Loading**: Loaded once, cached for all reports

**Without Manual Chunks:**

```
app.js (150KB) - Contains everything
```

**With Manual Chunks:**

```
app.js (30KB) - Your application code
vendor.js (15KB) - Preact framework (cached)
radix-ui.js (25KB) - UI components (cached)
```

**Impact on ASH Reports:**

- **First Load**: Slightly slower (3 files vs 1)
- **Subsequent Loads**: Much faster (cached chunks)
- **Updates**: Only app code needs to be downloaded when you update logic
- **Bandwidth**: Saves bandwidth for users viewing multiple reports

#### Additional Configuration Options

**Enhanced Configuration for Production:**

```typescript
export default defineConfig({
  plugins: [
    tailwindcss(),
    preact({
      prerender: { enabled: true },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'radix-ui': ['@radix-ui/react-accordion', '@radix-ui/react-dialog'],
          vendor: ['preact', 'preact-iso'],
        },
      },
    },
    // Additional optimizations
    minify: 'terser',
    sourcemap: false,
    target: 'es2020',
  },
  // Development optimizations
  server: {
    port: 3000,
    open: true,
    hmr: true,
  },
})
```

**Additional Options Explained:**

**`minify: 'terser'`**

- **Purpose**: Compress JavaScript code for smaller files
- **Impact**: Reduces bundle size by 20-30%
- **Trade-off**: Slightly slower builds

**`sourcemap: false`**

- **Purpose**: Removes source maps from production builds
- **Impact**: Smaller bundle size, faster builds
- **Trade-off**: Harder to debug production issues

**`target: 'es2020'`**

- **Purpose**: Targets modern browsers
- **Impact**: Smaller bundles, better performance
- **Trade-off**: Drops support for very old browsers

#### Development vs Production Behavior

**Development Mode (`npm run dev`):**

- **Hot Module Replacement**: Instant updates without refresh
- **Fast Builds**: No minification, quick rebuilds
- **Source Maps**: Easy debugging with original code
- **Tailwind**: Generates all utility classes

**Production Mode (`npm run build`):**

- **Static Generation**: Pre-renders HTML with data
- **Minification**: Compressed code for smaller files
- **Code Splitting**: Separate chunks for better caching
- **Tailwind**: Only includes used utility classes

#### Common Configuration Issues and Solutions

**Problem**: Prerendering fails with "document is not defined"
**Solution**: Use `typeof window !== 'undefined'` checks

```typescript
// Problematic code
const theme = localStorage.getItem('theme')

// Solution
const theme =
  typeof window !== 'undefined' ? localStorage.getItem('theme') : 'light'
```

**Problem**: Radix UI components don't work in production
**Solution**: Ensure proper import paths

```typescript
// Wrong
import { Dialog } from '@radix-ui/react-dialog/dist/index.mjs'

// Correct
import * as Dialog from '@radix-ui/react-dialog'
```

**Problem**: Tailwind classes not appearing
**Solution**: Ensure CSS import is correct

```css
/* Wrong */
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

/* Correct for v4 */
@import 'tailwindcss';
```

#### Why This Configuration Works for ASH Reports

**1. Performance**: Manual chunks + prerendering = fast loading
**2. Caching**: Vendor chunks rarely change, excellent caching
**3. Development**: Hot reload for rapid development
**4. Production**: Optimized builds for CI/CD artifacts
**5. Compatibility**: Works in all modern browsers
**6. Maintainability**: Clear separation of concerns

### 6. Configure Tailwind CSS v4

Tailwind CSS v4 represents a major evolution in how we configure and use CSS frameworks. Understanding its configuration is crucial for creating consistent, maintainable styles for ASH reports.

#### What's New in Tailwind CSS v4?

**Key Changes from v3:**

- **CSS-first configuration**: No more `tailwind.config.js` file
- **Performance improvements**: 3-5x faster builds
- **Modern CSS features**: Uses CSS custom properties, cascade layers
- **Simplified setup**: Single `@import` directive
- **Better tree-shaking**: More efficient unused CSS removal

#### Complete Tailwind Configuration

```css
/* src/styles/main.css */
@import 'tailwindcss';

@theme {
  --font-sans: system-ui, sans-serif;
  --color-critical: #dc2626;
  --color-high: #ea580c;
  --color-medium: #d97706;
  --color-low: #16a34a;
  --color-info: #2563eb;
  --border-radius: 0.5rem;
}

@layer utilities {
  .animate-fade-in {
    animation: fade-in 0.5s ease-out;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
```

#### Configuration Breakdown

**1. Base Import**

```css
@import 'tailwindcss';
```

**What This Does:**

- Imports all Tailwind CSS utilities and components
- Enables the new CSS-first configuration system
- Provides access to modern CSS features
- Sets up the foundation for custom theming

**Why Single Import:**

- **Simplicity**: No need to manage multiple import statements
- **Performance**: Vite plugin handles optimization automatically
- **Flexibility**: Can be extended with custom CSS easily
- **Future-proof**: Automatically gets updates when Tailwind updates

**2. Theme Configuration**

```css
@theme {
  --font-sans: system-ui, sans-serif;
  --color-critical: #dc2626;
  --color-high: #ea580c;
  --color-medium: #d97706;
  --color-low: #16a34a;
  --color-info: #2563eb;
  --border-radius: 0.5rem;
}
```

**ASH-Specific Theme Variables:**

**Font Configuration:**

```css
--font-sans: system-ui, sans-serif;
```

- **Purpose**: Ensures consistent typography across all platforms
- **Benefits**: Fast loading (no web font download), native OS appearance
- **Fallback**: Graceful degradation on older systems

**Severity Color Palette:**

```css
--color-critical: #dc2626; /* Red-600 */
--color-high: #ea580c; /* Orange-600 */
--color-medium: #d97706; /* Amber-600 */
--color-low: #16a34a; /* Green-600 */
--color-info: #2563eb; /* Blue-600 */
```

**Color Choice Reasoning:**

- **Critical (Red)**: Immediate attention required, danger
- **High (Orange)**: Important but not urgent
- **Medium (Amber)**: Moderate concern, should be addressed
- **Low (Green)**: Minor issue, least concern
- **Info (Blue)**: Informational, not a security issue

**Design System Benefits:**

- **Consistency**: Same colors used throughout the application
- **Accessibility**: Colors meet WCAG contrast requirements
- **Maintainability**: Easy to change theme globally
- **Extensibility**: Can add new severity levels easily

**Border Radius:**

```css
--border-radius: 0.5rem;
```

- **Purpose**: Consistent rounded corners throughout the UI
- **Modern Look**: Soft, friendly appearance
- **Accessibility**: Helps define interactive elements

**3. Custom Utilities Layer**

```css
@layer utilities {
  .animate-fade-in {
    animation: fade-in 0.5s ease-out;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
```

**Why Use `@layer utilities`:**

- **Proper Cascade**: Ensures custom utilities have correct specificity
- **Purging**: Custom utilities are included in Tailwind's purging process
- **Performance**: Optimized alongside built-in utilities
- **Maintainability**: Clear separation from base styles

**Custom Animation Explanation:**

```css
.animate-fade-in {
  animation: fade-in 0.5s ease-out;
}
```

**ASH Use Cases:**

- **Finding Cards**: Smooth appearance when filtering results
- **Modal Dialogs**: Gentle entry animation for detail views
- **Tab Content**: Smooth transitions between tool categories
- **Loading States**: Pleasant loading experience

**Animation Parameters:**

- **Duration**: `0.5s` - Long enough to be noticeable, short enough to feel responsive
- **Easing**: `ease-out` - Starts fast, slows down (feels natural)
- **Transform**: `translateY(10px)` - Subtle upward movement

#### How to Use These Configurations

**Using Theme Variables in Components:**

```typescript
// Using severity colors
<div className="bg-critical text-white">Critical Finding</div>
<div className="bg-high text-white">High Priority</div>
<div className="bg-medium text-black">Medium Priority</div>
<div className="bg-low text-white">Low Priority</div>

// Using custom radius
<div className="rounded-[--border-radius]">Consistent rounding</div>

// Using custom animation
<div className="animate-fade-in">Smooth entrance</div>
```

**Building Component Variants:**

```typescript
// Severity badge component
const severityClasses = {
  critical: 'bg-critical text-white',
  high: 'bg-high text-white',
  medium: 'bg-medium text-black',
  low: 'bg-low text-white'
}

function SeverityBadge({ severity }: { severity: SeverityLevel }) {
  return (
    <span className={`px-2 py-1 rounded ${severityClasses[severity]}`}>
      {severity}
    </span>
  )
}
```

#### Advanced Configuration Options

**Extended Theme for ASH Reports:**

```css
@theme {
  /* Typography */
  --font-sans: system-ui, sans-serif;
  --font-mono: 'SF Mono', Monaco, monospace;

  /* Severity Colors */
  --color-critical: #dc2626;
  --color-high: #ea580c;
  --color-medium: #d97706;
  --color-low: #16a34a;
  --color-info: #2563eb;

  /* Background Colors */
  --color-critical-bg: #fef2f2;
  --color-high-bg: #fff7ed;
  --color-medium-bg: #fffbeb;
  --color-low-bg: #f0fdf4;
  --color-info-bg: #eff6ff;

  /* Border Colors */
  --color-critical-border: #fecaca;
  --color-high-border: #fed7aa;
  --color-medium-border: #fde68a;
  --color-low-border: #bbf7d0;
  --color-info-border: #bfdbfe;

  /* Spacing */
  --space-card: 1rem;
  --space-section: 2rem;

  /* Borders */
  --border-radius: 0.5rem;
  --border-width: 1px;
}
```

**Benefits of Extended Theme:**

- **Comprehensive Design System**: All colors, spacing, and typography in one place
- **Consistency**: Ensures cohesive visual design
- **Accessibility**: Background/border colors provide proper contrast
- **Maintainability**: Easy to update the entire theme

#### Common CSS Patterns for ASH Reports

**Card Components:**

```css
.finding-card {
  @apply bg-white rounded-[--border-radius] border border-gray-200 p-[--space-card] shadow-sm;
}

.finding-card:hover {
  @apply shadow-md;
}
```

**Severity-specific Backgrounds:**

```css
.severity-critical {
  @apply bg-critical-bg border-critical-border text-critical;
}

.severity-high {
  @apply bg-high-bg border-high-border text-high;
}
```

#### Integration with Component Libraries

**Styling Radix UI Components:**

```typescript
// Dialog with theme variables
<Dialog.Content className="bg-white rounded-[--border-radius] p-6 shadow-lg">
  <Dialog.Title className="text-lg font-semibold mb-4">
    Finding Details
  </Dialog.Title>
  {/* Content */}
</Dialog.Content>

// Tabs with consistent styling
<Tabs.List className="bg-gray-100 rounded-[--border-radius] p-1">
  <Tabs.Trigger className="px-3 py-1 rounded-[--border-radius] data-[state=active]:bg-white">
    All Tools
  </Tabs.Trigger>
</Tabs.List>
```

#### Why This Configuration Works for ASH Reports

**1. Performance**: CSS-first configuration is processed at build time
**2. Consistency**: Design system ensures uniform appearance
**3. Accessibility**: Proper contrast ratios and semantic colors
**4. Maintainability**: Single source of truth for all styling
**5. Extensibility**: Easy to add new severity levels or themes
**6. Modern CSS**: Uses latest CSS features for better performance

### 7. Router Configuration (Optional Enhancement)

Since we enabled routing, you can create multiple views for different aspects of the security report:

```typescript
// src/routes/index.tsx
import { lazy } from 'preact/compat'

// Lazy load route components for better performance
const Dashboard = lazy(() => import('./Dashboard'))
const FindingsByTool = lazy(() => import('./FindingsByTool'))
const FindingsBySeverity = lazy(() => import('./FindingsBySeverity'))
const ExportView = lazy(() => import('./ExportView'))

export const routes = [
  { path: '/', component: Dashboard },
  { path: '/by-tool/:tool?', component: FindingsByTool },
  { path: '/by-severity/:severity?', component: FindingsBySeverity },
  { path: '/export', component: ExportView },
]
```

**Router Benefits for ASH Reports:**

- **Deep Linking**: Share links to specific finding categories
- **Navigation**: Breadcrumb navigation for complex reports
- **Performance**: Code splitting for large reports
- **User Experience**: Better organization of large datasets

### 8. Component Library Setup

Create a utility file for consistent styling:

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { SeverityLevel, SeverityConfig } from '@/types/ash'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const severityConfig: Record<SeverityLevel, SeverityConfig> = {
  CRITICAL: {
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: '🔴',
    priority: 4,
  },
  HIGH: {
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: '🟠',
    priority: 3,
  },
  MEDIUM: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: '🟡',
    priority: 2,
  },
  LOW: {
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: '🟢',
    priority: 1,
  },
}
```

## UI Component Design

### Core Components Architecture

Since Radix UI doesn't provide Badge and Card primitives (they're higher-level styling components), we'll build our own using Tailwind CSS:

```typescript
// src/components/ui/card.tsx
import { cn } from '@/lib/utils'
import type { ComponentChildren } from 'preact'

interface CardProps {
  className?: string
  children: ComponentChildren
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 bg-white text-gray-950 shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }: CardProps) {
  return (
    <h3
      className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardContent({ className, children, ...props }: CardProps) {
  return (
    <div className={cn("p-6 pt-0", className)} {...props}>
      {children}
    </div>
  )
}
```

```typescript
// src/components/ui/badge.tsx
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentChildren } from 'preact'

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border",
        success: "border-transparent bg-green-100 text-green-800 hover:bg-green-200",
        warning: "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
        error: "border-transparent bg-red-100 text-red-800 hover:bg-red-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
  className?: string
  children: ComponentChildren
}

export function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </div>
  )
}
```

### Summary Cards Component

```typescript
// src/components/SummaryCards.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { severityConfig } from '@/lib/utils'
import type { Finding, SeverityLevel } from '@/types/ash'

interface SummaryCardsProps {
  findings: Finding[]
}

export function SummaryCards({ findings }: SummaryCardsProps) {
  const counts = findings.reduce((acc, finding) => {
    acc[finding.severity] = (acc[finding.severity] || 0) + 1
    return acc
  }, {} as Record<SeverityLevel, number>)

  const getSeverityVariant = (severity: SeverityLevel) => {
    switch (severity) {
      case 'CRITICAL': return 'error'
      case 'HIGH': return 'warning'
      case 'MEDIUM': return 'warning'
      case 'LOW': return 'success'
      default: return 'default'
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {Object.entries(severityConfig).map(([severity, config]) => {
        const severityKey = severity as SeverityLevel
        const count = counts[severityKey] || 0

        return (
          <Card key={severity} className="transition-all hover:shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {config.icon} {severity}
                </CardTitle>
                <Badge variant={getSeverityVariant(severityKey)}>
                  {count}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <p className="text-xs text-gray-600">
                {count === 1 ? 'finding' : 'findings'}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
```

### Interactive Data Table

```typescript
// src/components/FindingsTable.tsx
import { useState } from 'preact/hooks'
import * as Dialog from '@radix-ui/react-dialog'
import * as Tabs from '@radix-ui/react-tabs'
import { X } from 'lucide-preact'
import { Badge } from '@/components/ui/badge'
import { severityConfig } from '@/lib/utils'
import type { Finding, SeverityLevel } from '@/types/ash'

interface FindingsTableProps {
  findings: Finding[]
}

export function FindingsTable({ findings }: FindingsTableProps) {
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null)
  const [activeTab, setActiveTab] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel[]>(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])

  const filteredFindings = findings.filter(finding => {
    const matchesTab = activeTab === 'all' || finding.tool === activeTab
    const matchesSeverity = severityFilter.includes(finding.severity)
    return matchesTab && matchesSeverity
  })

    const tools = [...new Set(findings.map(f => f.tool))]

  const getSeverityVariant = (severity: SeverityLevel) => {
    switch (severity) {
      case 'CRITICAL': return 'error'
      case 'HIGH': return 'warning'
      case 'MEDIUM': return 'warning'
      case 'LOW': return 'success'
      default: return 'default'
    }
  }

  return (
    <div className="space-y-4">
      {/* Severity Filter */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(severityConfig).map(([severity, config]) => {
          const severityKey = severity as SeverityLevel
          const isActive = severityFilter.includes(severityKey)

          return (
            <button
              key={severity}
              onClick={() => {
                setSeverityFilter(prev =>
                  prev.includes(severityKey)
                    ? prev.filter(s => s !== severityKey)
                    : [...prev, severityKey]
                )
              }}
              className={cn(
                "px-3 py-1 text-sm rounded-full border-2 transition-colors",
                isActive
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200"
              )}
            >
              {config.icon} {severity}
            </button>
          )
        })}
      </div>

      {/* Tool Tabs */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="flex space-x-1 rounded-lg bg-gray-100 p-1">
          <Tabs.Trigger
            value="all"
            className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            All Tools
          </Tabs.Trigger>
          {tools.map(tool => (
            <Tabs.Trigger
              key={tool}
              value={tool}
              className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              {tool}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </Tabs.Root>

      {/* Findings Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 font-medium">Severity</th>
              <th className="text-left p-4 font-medium">Tool</th>
              <th className="text-left p-4 font-medium">Message</th>
              <th className="text-left p-4 font-medium">Location</th>
              <th className="text-left p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFindings.map((finding, index) => (
              <tr key={index} className="border-t hover:bg-gray-50">
                <td className="p-4">
                  <Badge variant={getSeverityVariant(finding.severity)}>
                    {severityConfig[finding.severity].icon} {finding.severity}
                  </Badge>
                </td>
                <td className="p-4 font-mono text-sm">{finding.tool}</td>
                <td className="p-4 max-w-md truncate">{finding.message}</td>
                <td className="p-4 font-mono text-sm text-gray-600">{finding.location}</td>
                <td className="p-4">
                  <button
                    onClick={() => setSelectedFinding(finding)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Finding Details Modal */}
      <Dialog.Root open={!!selectedFinding} onOpenChange={() => setSelectedFinding(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <Dialog.Title className="text-lg font-semibold mb-4">
              Finding Details
            </Dialog.Title>

            {selectedFinding && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Severity</label>
                    <Badge variant={getSeverityVariant(selectedFinding.severity)} className="mt-1">
                      {severityConfig[selectedFinding.severity].icon} {selectedFinding.severity}
                    </Badge>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tool</label>
                    <p className="font-mono text-sm mt-1">{selectedFinding.tool}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <p className="mt-1">{selectedFinding.message}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <p className="font-mono text-sm mt-1">{selectedFinding.location}</p>
                </div>

                {selectedFinding.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="mt-1 text-sm">{selectedFinding.description}</p>
                  </div>
                )}

                {selectedFinding.recommendation && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Recommendation</label>
                    <p className="mt-1 text-sm">{selectedFinding.recommendation}</p>
                  </div>
                )}
              </div>
            )}

            <Dialog.Close className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
```

## Implementation

### Main App Component

```typescript
// src/App.tsx
import { useState, useEffect } from 'preact/hooks'
import { SummaryCards } from '@/components/SummaryCards'
import { FindingsTable } from '@/components/FindingsTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ASHReport } from '@/types/ash'

export default function App() {
  const [data, setData] = useState<ASHReport | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    // Load embedded data or fetch from JSON
    const jsonData = document.getElementById('ash-data')?.textContent
    if (jsonData) {
      try {
        const parsed: ASHReport = JSON.parse(jsonData)
        setData(parsed)
      } catch (error) {
        console.error('Failed to parse ASH data:', error)
      }
    }
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading security report...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">No Data Available</h1>
          <p className="text-gray-600">Unable to load ASH security report data.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ASH Security Report
          </h1>
          <p className="text-gray-600">
            Scan completed: {new Date(data.metadata?.scanDate || Date.now()).toLocaleString()}
          </p>
        </div>

        {/* Summary Cards */}
        <SummaryCards findings={data.findings} />

        {/* Detailed Findings */}
        <Card>
          <CardHeader>
            <CardTitle>Security Findings</CardTitle>
          </CardHeader>
          <CardContent>
            <FindingsTable findings={data.findings} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

### Entry Point with Prerendering

```typescript
// src/index.tsx
import { render, hydrate } from 'preact-iso'
import App from './App'
import './styles/main.css'

const root = document.getElementById('app')

if (typeof window !== 'undefined') {
  hydrate(<App />, root)
}

export async function prerender() {
  const { html } = await render(<App />)

  return {
    html,
    head: {
      lang: 'en',
      title: 'ASH Security Report',
      elements: new Set([
        { type: 'meta', props: { name: 'description', content: 'AWS Automated Security Helper Report' } },
        { type: 'meta', props: { name: 'viewport', content: 'width=device-width, initial-scale=1' } }
      ])
    }
  }
}
```

## Static Generation

### Build Script

```javascript
// scripts/generate-report.js
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const template = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ASH Security Report</title>
  <style>__CSS_PLACEHOLDER__</style>
</head>
<body>
  <div id="app"></div>
  <script id="ash-data" type="application/json">__DATA_PLACEHOLDER__</script>
  <script>__JS_PLACEHOLDER__</script>
</body>
</html>
`

function generateReport(jsonPath, outputPath) {
  const ashData = readFileSync(jsonPath, 'utf-8')
  const distCss = readFileSync(join('dist', 'assets', 'index.css'), 'utf-8')
  const distJs = readFileSync(join('dist', 'assets', 'index.js'), 'utf-8')

  const html = template
    .replace('__DATA_PLACEHOLDER__', ashData)
    .replace('__CSS_PLACEHOLDER__', distCss)
    .replace('__JS_PLACEHOLDER__', distJs)

  writeFileSync(outputPath, html)
  console.log(`Generated report: ${outputPath}`)
}

// Usage
const jsonPath = process.argv[2] || 'aggregated_results.json'
const outputPath = process.argv[3] || 'ash-report.html'
generateReport(jsonPath, outputPath)
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "generate": "npm run build && node scripts/generate-report.js"
  }
}
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: ASH Security Report

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  security-scan:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install ASH
        run: |
          curl -sSL https://github.com/aws-samples/automated-security-helper/releases/latest/download/ash-installer.sh | bash
          sudo mv ash /usr/local/bin/

      - name: Run ASH Security Scan
        run: |
          ash --source-dir . --output-dir ash-output --format json

      - name: Generate HTML Report
        run: |
          npm run generate ash-output/aggregated_results.json ash-report.html

      - name: Upload Report Artifact
        uses: actions/upload-artifact@v4
        with:
          name: ash-security-report
          path: ash-report.html

      - name: Comment PR with Report Link
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const { data: artifacts } = await github.rest.actions.listWorkflowRunArtifacts({
              owner: context.repo.owner,
              repo: context.repo.repo,
              run_id: context.runId
            })

            const reportArtifact = artifacts.find(a => a.name === 'ash-security-report')
            const downloadUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}/artifacts/${reportArtifact.id}`

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## 🔒 ASH Security Report\n\n[📊 Download Interactive Report](${downloadUrl})\n\nThis report contains detailed security findings from automated scans.`
            })
```

## Deployment Examples

### Self-Contained HTML

The generated `ash-report.html` is completely self-contained:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>ASH Security Report</title>
    <style>
      /* All Tailwind CSS inlined */
      .container {
        max-width: 1200px;
        margin: 0 auto;
      }
      /* ... */
    </style>
  </head>
  <body>
    <div id="app"></div>
    <script id="ash-data" type="application/json">
      {"findings": [...], "metadata": {...}}
    </script>
    <script>
      // All Preact + components inlined
      // ... compiled JavaScript
    </script>
  </body>
</html>
```

### Static Hosting

Deploy to any static hosting service:

```bash
# Netlify
npx netlify deploy --prod --dir=dist

# Vercel
npx vercel --prod

# AWS S3
aws s3 cp ash-report.html s3://your-bucket/reports/
```

## Best Practices

### Performance Optimization

1. **Bundle Splitting**: Separate vendor code from app code
2. **Tree Shaking**: Remove unused Radix components
3. **CSS Purging**: Tailwind automatically removes unused styles
4. **Compression**: Enable gzip/brotli compression

### Accessibility

1. **Keyboard Navigation**: All Radix components support keyboard interaction
2. **Screen Readers**: ARIA labels and descriptions are built-in
3. **Color Contrast**: Use sufficient contrast ratios for severity indicators
4. **Focus Management**: Proper focus handling in modals and dialogs

### Security Considerations

1. **Content Security Policy**: Implement CSP headers for hosted versions
2. **Data Sanitization**: Escape user data to prevent XSS
3. **HTTPS**: Always serve over HTTPS in production
4. **Access Control**: Implement authentication for sensitive reports

### Maintenance

1. **Version Pinning**: Lock dependency versions for reproducible builds
2. **Regular Updates**: Keep security-related dependencies updated
3. **Testing**: Implement unit tests for critical components
4. **Documentation**: Maintain clear setup and usage documentation

## Conclusion

This comprehensive guide provides a detailed foundation for building interactive ASH security reports using modern web technologies. The guide has been enhanced with extensive reasoning and explanations to help beginners understand every aspect of the implementation process.

### What This Guide Covers

**Technology Stack Understanding:**

- **Preact** offers React-like development with minimal overhead (~4KB vs React's ~45KB)
- **Tailwind CSS v4** provides utility-first styling with excellent performance and CSS-first configuration
- **Radix UI** ensures accessibility and professional component behavior out of the box
- **Static generation** creates portable, self-contained reports perfect for CI/CD integration

**Detailed Implementation Process:**

- **Step-by-step setup** with reasoning behind each configuration choice
- **TypeScript configuration** with enhanced type safety for security-critical applications
- **Component architecture** using modern patterns and best practices
- **UI/UX considerations** specifically tailored for security report consumption
- **Performance optimization** through code splitting and static generation
- **CI/CD integration** with practical examples and deployment strategies

### Key Benefits of This Approach

**For Beginners:**

- **Comprehensive explanations** of why each technology choice was made
- **Code examples** with detailed comments and reasoning
- **Common pitfalls** and their solutions
- **Best practices** from real-world implementations
- **Progressive learning** from basic concepts to advanced patterns

**For Production Use:**

- **Enterprise-ready** accessibility and security features
- **Portable artifacts** that work in any environment
- **Scalable architecture** that can handle large datasets
- **Maintainable codebase** with clear separation of concerns
- **Performance-optimized** for fast loading and smooth interactions

**For DevOps Teams:**

- **CI/CD friendly** static generation process
- **No server dependencies** for deployment
- **Easy integration** with existing pipelines
- **Version control friendly** with clear artifact generation
- **Flexible deployment** options from simple file hosting to CDN distribution

### Enhanced Learning Experience

This guide goes beyond basic implementation to provide:

**Deep Understanding:**

- **Why** each technology was chosen over alternatives
- **How** different components work together
- **What** trade-offs were made and why
- **When** to use different patterns and approaches

**Practical Application:**

- **Real-world examples** based on actual ASH output structures
- **Production-ready** code with proper error handling
- **Scalable patterns** that work for small and large security reports
- **Testing strategies** for ensuring reliability

**Future-Proofing:**

- **Modern web standards** and best practices
- **Maintainable architecture** that can evolve with requirements
- **Extensible design** for adding new features or scanners
- **Performance considerations** for growing datasets

### Next Steps

The resulting HTML artifacts can be easily integrated into any CI/CD pipeline, shared via pull requests, or deployed to static hosting services. The combination of modern tooling, detailed explanations, and static generation ensures fast, accessible, and maintainable security reporting that both beginners and experienced developers can understand and extend.

**Getting Started:**

1. Follow the step-by-step setup process
2. Understand the reasoning behind each configuration
3. Implement the core components with the provided examples
4. Customize the design system for your organization's needs
5. Integrate with your CI/CD pipeline using the provided templates

**Further Learning:**

- Explore the advanced configuration options
- Implement additional security scanners
- Customize the UI for specific use cases
- Optimize performance for larger datasets
- Contribute improvements back to the community

This guide serves as both a practical implementation tutorial and a comprehensive reference for building modern, accessible, and maintainable security reporting tools.
