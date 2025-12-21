import { formatDate, formatDateOnly, formatRelativeTime, isValidDate } from '../date'

describe('date utilities', () => {
  // Mock da data atual para testes consistentes
  const mockDate = new Date('2024-01-15T10:30:00')

  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(mockDate)
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  describe('formatDate', () => {
    it('formats date with time correctly', () => {
      const date = new Date('2024-01-15T14:30:00')
      const result = formatDate(date)
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}.*\d{2}:\d{2}/)
    })

    it('formats date string correctly', () => {
      const result = formatDate('2024-01-15')
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}.*\d{2}:\d{2}/)
    })

    it('returns dash for invalid date', () => {
      expect(formatDate('')).toBe('-')
      expect(formatDate(null as any)).toBe('-')
      expect(formatDate(undefined as any)).toBe('-')
    })
  })

  describe('formatDateOnly', () => {
    it('formats date without time correctly', () => {
      const date = new Date('2024-01-15T14:30:00')
      const result = formatDateOnly(date)
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    })

    it('formats date string correctly', () => {
      const result = formatDateOnly('2024-01-15')
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    })

    it('returns dash for invalid date', () => {
      expect(formatDateOnly('')).toBe('-')
      expect(formatDateOnly(null as any)).toBe('-')
    })
  })

  describe('formatRelativeTime', () => {
    it('formats "agora" for current time', () => {
      expect(formatRelativeTime(mockDate)).toBe('agora')
    })

    it('formats minutes ago', () => {
      const fiveMinutesAgo = new Date(mockDate.getTime() - 5 * 60 * 1000)
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('há 5 min')
    })

    it('formats hours ago', () => {
      const twoHoursAgo = new Date(mockDate.getTime() - 2 * 60 * 60 * 1000)
      expect(formatRelativeTime(twoHoursAgo)).toBe('há 2h')
    })

    it('formats days ago', () => {
      const threeDaysAgo = new Date(mockDate.getTime() - 3 * 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(threeDaysAgo)).toBe('há 3 dias')
    })

    it('returns dash for invalid date', () => {
      expect(formatRelativeTime('')).toBe('-')
      expect(formatRelativeTime(null)).toBe('-')
    })
  })

  describe('isValidDate', () => {
    it('returns true for valid dates', () => {
      expect(isValidDate(mockDate)).toBe(true)
      expect(isValidDate('2024-01-15')).toBe(true)
      expect(isValidDate(new Date('2024-01-15T23:59:59'))).toBe(true)
    })

    it('returns false for invalid dates', () => {
      expect(isValidDate('')).toBe(false)
      expect(isValidDate(null)).toBe(false)
      expect(isValidDate(undefined)).toBe(false)
      expect(isValidDate('invalid')).toBe(false)
    })
  })
})