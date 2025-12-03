const API_BASE_URL = import.meta.env.VITE_AGENT_ENDPOINT || 'http://localhost:8081'

/**
 * Generate a duck image based on description
 */
export async function quackHatchDuck(description) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/duck/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ description }),
        })

        if (!response.ok) {
            let errorMessage = 'Quack! Something ruffled my feathers. Please try again.'
            try {
                const errorBody = await response.json()
                if (errorBody?.message) {
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
        throw new Error(
            error?.message ||
            'Quack! The pond is a bit choppy right now. Please waddle back and try again.'
        )
    }
}

/**
 * Check if the API is healthy
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
