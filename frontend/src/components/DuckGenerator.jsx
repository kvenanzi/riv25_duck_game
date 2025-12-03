import React, { useState } from 'react'
import PromptInput from './PromptInput'
import { quackHatchDuck } from '../api/duck-generator-api'

/**
 * DuckGenerator Component
 * 
 * ⚠️ THIS COMPONENT IS INCOMPLETE! ⚠️
 * 
 * Missing features:
 * 1. State management for generated duck image
 * 2. Loading state while generating
 * 3. Error handling and display
 * 4. Image display component
 * 5. "Generate Another" button functionality
 * 
 * Participants should create a SPEC to define these requirements,
 * then ask Kiro to implement them!
 */
function DuckGenerator() {
  const [prompt, setPrompt] = useState('')
  const [isHatching, setIsHatching] = useState(false)
  const [hatchedDuck, setHatchedDuck] = useState(null)
  const [duckError, setDuckError] = useState(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setDuckError("Quack! Please describe your duck before we start hatching.")
      return
    }

    setDuckError(null)
    setIsHatching(true)
    setHatchedDuck(null)

    try {
      const result = await quackHatchDuck(prompt)

      if (!result?.success || !result?.image) {
        throw new Error('Quack! I could not hatch that duck. Please try a new description.')
      }

      setHatchedDuck({
        image: result.image,
        message: result.message || 'Quack quack! Your duck is ready!',
      })
    } catch (error) {
      setDuckError(
        error?.message ||
          'Quack! Something splashed the pond. Please waddle back and try again.'
      )
    } finally {
      setIsHatching(false)
    }
  }

  const handleGenerateAnother = () => {
    setPrompt('')
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
        disabled={isHatching || !prompt.trim()}
      >
        {isHatching ? 'Hatching your duck...' : 'Generate Duck'}
      </button>

      {isHatching && (
        <div className="loading">
          <div className="loading-spinner" />
          <p>Hatching your duck...</p>
        </div>
      )}

      {duckError && (
        <div className="error">
          {duckError}
        </div>
      )}

      {hatchedDuck && (
        <div className="duck-display">
          <div className="message">{hatchedDuck.message}</div>
          <img src={hatchedDuck.image} alt="Your generated duck" />
          <button
            className="button-primary"
            type="button"
            onClick={handleGenerateAnother}
          >
            Generate Another Duck
          </button>
        </div>
      )}
    </div>
  )
}

export default DuckGenerator
