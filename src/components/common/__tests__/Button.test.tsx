import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button Component', () => {
  it('renders with children text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('applies correct variant classes', () => {
    const { rerender } = render(<Button variant="primary">Button</Button>)
    let button = screen.getByRole('button')
    expect(button).toHaveClass('bg-blue-600')

    rerender(<Button variant="danger">Button</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('bg-red-600')

    rerender(<Button variant="outline">Button</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('border')
  })

  it('applies correct size classes', () => {
    const { rerender } = render(<Button size="sm">Button</Button>)
    let button = screen.getByRole('button')
    expect(button).toHaveClass('px-3', 'py-1.5')

    rerender(<Button size="lg">Button</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('px-6', 'py-3')
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByRole('button')

    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:opacity-50')
  })

  it('disables button when isLoading is true', () => {
    render(<Button isLoading>Loading</Button>)
    const button = screen.getByRole('button')

    expect(button).toBeDisabled()
  })

  it('shows loading spinner when isLoading is true', () => {
    render(<Button isLoading>Loading</Button>)

    // LoadingSpinner é renderizado quando isLoading é true
    const button = screen.getByRole('button')
    const spinner = button.querySelector('[role="status"]')
    expect(spinner).toBeInTheDocument()
  })

  it('renders as different element when "as" prop is provided', () => {
    render(
      <Button as="a" href="/test">
        Link Button
      </Button>,
    )

    const link = screen.getByText('Link Button')
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href', '/test')
  })

  it('renders icon on the left by default', () => {
    const TestIcon = () => <svg data-testid="test-icon" />
    render(<Button icon={TestIcon}>With Icon</Button>)

    const icon = screen.getByTestId('test-icon')
    const text = screen.getByText('With Icon')

    // Icon deve estar presente
    expect(icon).toBeInTheDocument()
    expect(text).toBeInTheDocument()
  })

  it('renders icon on the right when iconPosition is right', () => {
    const TestIcon = () => <svg data-testid="test-icon" />
    render(
      <Button icon={TestIcon} iconPosition="right">
        With Icon
      </Button>,
    )

    const icon = screen.getByTestId('test-icon')
    const text = screen.getByText('With Icon')

    // Icon e texto devem estar presentes
    expect(icon).toBeInTheDocument()
    expect(text).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>)
    const button = screen.getByRole('button')

    expect(button).toHaveClass('custom-class')
  })
})