import { cn } from '../cn'

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
    expect(cn('foo', 'bar', 'baz')).toBe('foo bar baz')
  })

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
    expect(cn('foo', true && 'bar', 'baz')).toBe('foo bar baz')
    expect(cn('foo', undefined, 'baz')).toBe('foo baz')
    expect(cn('foo', null, 'baz')).toBe('foo baz')
  })

  it('merges Tailwind classes correctly', () => {
    // Deve sobrescrever classes conflitantes
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    expect(cn('p-4', 'p-2')).toBe('p-2')
    expect(cn('mt-4 mb-4', 'my-2')).toBe('my-2')
  })

  it('handles arrays of classes', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz')
    expect(cn('foo', ['bar', 'baz'])).toBe('foo bar baz')
  })

  it('handles empty inputs', () => {
    expect(cn()).toBe('')
    expect(cn('')).toBe('')
    expect(cn('', '')).toBe('')
  })

  it('handles duplicate classes', () => {
    // twMerge não remove duplicatas exatas, apenas conflitos do Tailwind
    expect(cn('foo foo bar')).toBe('foo foo bar')
    expect(cn('foo', 'foo', 'bar')).toBe('foo foo bar')
  })

  it('handles complex Tailwind merging', () => {
    expect(
      cn(
        'px-2 py-1 bg-red-500 hover:bg-red-600',
        'p-3 bg-blue-500',
      ),
    ).toBe('hover:bg-red-600 p-3 bg-blue-500')
  })

  it('preserves non-conflicting classes', () => {
    expect(
      cn(
        'text-lg font-bold text-red-500',
        'text-blue-500 underline',
      ),
    ).toBe('text-lg font-bold text-blue-500 underline')
  })
})