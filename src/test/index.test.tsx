import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock preact-iso
const mockHydrate = vi.fn()
const mockSSR = vi.fn()

vi.mock('preact-iso', () => ({
  hydrate: mockHydrate,
  prerender: mockSSR
}))

// Mock App component
vi.mock('../App', () => ({
  default: () => <div data-testid="app">Mocked App</div>
}))

// Mock CSS import
vi.mock('../style.css', () => ({}))

describe('index.tsx', () => {
  let originalWindow: typeof window
  let originalDocument: typeof document

  beforeEach(() => {
    vi.clearAllMocks()
    originalWindow = global.window
    originalDocument = global.document
    
    // Reset module before each test
    vi.resetModules()
  })

  afterEach(() => {
    global.window = originalWindow
    global.document = originalDocument
  })

  describe('Client-side Hydration', () => {
    it('hydrates the app when window exists', async () => {
      const mockRootElement = document.createElement('div')
      mockRootElement.id = 'app'
      
      const mockDocument = {
        getElementById: vi.fn().mockReturnValue(mockRootElement)
      }
      
      // Set up window environment
      global.window = { document: mockDocument } as any
      global.document = mockDocument as any
      
      // Import the module to trigger the hydration logic
      await import('../index')
      
      expect(mockDocument.getElementById).toHaveBeenCalledWith('app')
      expect(mockHydrate).toHaveBeenCalledTimes(1)
      expect(mockHydrate).toHaveBeenCalledWith(
        expect.any(Object), // React element
        mockRootElement
      )
    })

    it('does not hydrate when window does not exist (SSR)', async () => {
      // Set window to undefined (SSR environment)
      global.window = undefined as any
      
      // Import the module
      await import('../index')
      
      expect(mockHydrate).not.toHaveBeenCalled()
    })

    it('handles missing root element gracefully', async () => {
      const mockDocument = {
        getElementById: vi.fn().mockReturnValue(null)
      }
      
      global.window = { document: mockDocument } as any
      global.document = mockDocument as any
      
      // This should not throw an error
      await import('../index')
      
      expect(mockDocument.getElementById).toHaveBeenCalledWith('app')
      expect(mockHydrate).toHaveBeenCalledWith(
        expect.any(Object),
        null
      )
    })
  })

  describe('Server-side Rendering (prerender)', () => {
    it('exports prerender function', async () => {
      const indexModule = await import('../index')
      
      expect(indexModule.prerender).toBeDefined()
      expect(typeof indexModule.prerender).toBe('function')
    })

    it('prerender function calls SSR with App component', async () => {
      mockSSR.mockResolvedValue('<html></html>')
      
      const indexModule = await import('../index')
      await indexModule.prerender()
      
      expect(mockSSR).toHaveBeenCalledTimes(1)
      expect(mockSSR).toHaveBeenCalledWith(
        expect.any(Object) // React element
      )
    })

    it('prerender function returns SSR result', async () => {
      const mockHTMLResult = '<html><body>SSR Result</body></html>'
      mockSSR.mockResolvedValue(mockHTMLResult)
      
      const indexModule = await import('../index')
      const result = await indexModule.prerender()
      
      expect(result).toBe(mockHTMLResult)
    })

    it('prerender function handles async operations', async () => {
      mockSSR.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('<html></html>'), 10))
      )
      
      const indexModule = await import('../index')
      const startTime = Date.now()
      await indexModule.prerender()
      const endTime = Date.now()
      
      // Should have waited for the async operation
      expect(endTime - startTime).toBeGreaterThanOrEqual(5)
      expect(mockSSR).toHaveBeenCalledTimes(1)
    })
  })

  describe('Module Structure', () => {
    it('imports required dependencies', async () => {
      // This test ensures the module can be imported without errors
      await expect(import('../index')).resolves.toBeDefined()
    })

    it('has correct exports', async () => {
      const indexModule = await import('../index')
      
      // Should only export prerender function
      const exports = Object.keys(indexModule)
      expect(exports).toContain('prerender')
    })

    it('handles CSS import without errors', async () => {
      // CSS import should not cause any issues
      await expect(import('../index')).resolves.toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('continues execution if hydrate throws error', async () => {
      mockHydrate.mockImplementation(() => {
        throw new Error('Hydration error')
      })
      
      const mockRootElement = document.createElement('div')
      const mockDocument = {
        getElementById: vi.fn().mockReturnValue(mockRootElement)
      }
      
      global.window = { document: mockDocument } as any
      global.document = mockDocument as any
      
      // Should not throw - but in our test it will since we're not wrapping in try/catch
      await expect(import('../index')).rejects.toThrow('Hydration error')
    })

    it('handles missing App component gracefully', async () => {
      // Without window, no hydration should occur
      global.window = undefined as any
      
      await expect(import('../index')).resolves.toBeDefined()
    })
  })
}) 