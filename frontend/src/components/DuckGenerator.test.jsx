import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as fc from 'fast-check'
import DuckGenerator from './DuckGenerator'
import * as api from '../api/duck-generator-api'

// Mock the API
vi.mock('../api/duck-generator-api')

// Feature: duck-generator, Property 3: Button disabled during generation
describe('DuckGenerator - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('Property 3: Button disabled during generation', async () => {
    // Test with multiple different prompts to verify the property holds
    const testPrompts = [
      'a duck',
      'cool duck with sunglasses',
      'duck in space',
      'rubber duck',
      'duck wearing a hat'
    ]
    
    for (const validPrompt of testPrompts) {
      // Mock API to simulate a delay
      let resolvePromise
      const mockPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      
      vi.mocked(api.quackHatchDuck).mockReturnValue(mockPromise)
      
      const user = userEvent.setup()
      const { container, unmount } = render(<DuckGenerator />)
      
      try {
        // Find input and button
        const input = container.querySelector('input')
        const generateButton = container.querySelectorAll('button')[0] // First button is Generate Duck
        
        // Enter valid prompt using React's onChange
        await user.click(input)
        await user.paste(validPrompt)
        
        // Button should be enabled before clicking
        expect(generateButton).not.toBeDisabled()
        
        // Click the button
        await user.click(generateButton)
        
        // Button should be disabled immediately during generation
        await waitFor(() => {
          expect(generateButton).toBeDisabled()
          expect(generateButton.textContent).toContain('Hatching your duck...')
        }, { timeout: 100 })
        
        // Resolve the promise to complete generation
        resolvePromise({
          success: true,
          image: 'data:image/png;base64,test',
          message: 'Duck ready!'
        })
        
        // Wait for generation to complete
        await waitFor(() => {
          expect(generateButton).not.toBeDisabled()
        }, { timeout: 300 })
      } finally {
        unmount()
        cleanup()
      }
    }
  }, 10000)

  // Feature: duck-generator, Property 4: Loading state displays during generation
  it('Property 4: Loading state displays during generation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        async (validPrompt) => {
          // Mock API to simulate a delay
          let resolvePromise
          const mockPromise = new Promise((resolve) => {
            resolvePromise = resolve
          })
          
          vi.mocked(api.quackHatchDuck).mockReturnValue(mockPromise)
          
          const user = userEvent.setup()
          const { container, unmount } = render(<DuckGenerator />)
          
          try {
            // Find input and button
            const input = container.querySelector('input')
            const generateButton = container.querySelectorAll('button')[0]
            
            // Enter valid prompt
            await user.click(input)
            await user.paste(validPrompt)
            
            // Click the button to start generation
            await user.click(generateButton)
            
            // Verify loading state appears during generation
            await waitFor(() => {
              const loadingDiv = container.querySelector('.loading')
              expect(loadingDiv).toBeTruthy()
              
              // Verify loading message
              const loadingText = loadingDiv.querySelector('p')
              expect(loadingText.textContent).toBe('Hatching your duck...')
              
              // Verify loading spinner is visible
              const spinner = loadingDiv.querySelector('.loading-spinner')
              expect(spinner).toBeTruthy()
            }, { timeout: 100 })
            
            // Resolve the promise to complete generation
            resolvePromise({
              success: true,
              image: 'data:image/png;base64,test',
              message: 'Duck ready!'
            })
            
            // Wait for generation to complete
            await waitFor(() => {
              const loadingDiv = container.querySelector('.loading')
              expect(loadingDiv).toBeFalsy()
            }, { timeout: 300 })
          } finally {
            unmount()
            cleanup()
          }
        }
      ),
      { numRuns: 100 }
    )
  }, 30000)

  // Feature: duck-generator, Property 5: Loading state clears on completion
  it('Property 5: Loading state clears on completion', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        fc.boolean(), // Test both success and error scenarios
        async (validPrompt, shouldSucceed) => {
          // Mock API to simulate a delay
          let resolvePromise, rejectPromise
          const mockPromise = new Promise((resolve, reject) => {
            resolvePromise = resolve
            rejectPromise = reject
          })
          
          vi.mocked(api.quackHatchDuck).mockReturnValue(mockPromise)
          
          const user = userEvent.setup()
          const { container, unmount } = render(<DuckGenerator />)
          
          try {
            // Find input and button
            const input = container.querySelector('input')
            const generateButton = container.querySelectorAll('button')[0]
            
            // Enter valid prompt
            await user.click(input)
            await user.paste(validPrompt)
            
            // Click the button to start generation
            await user.click(generateButton)
            
            // Verify loading state appears
            await waitFor(() => {
              const loadingDiv = container.querySelector('.loading')
              expect(loadingDiv).toBeTruthy()
            }, { timeout: 100 })
            
            // Complete generation (either success or error)
            if (shouldSucceed) {
              resolvePromise({
                success: true,
                image: 'data:image/png;base64,test',
                message: 'Duck ready!'
              })
            } else {
              rejectPromise(new Error('Quack! Generation failed'))
            }
            
            // Verify loading state clears after completion
            await waitFor(() => {
              const loadingDiv = container.querySelector('.loading')
              expect(loadingDiv).toBeFalsy()
            }, { timeout: 300 })
            
            // Verify either success or error state is shown
            if (shouldSucceed) {
              const duckDisplay = container.querySelector('.duck-display')
              expect(duckDisplay).toBeTruthy()
            } else {
              const errorDiv = container.querySelector('.error')
              expect(errorDiv).toBeTruthy()
            }
          } finally {
            unmount()
            cleanup()
          }
        }
      ),
      { numRuns: 100 }
    )
  }, 30000)

  // Feature: duck-generator, Property 6: Successful generation displays image
  it('Property 6: Successful generation displays image', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        fc.base64String({ minLength: 10, maxLength: 50 }),
        async (validPrompt, imageData) => {
          // Mock successful API response with image data
          vi.mocked(api.quackHatchDuck).mockResolvedValue({
            success: true,
            image: `data:image/png;base64,${imageData}`,
            message: 'Quack quack! Your duck is ready!'
          })
          
          const user = userEvent.setup()
          const { container, unmount } = render(<DuckGenerator />)
          
          try {
            // Find input and button
            const input = container.querySelector('input')
            const generateButton = container.querySelectorAll('button')[0]
            
            // Enter valid prompt
            await user.click(input)
            await user.paste(validPrompt)
            
            // Click the button to start generation
            await user.click(generateButton)
            
            // Wait for generation to complete and verify image is displayed
            await waitFor(() => {
              const duckDisplay = container.querySelector('.duck-display')
              expect(duckDisplay).toBeTruthy()
              
              const img = duckDisplay.querySelector('img')
              expect(img).toBeTruthy()
              expect(img.src).toContain('data:image/png;base64,')
              expect(img.src).toContain(imageData)
              expect(img.alt).toBe('Your custom generated duck image based on your description')
            }, { timeout: 1000 })
          } finally {
            unmount()
            cleanup()
          }
        }
      ),
      { numRuns: 100 }
    )
  }, 30000)

  // Feature: duck-generator, Property 8: Generate Another button appears with image
  it('Property 8: Generate Another button appears with image', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        fc.base64String({ minLength: 10, maxLength: 50 }),
        async (validPrompt, imageData) => {
          const user = userEvent.setup()
          const { container, unmount } = render(<DuckGenerator />)
          
          try {
            // Before generation, "Generate Another" button should not exist
            let buttons = container.querySelectorAll('button')
            let generateAnotherButton = Array.from(buttons).find(btn => 
              btn.textContent.includes('Generate Another')
            )
            expect(generateAnotherButton).toBeFalsy()
            
            // Mock successful API response
            vi.mocked(api.quackHatchDuck).mockResolvedValue({
              success: true,
              image: `data:image/png;base64,${imageData}`,
              message: 'Quack quack! Your duck is ready!'
            })
            
            const input = container.querySelector('input')
            const generateButton = container.querySelectorAll('button')[0]
            
            // Generate duck
            await user.click(input)
            await user.paste(validPrompt)
            await user.click(generateButton)
            
            // After successful generation, "Generate Another" button should appear
            await waitFor(() => {
              const duckDisplay = container.querySelector('.duck-display')
              expect(duckDisplay).toBeTruthy()
              
              buttons = container.querySelectorAll('button')
              generateAnotherButton = Array.from(buttons).find(btn => 
                btn.textContent.includes('Generate Another')
              )
              expect(generateAnotherButton).toBeTruthy()
            }, { timeout: 1000 })
          } finally {
            unmount()
            cleanup()
          }
        }
      ),
      { numRuns: 100 }
    )
  }, 30000)

  // Feature: duck-generator, Property 7: New generation replaces previous image
  it('Property 7: New generation replaces previous image', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        fc.base64String({ minLength: 10, maxLength: 50 }),
        fc.base64String({ minLength: 10, maxLength: 50 }),
        async (firstPrompt, secondPrompt, firstImageData, secondImageData) => {
          // Ensure the two images are different
          if (firstImageData === secondImageData) {
            return // Skip this test case
          }
          
          const user = userEvent.setup()
          const { container, unmount } = render(<DuckGenerator />)
          
          try {
            // First generation
            vi.mocked(api.quackHatchDuck).mockResolvedValueOnce({
              success: true,
              image: `data:image/png;base64,${firstImageData}`,
              message: 'First duck ready!'
            })
            
            const input = container.querySelector('input')
            const generateButton = container.querySelectorAll('button')[0]
            
            // Generate first duck
            await user.click(input)
            await user.paste(firstPrompt)
            await user.click(generateButton)
            
            // Wait for first image to appear
            await waitFor(() => {
              const img = container.querySelector('.duck-display img')
              expect(img).toBeTruthy()
              expect(img.src).toContain(firstImageData)
            }, { timeout: 1000 })
            
            // Second generation
            vi.mocked(api.quackHatchDuck).mockResolvedValueOnce({
              success: true,
              image: `data:image/png;base64,${secondImageData}`,
              message: 'Second duck ready!'
            })
            
            // Clear input and enter new prompt
            await user.clear(input)
            await user.paste(secondPrompt)
            await user.click(generateButton)
            
            // Wait for second image to replace the first
            await waitFor(() => {
              const img = container.querySelector('.duck-display img')
              expect(img).toBeTruthy()
              expect(img.src).toContain(secondImageData)
              expect(img.src).not.toContain(firstImageData)
            }, { timeout: 1000 })
          } finally {
            unmount()
            cleanup()
          }
        }
      ),
      { numRuns: 100 }
    )
  }, 30000)

  // Feature: duck-generator, Property 9: Generate Another clears image state
  it('Property 9: Generate Another clears image state', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        fc.base64String({ minLength: 10, maxLength: 50 }),
        async (validPrompt, imageData) => {
          const user = userEvent.setup()
          const { container, unmount } = render(<DuckGenerator />)
          
          try {
            // Mock successful API response
            vi.mocked(api.quackHatchDuck).mockResolvedValue({
              success: true,
              image: `data:image/png;base64,${imageData}`,
              message: 'Quack quack! Your duck is ready!'
            })
            
            const input = container.querySelector('input')
            const generateButton = container.querySelectorAll('button')[0]
            
            // Generate duck
            await user.click(input)
            await user.paste(validPrompt)
            await user.click(generateButton)
            
            // Wait for image to appear
            await waitFor(() => {
              const duckDisplay = container.querySelector('.duck-display')
              expect(duckDisplay).toBeTruthy()
              const img = duckDisplay.querySelector('img')
              expect(img).toBeTruthy()
            }, { timeout: 1000 })
            
            // Click "Generate Another" button
            const buttons = container.querySelectorAll('button')
            const generateAnotherButton = Array.from(buttons).find(btn => 
              btn.textContent.includes('Generate Another')
            )
            expect(generateAnotherButton).toBeTruthy()
            await user.click(generateAnotherButton)
            
            // Verify image is cleared
            await waitFor(() => {
              const duckDisplay = container.querySelector('.duck-display')
              expect(duckDisplay).toBeFalsy()
            }, { timeout: 300 })
          } finally {
            unmount()
            cleanup()
          }
        }
      ),
      { numRuns: 100 }
    )
  }, 30000)

  // Feature: duck-generator, Property 10: Generate Another preserves prompt
  it('Property 10: Generate Another preserves prompt', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        fc.base64String({ minLength: 10, maxLength: 50 }),
        async (validPrompt, imageData) => {
          const user = userEvent.setup()
          const { container, unmount } = render(<DuckGenerator />)
          
          try {
            // Mock successful API response
            vi.mocked(api.quackHatchDuck).mockResolvedValue({
              success: true,
              image: `data:image/png;base64,${imageData}`,
              message: 'Quack quack! Your duck is ready!'
            })
            
            const input = container.querySelector('input')
            const generateButton = container.querySelectorAll('button')[0]
            
            // Generate duck
            await user.click(input)
            await user.paste(validPrompt)
            await user.click(generateButton)
            
            // Wait for image to appear
            await waitFor(() => {
              const duckDisplay = container.querySelector('.duck-display')
              expect(duckDisplay).toBeTruthy()
            }, { timeout: 1000 })
            
            // Verify prompt is still in input field
            expect(input.value).toBe(validPrompt)
            
            // Click "Generate Another" button
            const buttons = container.querySelectorAll('button')
            const generateAnotherButton = Array.from(buttons).find(btn => 
              btn.textContent.includes('Generate Another')
            )
            expect(generateAnotherButton).toBeTruthy()
            await user.click(generateAnotherButton)
            
            // Verify prompt is still preserved after clicking "Generate Another"
            await waitFor(() => {
              expect(input.value).toBe(validPrompt)
            }, { timeout: 300 })
          } finally {
            unmount()
            cleanup()
          }
        }
      ),
      { numRuns: 100 }
    )
  }, 30000)

  // Feature: duck-generator, Property 11: Errors display duck-themed messages
  it('Property 11: Errors display duck-themed messages', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        fc.constantFrom(
          'Network error',
          'Server error',
          'Timeout',
          'Invalid response',
          'Generation failed'
        ),
        async (validPrompt, errorType) => {
          const user = userEvent.setup()
          const { container, unmount } = render(<DuckGenerator />)
          
          try {
            // Mock API to reject with different error types
            let errorMessage
            switch (errorType) {
              case 'Network error':
                errorMessage = 'Quack! The pond is a bit choppy right now. Please waddle back and try again.'
                break
              case 'Server error':
                errorMessage = 'Quack! Something ruffled my feathers. Please try again.'
                break
              case 'Timeout':
                errorMessage = 'Quack! Your duck is taking too long to hatch. Please try again.'
                break
              case 'Invalid response':
                errorMessage = 'Quack! Something splashed the pond. Please waddle back and try again.'
                break
              case 'Generation failed':
                errorMessage = 'Quack! I could not hatch that duck. Please try a new description.'
                break
              default:
                errorMessage = 'Quack! Something went wrong.'
            }
            
            vi.mocked(api.quackHatchDuck).mockRejectedValue(new Error(errorMessage))
            
            const input = container.querySelector('input')
            const generateButton = container.querySelectorAll('button')[0]
            
            // Generate duck (will fail)
            await user.click(input)
            await user.paste(validPrompt)
            await user.click(generateButton)
            
            // Wait for error to appear
            await waitFor(() => {
              const errorDiv = container.querySelector('.error')
              expect(errorDiv).toBeTruthy()
              
              // Verify error message is duck-themed (contains "Quack" or duck-related words)
              const errorText = errorDiv.textContent
              const isDuckThemed = 
                errorText.toLowerCase().includes('quack') ||
                errorText.toLowerCase().includes('duck') ||
                errorText.toLowerCase().includes('waddle') ||
                errorText.toLowerCase().includes('pond') ||
                errorText.toLowerCase().includes('hatch') ||
                errorText.toLowerCase().includes('feathers')
              
              expect(isDuckThemed).toBe(true)
            }, { timeout: 1000 })
          } finally {
            unmount()
            cleanup()
          }
        }
      ),
      { numRuns: 100 }
    )
  }, 30000)

  // Feature: duck-generator, Property 12: New generation clears errors
  it('Property 12: New generation clears errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        fc.base64String({ minLength: 10, maxLength: 50 }),
        async (firstPrompt, secondPrompt, imageData) => {
          const user = userEvent.setup()
          const { container, unmount } = render(<DuckGenerator />)
          
          try {
            // First generation fails
            vi.mocked(api.quackHatchDuck).mockRejectedValueOnce(
              new Error('Quack! Something went wrong.')
            )
            
            const input = container.querySelector('input')
            const generateButton = container.querySelectorAll('button')[0]
            
            // Generate duck (will fail)
            await user.click(input)
            await user.paste(firstPrompt)
            await user.click(generateButton)
            
            // Wait for error to appear
            await waitFor(() => {
              const errorDiv = container.querySelector('.error')
              expect(errorDiv).toBeTruthy()
            }, { timeout: 1000 })
            
            // Second generation succeeds
            vi.mocked(api.quackHatchDuck).mockResolvedValueOnce({
              success: true,
              image: `data:image/png;base64,${imageData}`,
              message: 'Duck ready!'
            })
            
            // Clear input and enter new prompt
            await user.clear(input)
            await user.paste(secondPrompt)
            await user.click(generateButton)
            
            // Verify error is cleared when new generation starts
            await waitFor(() => {
              const errorDiv = container.querySelector('.error')
              expect(errorDiv).toBeFalsy()
            }, { timeout: 1000 })
            
            // Verify success state appears
            await waitFor(() => {
              const duckDisplay = container.querySelector('.duck-display')
              expect(duckDisplay).toBeTruthy()
            }, { timeout: 1000 })
          } finally {
            unmount()
            cleanup()
          }
        }
      ),
      { numRuns: 100 }
    )
  }, 30000)
})
