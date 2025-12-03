const API_BASE_URL = import.meta.env.VITE_AGENT_ENDPOINT || 'http://localhost:8081'

// Timeout for duck generation requests (30 seconds)
const DUCK_HATCH_TIMEOUT = 30000

/**
 * Create a fetch request with timeout
 * 
 * @param {string} url - Request URL
 * @param {Object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Response>} Fetch response
 * @throws {Error} Timeout error if request takes too long
 */
async function fetchWithTimeout(url, options, timeout) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        })
        clearTimeout(timeoutId)
        return response
    } catch (error) {
        clearTimeout(timeoutId)
        if (error.name === 'AbortError') {
            throw new Error('Quack! Your duck is taking too long to hatch. Please try again.')
        }
        throw error
    }
}

/**
 * Quack and hatch a duck image based on description
 * 
 * Duck-themed API function that sends a description to the backend
 * and returns a freshly hatched duck image. Handles all the waddling
 * and quacking needed to communicate with the duck pond.
 * 
 * @param {string} description - User's duck description
 * @returns {Promise<Object>} Duck response with image data
 * @throws {Error} Duck-themed error message if generation fails
 */
export async function quackHatchDuck(description) {
    try {
        const response = await fetchWithTimeout(
            `${API_BASE_URL}/api/duck/generate`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ description }),
            },
            DUCK_HATCH_TIMEOUT
        )

        if (!response.ok) {
            let errorMessage = 'Quack! Something ruffled my feathers. Please try again.'
            try {
                const errorBody = await response.json()
                if (errorBody?.error) {
                    errorMessage = errorBody.error
                } else if (errorBody?.message) {
                    errorMessage = `Quack! ${errorBody.message}`
                }
            } catch {
                // Ignore JSON parse errors and use default message
            }
            throw new Error(errorMessage)
        }

        const data = await response.json()
        return data
    } catch (error) {
        // Handle network errors with specific duck-themed messages
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            throw new Error('Quack! The pond is a bit choppy right now. Please waddle back and try again.')
        }
        
        if (error.message.includes('timeout') || error.message.includes('taking too long')) {
            throw new Error('Quack! Your duck is taking too long to hatch. Please try again.')
        }
        
        // Re-throw with existing message if already duck-themed
        throw error
    }
}

/**
 * Waddle over and check if the duck pond is healthy
 * 
 * Duck-themed health check function that verifies the backend
 * is up and ready to hatch ducks. Returns pond status with
 * encouraging duck-themed messages.
 * 
 * @returns {Promise<Object>} Health status of the duck pond
 * @throws {Error} Duck-themed error if pond is unreachable
 */
export async function waddleCheckPondHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`)

        if (!response.ok) {
            throw new Error('Quack! The duck pond looks a bit under the weather.')
        }

        const data = await response.json()
        return data
    } catch (error) {
        throw new Error(
            error?.message ||
            'Quack! I could not reach the duck pond. Please make sure the backend is running.'
        )
    }
}
