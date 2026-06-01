import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ExpiryBadge } from '@/components/domain/ExpiryBadge'

const NOW = new Date()
const inDays = (n: number) => new Date(NOW.getTime() + n * 86_400_000).toISOString().slice(0, 10)

describe('ExpiryBadge', () => {
  it('renders a text label (never colour alone) for each state', () => {
    const { rerender } = render(<ExpiryBadge date={inDays(120)} />)
    expect(screen.getByText('Valid')).toBeInTheDocument()

    rerender(<ExpiryBadge date={inDays(10)} />)
    expect(screen.getByText('Expiring soon')).toBeInTheDocument()

    rerender(<ExpiryBadge date={inDays(-5)} />)
    expect(screen.getByText('Expired')).toBeInTheDocument()
  })

  it('renders a dash for missing dates', () => {
    render(<ExpiryBadge date={null} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
