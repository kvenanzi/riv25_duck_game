import React from 'react'

const MAX_CHARACTERS = 1024

/**
 * PromptInput Component
 * 
 * Input field for duck descriptions with character limit validation.
 */
function PromptInput({ value, onChange, onSubmit, disabled }) {
  const characterCount = value.length
  const isOverLimit = characterCount > MAX_CHARACTERS
  const isNearLimit = characterCount > MAX_CHARACTERS * 0.9

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !disabled && !isOverLimit) {
      onSubmit()
    }
  }

  const handleChange = (e) => {
    const newValue = e.target.value
    // Allow typing but mark as invalid if over limit
    onChange(newValue)
  }

  return (
    <div className="input-section">
      <label htmlFor="duck-prompt">
        Describe your duck:
      </label>
      <input
        id="duck-prompt"
        type="text"
        value={value}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        placeholder="e.g., a duck wearing sunglasses on a beach"
        disabled={disabled}
        className={isOverLimit ? 'input-error' : ''}
        maxLength={MAX_CHARACTERS + 100} // Soft limit, allow slight overflow for UX
        aria-label="Duck description input"
        aria-describedby="character-count"
        aria-invalid={isOverLimit}
      />
      <div 
        id="character-count"
        className={`character-count ${isNearLimit ? 'warning' : ''} ${isOverLimit ? 'error' : ''}`}
        aria-live="polite"
        aria-atomic="true"
      >
        {characterCount} / {MAX_CHARACTERS} characters
        {isOverLimit && (
          <span className="error-text"> - Quack! That's too much duck description!</span>
        )}
      </div>
    </div>
  )
}

export default PromptInput
