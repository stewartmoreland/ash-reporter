import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../utils'
import { Header } from '../../components/Header'

// Mock preact-iso
const mockLocation = { url: '/' }
vi.mock('preact-iso', () => ({
  useLocation: () => mockLocation
}))

describe('Header', () => {
  describe('Basic Rendering', () => {
    it('renders navigation header', () => {
      render(<Header />)
      
      expect(screen.getByRole('banner')).toBeInTheDocument()
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('renders Home link', () => {
      render(<Header />)
      
      const homeLink = screen.getByRole('link', { name: 'Home' })
      expect(homeLink).toBeInTheDocument()
      expect(homeLink).toHaveAttribute('href', '/')
    })

    it('renders 404 link', () => {
      render(<Header />)
      
      const notFoundLink = screen.getByRole('link', { name: '404' })
      expect(notFoundLink).toBeInTheDocument()
      expect(notFoundLink).toHaveAttribute('href', '/404')
    })
  })

  describe('Active Link Highlighting', () => {
    it('applies active class to Home link when on home page', () => {
      mockLocation.url = '/'
      render(<Header />)
      
      const homeLink = screen.getByRole('link', { name: 'Home' })
      expect(homeLink).toHaveClass('active')
      
      const notFoundLink = screen.getByRole('link', { name: '404' })
      expect(notFoundLink).not.toHaveClass('active')
    })

    it('applies active class to 404 link when on 404 page', () => {
      mockLocation.url = '/404'
      render(<Header />)
      
      const homeLink = screen.getByRole('link', { name: 'Home' })
      expect(homeLink).not.toHaveClass('active')
      
      const notFoundLink = screen.getByRole('link', { name: '404' })
      expect(notFoundLink).toHaveClass('active')
    })

    it('does not apply active class when on different page', () => {
      mockLocation.url = '/some-other-page'
      render(<Header />)
      
      const homeLink = screen.getByRole('link', { name: 'Home' })
      expect(homeLink).not.toHaveClass('active')
      
      const notFoundLink = screen.getByRole('link', { name: '404' })
      expect(notFoundLink).not.toHaveClass('active')
    })
  })

  describe('Navigation Structure', () => {
    it('has correct HTML structure', () => {
      render(<Header />)
      
      const header = screen.getByRole('banner')
      const nav = screen.getByRole('navigation')
      
      expect(header).toContainElement(nav)
      expect(nav).toContainElement(screen.getByRole('link', { name: 'Home' }))
      expect(nav).toContainElement(screen.getByRole('link', { name: '404' }))
    })

    it('renders exactly two navigation links', () => {
      render(<Header />)
      
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(2)
    })
  })
}) 