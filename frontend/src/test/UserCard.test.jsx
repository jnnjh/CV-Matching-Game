import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { UserCard } from '../components/UserCard'

// Unit test for a single component.
// Test what the user sees – not implementation details.
describe('UserCard', () => {
  it('renders the name and role', () => {
    render(<UserCard name="Alice García" role="Frontend Developer" />)

    expect(screen.getByText('Alice García')).toBeInTheDocument()
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument()
  })

  it('renders different props correctly', () => {
    render(<UserCard name="Bob Mwangi" role="Backend Developer" />)

    expect(screen.getByText('Bob Mwangi')).toBeInTheDocument()
    expect(screen.getByText('Backend Developer')).toBeInTheDocument()
  })
})
