import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import * as fc from 'fast-check'
import PromptInput from './PromptInput'

// Feature: duck-generator, Property 1: Input length validation
describe('PromptInput - Property-Based Tests', () => {
  it('Property 1: Input length validation - accepts valid lengths and rejects invalid', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 2000 }),
        (inputString) => {
          const onChange = vi.fn()
          const onSubmit = vi.fn()
          
          const { container } = render(
            <PromptInput
              value={inputString}
              onChange={onChange}
              onSubmit={onSubmit}
              disabled={false}
            />
          )
          
          const input = container.querySelector('input')
          const characterCount = container.querySelector('.character-count')
          
          // Input should always be rendered
          expect(input).toBeTruthy()
          expect(characterCount).toBeTruthy()
          
          // Check validation state based on length
          const isValid = inputString.length >= 1 && inputString.length <= 1024
          const isOverLimit = inputString.length > 1024
          
          if (isOverLimit) {
            // Should show error styling
            expect(characterCount.classList.contains('error')).toBe(true)
            expect(characterCount.textContent).toContain('too much duck description')
          } else if (inputString.length > 1024 * 0.9) {
            // Should show warning styling
            expect(characterCount.classList.contains('warning')).toBe(true)
          }
          
          // Character count should be displayed
          expect(characterCount.textContent).toContain(`${inputString.length} / 1024`)
        }
      ),
      { numRuns: 100 }
    )
  })
})
