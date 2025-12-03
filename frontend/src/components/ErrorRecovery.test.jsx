import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DuckGenerator from './DuckGenerator'
import * as api from '../api/duck-generator-api'

// Mock the API
vi.mock('../api/duck-generator-api')

/**
 * Error Recovery Flow Tests
 * 
 * Tests comprehensive error handling scenarios including:
 * - Timeout handling
 * - Network errors
 * - Error recovery flows
 * - Duck-themed error messaging
 */
describe('DuckGenerator - Error Recovery Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('handles timeout errors with duck-themed message', async () => {
    // Mock API to simulate timeout
    vi.mocked(api.quackHatchDuck).mockRejectedValue(
      new Error('Quack! Your duck is taking too long to hatch. Please try again.')
    )

    const user = userEvent.setup()
    const { container } = render(<DuckGenerator />)

    const input = container.querySelector('input')
    const generateButton = container.querySelectorAll('button')[0]

    // Enter prompt and generate
    await user.click(input)
    await user.paste('a cool duck')
    await user.click(generateButton)

    // Wait for error to appear
    await waitFor(() => {
      const errorDiv = container.querySelector('.error')
      expect(errorDiv).toBeTruthy()
      expect(errorDiv.textContent).toContain('taking too long')
      expect(errorDiv.textContent).toContain('Quack')
    }, { timeout: 1000 })
  })

  it('handles network errors with duck-themed message', async () => {
    // Mock API to simulate network error
    vi.mocked(api.quackHatchDuck).mockRejectedValue(
      new Error('Quack! The pond is a bit choppy right now. Please waddle back and try again.')
    )

    const user = userEvent.setup()
    const { container } = render(<DuckGenerator />)

    const input = container.querySelector('input')
    const generateButton = container.querySelectorAll('button')[0]

    // Enter prompt and generate
    await user.click(input)
    await user.paste('a duck in space')
    await user.click(generateButton)

    // Wait for error to appear
    await waitFor(() => {
      const errorDiv = container.querySelector('.error')
      expect(errorDiv).toBeTruthy()
      expect(errorDiv.textContent).toContain('pond')
      expect(errorDiv.textContent).toContain('Quack')
    }, { timeout: 1000 })
  })

  it('allows retry after error', async () => {
    const user = userEvent.setup()
    const { container } = render(<DuckGenerator />)

    // First attempt fails
    vi.mocked(api.quackHatchDuck).mockRejectedValueOnce(
      new Error('Quack! Something went wrong.')
    )

    const input = container.querySelector('input')
    const generateButton = container.querySelectorAll('button')[0]

    // First generation attempt
    await user.click(input)
    await user.paste('a duck')
    await user.click(generateButton)

    // Wait for error
    await waitFor(() => {
      const errorDiv = container.querySelector('.error')
      expect(errorDiv).toBeTruthy()
    }, { timeout: 1000 })

    // Second attempt succeeds
    vi.mocked(api.quackHatchDuck).mockResolvedValueOnce({
      success: true,
      image: 'data:image/png;base64,testdata',
      message: 'Duck ready!'
    })

    // Retry generation
    await user.click(generateButton)

    // Wait for success
    await waitFor(() => {
      const errorDiv = container.querySelector('.error')
      expect(errorDiv).toBeFalsy()
      
      const duckDisplay = container.querySelector('.duck-display')
      expect(duckDisplay).toBeTruthy()
    }, { timeout: 1000 })
  })

  it('displays fallback duck when is_fallback is true', async () => {
    // Mock API to return fallback duck
    vi.mocked(api.quackHatchDuck).mockResolvedValue({
      success: true,
      image: 'data:image/png;base64,fallbackdata',
      message: 'Quack! Here\'s a pre-made duck for you!',
      is_fallback: true
    })

    const user = userEvent.setup()
    const { container } = render(<DuckGenerator />)

    const input = container.querySelector('input')
    const generateButton = container.querySelectorAll('button')[0]

    // Generate duck
    await user.click(input)
    await user.paste('a duck')
    await user.click(generateButton)

    // Wait for fallback duck to appear
    await waitFor(() => {
      const duckDisplay = container.querySelector('.duck-display')
      expect(duckDisplay).toBeTruthy()
      
      const message = duckDisplay.querySelector('.message')
      expect(message.textContent).toContain('pre-made')
      
      const img = duckDisplay.querySelector('img')
      expect(img).toBeTruthy()
      expect(img.src).toContain('fallbackdata')
    }, { timeout: 1000 })
  })

  it('handles empty input with duck-themed error', async () => {
    const user = userEvent.setup()
    const { container } = render(<DuckGenerator />)

    const input = container.querySelector('input')
    const generateButton = container.querySelectorAll('button')[0]

    // Button should be disabled when input is empty
    expect(generateButton).toBeDisabled()
    
    // Enter whitespace-only input
    await user.click(input)
    await user.paste('   ')
    
    // Button should still be disabled for whitespace-only input
    expect(generateButton).toBeDisabled()
  })

  it('handles input exceeding character limit', async () => {
    const user = userEvent.setup()
    const { container } = render(<DuckGenerator />)

    const input = container.querySelector('input')
    const generateButton = container.querySelectorAll('button')[0]

    // Enter text exceeding 1024 characters
    const longText = 'a'.repeat(1025)
    await user.click(input)
    await user.paste(longText)
    await user.click(generateButton)

    // Wait for error
    await waitFor(() => {
      const errorDiv = container.querySelector('.error')
      expect(errorDiv).toBeTruthy()
      expect(errorDiv.textContent).toContain('Quack')
      expect(errorDiv.textContent).toContain('1024')
    }, { timeout: 500 })
  })

  it('clears error when starting new generation after error', async () => {
    const user = userEvent.setup()
    const { container } = render(<DuckGenerator />)

    // First attempt fails
    vi.mocked(api.quackHatchDuck).mockRejectedValueOnce(
      new Error('Quack! Error occurred.')
    )

    const input = container.querySelector('input')
    const generateButton = container.querySelectorAll('button')[0]

    // First generation
    await user.click(input)
    await user.paste('duck 1')
    await user.click(generateButton)

    // Wait for error
    await waitFor(() => {
      const errorDiv = container.querySelector('.error')
      expect(errorDiv).toBeTruthy()
    }, { timeout: 1000 })

    // Second attempt succeeds
    vi.mocked(api.quackHatchDuck).mockResolvedValueOnce({
      success: true,
      image: 'data:image/png;base64,test',
      message: 'Duck ready!'
    })

    // Clear and enter new prompt
    await user.clear(input)
    await user.paste('duck 2')
    await user.click(generateButton)

    // Error should clear immediately when new generation starts
    await waitFor(() => {
      const errorDiv = container.querySelector('.error')
      expect(errorDiv).toBeFalsy()
    }, { timeout: 500 })
  })

  it('maintains input field editability during errors', async () => {
    const user = userEvent.setup()
    const { container } = render(<DuckGenerator />)

    // Mock error
    vi.mocked(api.quackHatchDuck).mockRejectedValue(
      new Error('Quack! Error.')
    )

    const input = container.querySelector('input')
    const generateButton = container.querySelectorAll('button')[0]

    // Generate and get error
    await user.click(input)
    await user.paste('duck')
    await user.click(generateButton)

    // Wait for error
    await waitFor(() => {
      const errorDiv = container.querySelector('.error')
      expect(errorDiv).toBeTruthy()
    }, { timeout: 1000 })

    // Input should still be editable
    expect(input).not.toBeDisabled()
    
    // Should be able to modify input
    await user.clear(input)
    await user.paste('new duck')
    expect(input.value).toBe('new duck')
  })

  it('shows error icon in error messages', async () => {
    const user = userEvent.setup()
    const { container } = render(<DuckGenerator />)

    // Mock error
    vi.mocked(api.quackHatchDuck).mockRejectedValue(
      new Error('Quack! Error.')
    )

    const input = container.querySelector('input')
    const generateButton = container.querySelectorAll('button')[0]

    // Generate and get error
    await user.click(input)
    await user.paste('duck')
    await user.click(generateButton)

    // Wait for error with icon
    await waitFor(() => {
      const errorDiv = container.querySelector('.error')
      expect(errorDiv).toBeTruthy()
      
      const errorIcon = errorDiv.querySelector('.error-icon')
      expect(errorIcon).toBeTruthy()
      expect(errorIcon.textContent).toBe('🦆')
    }, { timeout: 1000 })
  })

  it('error messages have proper ARIA attributes', async () => {
    const user = userEvent.setup()
    const { container } = render(<DuckGenerator />)

    // Mock error
    vi.mocked(api.quackHatchDuck).mockRejectedValue(
      new Error('Quack! Error.')
    )

    const input = container.querySelector('input')
    const generateButton = container.querySelectorAll('button')[0]

    // Generate and get error
    await user.click(input)
    await user.paste('duck')
    await user.click(generateButton)

    // Wait for error with ARIA attributes
    await waitFor(() => {
      const errorDiv = container.querySelector('.error')
      expect(errorDiv).toBeTruthy()
      expect(errorDiv.getAttribute('role')).toBe('alert')
      expect(errorDiv.getAttribute('aria-live')).toBe('assertive')
      expect(errorDiv.getAttribute('aria-atomic')).toBe('true')
    }, { timeout: 1000 })
  })
})
