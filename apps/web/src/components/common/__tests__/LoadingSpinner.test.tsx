import { render, screen } from '@testing-library/react'
import { LoadingSpinner } from '../LoadingSpinner'

describe('LoadingSpinner Component', () => {
  it('renders loading spinner', () => {
    render(<LoadingSpinner />)
    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
  })

  it('has accessible aria-label', () => {
    render(<LoadingSpinner />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveAttribute('aria-label', 'Loading')
  })

  it('applies correct size classes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />)
    let spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('h-4', 'w-4')

    rerender(<LoadingSpinner size="md" />)
    spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('h-8', 'w-8')

    rerender(<LoadingSpinner size="lg" />)
    spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('h-12', 'w-12')
  })

  it('applies custom className', () => {
    render(<LoadingSpinner className="custom-spinner" />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('custom-spinner')
  })

  it('has animation class', () => {
    render(<LoadingSpinner />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('animate-spin')
  })

  it('uses default size when not specified', () => {
    render(<LoadingSpinner />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('h-8', 'w-8')
  })
})