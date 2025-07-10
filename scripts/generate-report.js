import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join } from 'path'

// Template for the self-contained HTML report
const template = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ASH Security Report</title>__CSS_SECTION__
</head>
<body>
  <div id="app"></div>
  <script id="ash-data" type="application/json">__ASH_DATA__</script>
  <script>
__JS_CONTENT__
  </script>
</body>
</html>`

function findAssetFiles() {
  const assetsDir = join(process.cwd(), 'dist', 'assets')
  const files = readdirSync(assetsDir)
  
  const cssFile = files.find(file => file.endsWith('.css'))
  const jsFile = files.find(file => file.endsWith('.js'))
  
  if (!jsFile) {
    throw new Error(`Missing JavaScript bundle: ${files.join(', ')}`)
  }
  
  return {
    css: cssFile ? join(assetsDir, cssFile) : null,
    js: join(assetsDir, jsFile)
  }
}

function generateReport(ashDataPath, outputPath) {
  console.log('🔍 Finding built assets...')
  const assets = findAssetFiles()
  
  console.log('📄 Found assets:')
  console.log(`  JS: ${assets.js}`)
  if (assets.css) {
    console.log(`  CSS: ${assets.css}`)
  } else {
    console.log('  CSS: Inlined in JavaScript bundle')
  }
  
  console.log('📖 Reading ASH data...')
  const ashData = readFileSync(ashDataPath, 'utf-8')
  
  console.log('📜 Reading JavaScript...')
  const jsContent = readFileSync(assets.js, 'utf-8')
  
  // Handle CSS - either separate file or inlined
  let cssSection = ''
  if (assets.css) {
    console.log('🎨 Reading CSS...')
    const cssContent = readFileSync(assets.css, 'utf-8')
    cssSection = `
  <style>
${cssContent}
  </style>`
  }
  
  console.log('🔧 Generating HTML report...')
  const html = template
    .replace('__ASH_DATA__', ashData)
    .replace('__CSS_SECTION__', cssSection)
    .replace('__JS_CONTENT__', jsContent)
  
  console.log('💾 Writing report file...')
  writeFileSync(outputPath, html, 'utf-8')
  
  console.log(`✅ Successfully generated: ${outputPath}`)
  console.log(`📊 Report size: ${Math.round(html.length / 1024)}KB`)
}

// Command line usage
if (process.argv.length < 3) {
  console.log('Usage: node generate-report.js <ash-data.json> [output.html]')
  console.log('Example: node generate-report.js sample-ash-data.json ash-report.html')
  process.exit(1)
}

const ashDataPath = process.argv[2]
const outputPath = process.argv[3] || 'ash-security-report.html'

try {
  generateReport(ashDataPath, outputPath)
} catch (error) {
  console.error('❌ Error generating report:', error.message)
  process.exit(1)
} 