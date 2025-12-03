import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DuckGenerator from './DuckGenerator'
import * as api from '../api/duck-generator-api'

// Mock the API
vi.mock('../api/duck-generator-api')

/**
 * Integration Tests for Complete User Flows
 * 
 * Tests end-to-end user journeys including:
 * - Complete generation flow: input → generate → display → generate another
 * - Error recovery flow: error → retry → success
 * - Fallback duck system
 */
describe('DuckGenerator - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('complete generation flow: input → generate → display → generate another', async () => {
    const user = userEvent.setup()
    const { container } = render(<DuckGenerator />)

    // Step 1: Initial state - no image, no error
    expect(container.querySelector('.duck-display')).toBeFalsy()
    expect(container.querySelector('.error')).toBeFalsy()
    expect(container.querySelector('.loading')).toBeFalsy()

    // Step 2: User enters description
    const input = container.querySelector('input')
    const generateButton = container.querySelectorAll('button')[0]
    
    expect(generateButton).toBeDisabled() // Button disabled when empty
    
    await user.click(input)
    await user.paste('a duck wearing sunglasses on a beach')
    
    expect(input.value).toBe('a duck wearing sunglasses on a beach')
    expect(generateButton).not.toBeDisabled() // Button enabled with valid input

    // Step 3: User clicks "Generate Duck"
    vi.mocked(api.quackHatchDuck).mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            image: 'data:image/png;base64,firstduckimage',
            message: 'Quack quack! Your duck is ready!'
          })
        }, 100)
      })
    })

    await user.click(generateButton)

    // Step 4: Loading state appears
    await waitFor(() => {
      expect(container.querySelector('.loading')).toBeTruthy()
      expect(generateButton).toBeDisabled()
      expect(generateButton.textContent).toContain('Hatching your duck...')
    }, { timeout: 200 })

    // Step 5: Image displays after generation
    await waitFor(() => {
      const duckDisplay = container.querySelector('.duck-display')
      expect(duckDisplay).toBeTruthy()
      
      const img = duckDisplay.querySelector('img')
      expect(img).toBeTruthy()
      expect(img.src).toContain('firstduckimage')
      expect(img.alt).toBe('Your custom generated duck image based on your description')
      
      const message = duckDisplay.querySelector('.message')
      expect(message.textContent).toBe('Quack quack! Your duck is ready!')
      
      // Loading state should be gone
      expect(container.querySelector('.loading')).toBeFalsy()
      
      // Generate button should be enabled again
      expect(generateButton).not.toBeDisabled()
    }, { timeout: 1000 })

    // Step 6: "Generate Another" button appears
    const buttons = container.querySelectorAll('button')
    const generateAnotherButton = Array.from(buttons).find(btn => 
      btn.textContent.includes('Generate Another')
    )
    expect(generateAnotherButton).toBeTruthy()

    // Step 7: User clicks "Generate Another"
    await user.click(generateAnotherButton)

    // Step 8: Image clears, prompt is preserved
    await waitFor(() => {
      expect(container.querySelector('.duck-display')).toBeFalsy()
      expect(input.value).toBe('a duck wearing sunglasses on a beach')
    }, { timeout: 300 })

    // Step 9: User modifies prompt and generates again
    await user.clear(input)
    await user.paste('a cool duck in space')

    vi.mocked(api.quackHatchDuck).mockResolvedValueOnce({
      success: true,
      image: 'data:image/png;base64,secondduckimage',
      message: 'Another duck ready!'
    })

    await user.click(generateButton)

    // Step 10: New image replaces old one
    await waitFor(() => {
      const duckDisplay = container.querySelector('.duck-display')
      expect(duckDisplay).toBeTruthy()
      
      const img = duckDisplay.querySelector('img')
      expect(img.src).toContain('secondduckimage')
      expect(img.src).not.toContain('firstduckimage')
    }, { timeout: 1000 })
  }, 15000)

  it('error recovery flow: error → retry → success', async () => {
    const user = userEvent.setup()
    const { container } = render(<DuckGenerator />)

    const input = container.querySelector('input')
    const generateButton = container.querySelectorAll('button')[0]

    // Step 1: User enters description
    await user.click(input)
    await user.paste('a duck')

    // Step 2: First generation attempt fails
    vi.mocked(api.quackHatchDuck).mockRejectedValueOnce(
      new Error('Quack! The pond is a bit choppy right now. Please waddle back and try again.')
    )

    await user.click(generateButton)

    // Step 3: Error message displays (loading state may be too brief to catch)
    await waitFor(() => {
      expect(container.querySelector('.loading')).toBeFalsy()
      
      const errorDiv = container.querySelector('.error')
      expect(errorDiv).toBeTruthy()
      expect(errorDiv.textContent).toContain('pond')
      expect(errorDiv.textContent).toContain('Quack')
      
      // Verify ARIA attributes for accessibility
      expect(errorDiv.getAttribute('role')).toBe('alert')
      expect(errorDiv.getAttribute('aria-live')).toBe('assertive')
      
      // No image should be displayed
      expect(container.querySelector('.duck-display')).toBeFalsy()
      
      // Input should still be editable
      expect(input).not.toBeDisabled()
      
      // Generate button should be enabled for retry
      expect(generateButton).not.toBeDisabled()
    }, { timeout: 1000 })

    // Step 5: User retries with same prompt
    vi.mocked(api.quackHatchDuck).mockResolvedValueOnce({
      success: true,
      image: 'data:image/png;base64,successimage',
      message: 'Quack quack! Your duck is ready!'
    })

    await user.click(generateButton)

    // Step 6: Error clears when new generation starts
    await waitFor(() => {
      expect(container.querySelector('.error')).toBeFalsy()
    }, { timeout: 200 })

    // Step 7: Success - image displays
    await waitFor(() => {
      expect(container.querySelector('.loading')).toBeFalsy()
      
      const duckDisplay = container.querySelector('.duck-display')
      expect(duckDisplay).toBeTruthy()
      
      const img = duckDisplay.querySelector('img')
      expect(img).toBeTruthy()
      expect(img.src).toContain('successimage')
      
      // Error should still be gone
      expect(container.querySelector('.error')).toBeFalsy()
    }, { timeout: 1000 })
  }, 10000)

  it('fallback duck system: generation fails → fallback duck displays', async () => {
    const user = userEvent.setup()
    const { container } = render(<DuckGenerator />)

    const input = container.querySelector('input')
    const generateButton = container.querySelectorAll('button')[0]

    // Step 1: User enters description
    await user.click(input)
    await user.paste('a mysterious duck')

    // Step 2: Generation uses fallback system
    vi.mocked(api.quackHatchDuck).mockResolvedValueOnce({
      success: true,
      image: 'data:image/png;base64,fallbackduckimage',
      message: 'Quack! Here\'s a pre-made duck for you!',
      is_fallback: true,
      prompt_used: 'a mysterious duck'
    })

    await user.click(generateButton)

    // Step 3: Fallback duck displays successfully (loading state may be too brief to catch)
    await waitFor(() => {
      expect(container.querySelector('.loading')).toBeFalsy()
      
      const duckDisplay = container.querySelector('.duck-display')
      expect(duckDisplay).toBeTruthy()
      
      const img = duckDisplay.querySelector('img')
      expect(img).toBeTruthy()
      expect(img.src).toContain('fallbackduckimage')
      
      const message = duckDisplay.querySelector('.message')
      expect(message.textContent).toContain('pre-made')
      
      // No error should be displayed
      expect(container.querySelector('.error')).toBeFalsy()
      
      // "Generate Another" button should be available
      const buttons = container.querySelectorAll('button')
      const generateAnotherButton = Array.from(buttons).find(btn => 
        btn.textContent.includes('Generate Another')
      )
      expect(generateAnotherButton).toBeTruthy()
    }, { timeout: 1000 })

    // Step 5: User can generate another duck after fallback
    const buttons = container.querySelectorAll('button')
    const generateAnotherButton = Array.from(buttons).find(btn => 
      btn.textContent.includes('Generate Another')
    )

    await user.click(generateAnotherButton)

    await waitFor(() => {
      expect(container.querySelector('.duck-display')).toBeFalsy()
      expect(input.value).toBe('a mysterious duck')
    }, { timeout: 300 })
  }, 10000)

  it('keyboard navigation: Enter key triggers generation', async () => {
    const user = userEvent.setup()
    const { container } = render(<DuckGenerator />)

    const input = container.querySelector('input')

    // Mock successful generation
    vi.mocked(api.quackHatchDuck).mockResolvedValueOnce({
      success: true,
      image: 'data:image/png;base64,keyboardduck',
      message: 'Duck ready!'
    })

    // User types and presses Enter
    await user.click(input)
    await user.paste('a duck')
    await user.keyboard('{Enter}')

    // Image should display (loading state may be too brief to catch)
    await waitFor(() => {
      const duckDisplay = container.querySelector('.duck-display')
      expect(duckDisplay).toBeTruthy()
      
      const img = duckDisplay.querySelector('img')
      expect(img.src).toContain('keyboardduck')
    }, { timeout: 1000 })
  }, 10000)

  it('accessibility: screen reader announcements work correctly', async () => {
    const user = userEvent.setup()
    const { container } = render(<DuckGenerator />)

    const input = container.querySelector('input')
    const generateButton = container.querySelectorAll('button')[0]

    // Verify input has proper ARIA labels
    expect(input.getAttribute('aria-label')).toBe('Duck description input')
    expect(input.getAttribute('aria-describedby')).toBe('character-count')

    // Verify character count has aria-live
    const characterCount = container.querySelector('#character-count')
    expect(characterCount.getAttribute('aria-live')).toBe('polite')

    // Generate duck
    vi.mocked(api.quackHatchDuck).mockResolvedValueOnce({
      success: true,
      image: 'data:image/png;base64,test',
      message: 'Duck ready!'
    })

    await user.click(input)
    await user.paste('a duck')
    await user.click(generateButton)

    // Verify success message has aria-live (loading state may be too brief to catch)
    await waitFor(() => {
      const duckDisplay = container.querySelector('.duck-display')
      expect(duckDisplay).toBeTruthy()
      expect(duckDisplay.getAttribute('role')).toBe('region')
      expect(duckDisplay.getAttribute('aria-label')).toBe('Generated duck image')
      
      const message = duckDisplay.querySelector('.message')
      expect(message.getAttribute('aria-live')).toBe('polite')
      
      const img = duckDisplay.querySelector('img')
      expect(img.getAttribute('role')).toBe('img')
      expect(img.alt).toBeTruthy()
    }, { timeout: 1000 })
  }, 10000)

  it('multiple errors in sequence: each error clears properly', async () => {
    const user = userEvent.setup()
    const { container } = render(<DuckGenerator />)

    const input = container.querySelector('input')
    const generateButton = container.querySelectorAll('button')[0]

    await user.click(input)
    await user.paste('duck 1')

    // First error
    vi.mocked(api.quackHatchDuck).mockRejectedValueOnce(
      new Error('Quack! Error 1')
    )

    await user.click(generateButton)

    await waitFor(() => {
      const errorDiv = container.querySelector('.error')
      expect(errorDiv).toBeTruthy()
      expect(errorDiv.textContent).toContain('Error 1')
    }, { timeout: 1000 })

    // Second error
    vi.mocked(api.quackHatchDuck).mockRejectedValueOnce(
      new Error('Quack! Error 2')
    )

    await user.clear(input)
    await user.paste('duck 2')
    await user.click(generateButton)

    // First error should clear, second error should appear
    await waitFor(() => {
      const errorDiv = container.querySelector('.error')
      expect(errorDiv).toBeTruthy()
      expect(errorDiv.textContent).toContain('Error 2')
      expect(errorDiv.textContent).not.toContain('Error 1')
    }, { timeout: 1000 })

    // Success clears error
    vi.mocked(api.quackHatchDuck).mockResolvedValueOnce({
      success: true,
      image: 'data:image/png;base64,success',
      message: 'Success!'
    })

    await user.clear(input)
    await user.paste('duck 3')
    await user.click(generateButton)

    await waitFor(() => {
      expect(container.querySelector('.error')).toBeFalsy()
      expect(container.querySelector('.duck-display')).toBeTruthy()
    }, { timeout: 1000 })
  }, 10000)
})
