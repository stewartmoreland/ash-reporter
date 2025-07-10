# ASH Security Reporter

A modern, interactive web-based report generator for AWS Automated Security Helper (ASH) findings. This project transforms ASH JSON output into beautiful, self-contained HTML reports that can be easily shared, viewed offline, and integrated into CI/CD pipelines.

## Overview

AWS Automated Security Helper (ASH) is a tool that runs multiple security scanners (git-secrets, Bandit, Semgrep, Grype, CDK-nag, etc.) and outputs aggregated JSON reports. While powerful, these JSON files are difficult for developers to consume and share.

This project solves that problem by creating:
- **Interactive HTML reports** with filtering, searching, and detailed views
- **Self-contained artifacts** that work offline and require no server infrastructure
- **Mobile-responsive design** that works on any device
- **Accessible interface** meeting enterprise accessibility standards
- **CI/CD integration** for automated report generation

## Technology Stack

- **[Preact](https://preactjs.com/)** - Fast 3kB React alternative
- **[Tailwind CSS v4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Vite](https://vitejs.dev/)** - Lightning-fast build tool

## Prerequisites

- **Node.js** 18+ and npm/yarn
- **ASH CLI** (for generating security scan data)
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd ash-reporter
npm install
```

### 2. Generate Sample Report

The project includes sample ASH data for testing:

```bash
# Build the application
npm run build

# Generate HTML report from sample data
npm run generate

# Open the generated report
open ash-security-report.html
```

### 3. Generate Report from Your ASH Data

```bash
# First, run ASH on your project
ash --source-dir /path/to/your/project --output-dir ash-output --format json

# Generate interactive HTML report
npm run generate ash-output/aggregated_results.json my-security-report.html

# View your report
open my-security-report.html
```

## Detailed Usage

### Installing ASH (if not already installed)

```bash
# Install ASH CLI
curl -sSL https://github.com/aws-samples/automated-security-helper/releases/latest/download/ash-installer.sh | bash

# Verify installation
ash --version
```

### Generating ASH Security Data

```bash
# Run ASH scan on your project
ash --source-dir . \
    --output-dir ash-scan-results \
    --format json \
    --verbose

# This creates: ash-scan-results/aggregated_results.json
```

### Building and Generating Reports

```bash
# Development server (for customizing the UI)
npm run dev

# Production build
npm run build

# Generate standalone HTML report
npm run generate [input-json] [output-html]

# Examples:
npm run generate                                          # Uses sample data
npm run generate my-ash-data.json                       # Custom input, default output
npm run generate my-ash-data.json custom-report.html    # Custom input and output
```

### Report Generation Script Options

The `generate-report.js` script accepts the following parameters:

```bash
node scripts/generate-report.js [ASH_JSON_FILE] [OUTPUT_HTML_FILE]
```

- **ASH_JSON_FILE** (optional): Path to ASH aggregated results JSON file
  - Default: `sample-ash-data.json`
- **OUTPUT_HTML_FILE** (optional): Output path for generated HTML report
  - Default: `ash-security-report.html`

## Report Features

### 📊 Dashboard Overview
- **Summary cards** showing counts by severity level (Critical, High, Medium, Low)
- **Visual indicators** with color-coded severity badges
- **Scan metadata** including date, duration, and tools used

### 🔍 Interactive Findings Table
- **Filter by severity** using toggle buttons
- **Filter by tool** with tab navigation (All Tools, Grype, git-secrets, Semgrep, etc.)
- **Sortable columns** for easy organization
- **Search functionality** across all findings

### 📱 Responsive Design
- **Mobile-optimized** layout that works on all screen sizes
- **Touch-friendly** interactions for mobile devices
- **Print-friendly** CSS for hard copy reports

### ♿ Accessibility Features
- **WCAG 2.1 compliant** with proper contrast ratios
- **Keyboard navigation** for all interactive elements
- **Screen reader support** with semantic HTML and ARIA labels
- **Focus management** for modal dialogs and complex interactions

### 🔗 Self-Contained Reports
- **No external dependencies** - works offline
- **Single HTML file** - easy to share via email or chat
- **Embedded assets** - CSS and JavaScript inlined for portability

## Project Structure

```
ash-reporter/
├── src/
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   │   ├── badge.tsx       # Severity badges
│   │   │   └── card.tsx        # Card layouts
│   │   ├── FindingsTable.tsx   # Interactive findings table
│   │   ├── Header.tsx          # Report header
│   │   └── SummaryCards.tsx    # Dashboard summary cards
│   ├── types/
│   │   └── ash.ts              # TypeScript interfaces for ASH data
│   ├── lib/
│   │   └── utils.ts            # Utility functions and styling
│   ├── App.tsx                 # Main application component
│   ├── index.tsx               # Application entry point
│   └── style.css               # Global styles and Tailwind imports
├── scripts/
│   └── generate-report.js      # HTML report generation script
├── docs/
│   ├── guide.md                # Comprehensive implementation guide
│   └── implementation-guide.md # Technical details
├── sample-ash-data.json        # Sample ASH data for testing
├── package.json
├── vite.config.ts              # Build configuration
└── tsconfig.json               # TypeScript configuration
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Security Report Generation

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  security-scan-and-report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install ASH Reporter Dependencies
        working-directory: ./ash-reporter
        run: npm ci
      
      - name: Install ASH CLI
        run: |
          curl -sSL https://github.com/aws-samples/automated-security-helper/releases/latest/download/ash-installer.sh | bash
          sudo mv ash /usr/local/bin/
      
      - name: Run ASH Security Scan
        run: ash --source-dir . --output-dir ash-results --format json
      
      - name: Generate Security Report
        working-directory: ./ash-reporter
        run: |
          npm run build
          npm run generate ../ash-results/aggregated_results.json security-report.html
      
      - name: Upload Security Report
        uses: actions/upload-artifact@v4
        with:
          name: security-report
          path: ash-reporter/security-report.html
          retention-days: 30
```

### Jenkins Pipeline Example

```groovy
pipeline {
    agent any
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                dir('ash-reporter') {
                    sh 'npm ci'
                }
            }
        }
        
        stage('Security Scan') {
            steps {
                sh '''
                    # Install ASH if not available
                    if ! command -v ash &> /dev/null; then
                        curl -sSL https://github.com/aws-samples/automated-security-helper/releases/latest/download/ash-installer.sh | bash
                        sudo mv ash /usr/local/bin/
                    fi
                    
                    # Run security scan
                    ash --source-dir . --output-dir ash-results --format json
                '''
            }
        }
        
        stage('Generate Report') {
            steps {
                dir('ash-reporter') {
                    sh '''
                        npm run build
                        npm run generate ../ash-results/aggregated_results.json security-report.html
                    '''
                }
            }
        }
        
        stage('Archive Report') {
            steps {
                archiveArtifacts artifacts: 'ash-reporter/security-report.html', fingerprint: true
            }
        }
    }
}
```

## Development

### Development Server

```bash
# Start development server with hot reload
npm run dev

# Open http://localhost:5173 to view the application
```

### Building for Production

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

### Customizing the Report

The report can be customized by modifying the components in `src/components/`:

- **SummaryCards.tsx** - Modify dashboard overview cards
- **FindingsTable.tsx** - Customize the findings table and filtering
- **ui/badge.tsx** - Adjust severity badge styling
- **ui/card.tsx** - Modify card layouts

### Styling

The project uses Tailwind CSS v4 for styling. Customize the design system in `src/style.css`:

```css
@theme {
  /* Customize severity colors */
  --color-critical: #dc2626;
  --color-high: #ea580c;
  --color-medium: #d97706;
  --color-low: #16a34a;
  
  /* Adjust spacing and borders */
  --border-radius: 0.5rem;
}
```

## Troubleshooting

### Common Issues

**1. Import Resolution Errors**
```bash
# Error: Failed to resolve import "@/lib/utils"
# Solution: Ensure TypeScript path mapping is configured in tsconfig.json

{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**2. Build Errors with Vite**
```bash
# Error: Multiple inputs not supported with inline dynamic imports
# Solution: Ensure prerendering is disabled for bundle generation

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        format: 'iife',
        name: 'ASHReporter'
      }
    }
  }
})
```

**3. ASH Data Format Issues**
```bash
# Error: Cannot read property 'findings' of undefined
# Solution: Ensure ASH JSON file has the correct structure

{
  "findings": [...],
  "metadata": {
    "scanDate": "...",
    "totalFindings": 0,
    "tools": [...]
  }
}
```

### Support

- 📖 **Detailed Guide**: See `docs/guide.md` for comprehensive implementation details
- 🐛 **Issues**: Report bugs and feature requests in the project issues
- 💬 **Discussions**: Join project discussions for questions and feedback

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- **AWS Automated Security Helper** - The security scanning tool this project enhances
- **Preact Team** - For the lightweight React alternative
- **Tailwind CSS** - For the excellent utility-first CSS framework
- **Radix UI** - For accessible component primitives
