import { describe, it, expect } from 'vitest'
import { render, screen } from '../utils'
import { NotFound } from '../../pages/_404'

describe('NotFound', () => {
  describe('Basic Rendering', () => {
    it('renders 404 heading', () => {
      render(<NotFound />)
      
      expect(screen.getByRole('heading', { name: '404: Not Found' })).toBeInTheDocument()
    })

    it('renders error message', () => {
      render(<NotFound />)
      
      expect(screen.getByText("It's gone :(")).toBeInTheDocument()
    })

    it('has correct HTML structure', () => {
      render(<NotFound />)
      
      // section elements don't have "region" role by default in testing library
      const container = screen.getByText("It's gone :(").closest('section')
      expect(container).toBeInTheDocument()
      
      const heading = screen.getByRole('heading', { name: '404: Not Found' })
      const message = screen.getByText("It's gone :(")
      
      expect(container).toContainElement(heading)
      expect(container).toContainElement(message)
    })
  })

  describe('Content Verification', () => {
    it('displays correct 404 status code', () => {
      render(<NotFound />)
      
      expect(screen.getByText('404: Not Found')).toBeInTheDocument()
    })

    it('has accessible heading level', () => {
      render(<NotFound />)
      
      const heading = screen.getByRole('heading', { name: '404: Not Found' })
      expect(heading.tagName).toBe('H1')
    })

    it('renders all expected text content', () => {
      render(<NotFound />)
      
      expect(screen.getByText('404: Not Found')).toBeInTheDocument()
      expect(screen.getByText("It's gone :(")).toBeInTheDocument()
    })
  })
}) 