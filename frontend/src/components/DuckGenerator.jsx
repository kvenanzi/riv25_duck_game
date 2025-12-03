import { useState } from 'react'
import PromptInput from './PromptInput'
import { quackHatchDuck } from '../api/duck-generator-api'

/**
 * DuckGenerator Component
 * 
 * Main component for generating custom duck images based on user descriptions.
 * Handles user input, API communication, loading states, error handling, and image display.
 */
function DuckGenerator() {
  const [prompt, setPrompt] = useState('')
  const [isHatching, setIsHatching] = useState(false)
  const [hatchedDuck, setHatchedDuck] = useState(null)
  const [duckError, setDuckError] = useState(null)

  const handleGenerate = async () => {
    // Validate empty input
    if (!prompt.trim()) {
      setDuckError("Quack! Please describe your duck before we start hatching.")
      return
    }

    // Validate input length
    if (prompt.length > 1024) {
      setDuckError("Quack! That's too much duck description. Keep it under 1024 characters!")
      return
    }

    // Clear previous errors and start generation
    setDuckError(null)
    setIsHatching(true)
    setHatchedDuck(null)

    try {
      const result = await quackHatchDuck(prompt)

      // Validate response structure
      if (!result?.success || !result?.image) {
        throw new Error('Quack! I could not hatch that duck. Please try a new description.')
      }

      setHatchedDuck({
        image: result.image,
        message: result.message || 'Quack quack! Your duck is ready!',
      })
    } catch (error) {
      // Handle different error scenarios with duck-themed messages
      let errorMessage = error?.message

      // If no message or generic error, provide helpful duck-themed message
      if (!errorMessage || errorMessage === 'Failed to fetch') {
        errorMessage = 'Quack! The pond is a bit choppy right now. Please waddle back and try again.'
      } else if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
        errorMessage = 'Quack! Your duck is taking too long to hatch. Please try again.'
      } else if (errorMessage.includes('network') || errorMessage.includes('Network')) {
        errorMessage = 'Quack! I could not reach the duck pond. Please make sure the backend is running.'
      } else if (!errorMessage.toLowerCase().includes('quack')) {
        // Ensure all error messages are duck-themed
        errorMessage = `Quack! ${errorMessage}`
      }

      setDuckError(errorMessage)
    } finally {
      setIsHatching(false)
    }
  }

  const handleGenerateAnother = () => {
    setDuckError(null)
    setHatchedDuck(null)
  }

  return (
    <div className="generator-container">
      <PromptInput
        value={prompt}
        onChange={setPrompt}
        onSubmit={handleGenerate}
        disabled={isHatching}
      />
      
      <button 
        className="button-primary"
        onClick={handleGenerate}
        disabled={isHatching || !prompt.trim() || prompt.length > 1024}
        aria-label={isHatching ? 'Generating duck, please wait' : 'Generate duck image'}
      >
        {isHatching ? 'Hatching your duck...' : 'Generate Duck'}
      </button>

      {isHatching && (
        <div className="loading" role="status" aria-live="polite" aria-busy="true">
          <div className="loading-spinner" aria-hidden="true" />
          <p>Hatching your duck...</p>
        </div>
      )}

      {duckError && (
        <div className="error" role="alert" aria-live="assertive" aria-atomic="true">
          <span className="error-icon" aria-hidden="true">🦆</span>
          <div className="error-message">{duckError}</div>
        </div>
      )}

      {hatchedDuck && (
        <div className="duck-display" role="region" aria-label="Generated duck image">
          <div className="message" aria-live="polite">{hatchedDuck.message}</div>
          <img 
            src={hatchedDuck.image} 
            alt="Your custom generated duck image based on your description" 
            role="img"
          />
          <button
            className="button-primary"
            type="button"
            onClick={handleGenerateAnother}
            aria-label="Generate another duck image"
          >
            Generate Another Duck
          </button>
        </div>
      )}
    </div>
  )
}

export default DuckGenerator
