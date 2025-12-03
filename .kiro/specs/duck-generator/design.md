# Design Document

## Overview

The Duck Generator is a web application that allows users to generate custom duck images through AI-powered image generation. The system consists of a React frontend that provides an intuitive user interface and a Python Flask backend that integrates with AWS Bedrock Nova Canvas via the Strands agent framework and MCP (Model Context Protocol) for image generation.

The application follows a client-server architecture where the frontend handles user interactions and display logic, while the backend manages AI model communication, prompt enhancement, and image generation orchestration.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ DuckGenerator│  │  PromptInput │  │ Image Display│      │
│  │  Component   │  │  Component   │  │  Component   │      │
│  └──────┬───────┘  └──────────────┘  └──────────────┘      │
│         │                                                     │
│         │ quackHatchDuck()                                   │
│         ▼                                                     │
│  ┌──────────────────────────────────────────────────┐       │
│  │        duck-generator-api.js (API Layer)         │       │
│  └──────────────────┬───────────────────────────────┘       │
└─────────────────────┼─────────────────────────────────────┘
                      │ HTTP POST /api/duck/generate
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Flask + Python)                  │
│  ┌──────────────────────────────────────────────────┐       │
│  │           Flask API Endpoint Handler             │       │
│  └──────────────────┬───────────────────────────────┘       │
│                     │                                         │
│                     ▼                                         │
│  ┌──────────────────────────────────────────────────┐       │
│  │         Strands Agent (Prompt Enhancement)       │       │
│  └──────────────────┬───────────────────────────────┘       │
│                     │                                         │
│                     ▼                                         │
│  ┌──────────────────────────────────────────────────┐       │
│  │    Nova Canvas MCP Client (Image Generation)     │       │
│  └──────────────────┬───────────────────────────────┘       │
└─────────────────────┼─────────────────────────────────────┘
                      │
                      ▼
              ┌───────────────────┐
              │  AWS Bedrock      │
              │  Nova Canvas      │
              └───────────────────┘
```

### Component Responsibilities

**Frontend Components:**
- **DuckGenerator**: Main orchestration component managing state and user flow
- **PromptInput**: Text input component for duck descriptions
- **Image Display**: Renders generated duck images with appropriate styling
- **API Layer**: Handles HTTP communication with backend using duck-themed function names

**Backend Components:**
- **Flask API**: RESTful endpoint handling and request validation
- **Strands Agent**: Prompt enhancement and AI orchestration
- **Nova Canvas MCP Client**: Integration with AWS Bedrock Nova Canvas for image generation
- **Fallback System**: Provides pre-generated duck images when generation fails

## Components and Interfaces

### Frontend Components

#### DuckGenerator Component

**State Management:**
```javascript
{
  prompt: string,           // User's duck description
  isHatching: boolean,      // Loading state during generation
  hatchedDuck: {            // Generated duck data
    image: string,          // Base64 data URL
    message: string         // Success message
  } | null,
  duckError: string | null  // Error message if generation fails
}
```

**Methods:**
- `handleGenerate()`: Initiates duck generation process
- `handleGenerateAnother()`: Resets state for new generation
- `setPrompt(value)`: Updates prompt state
- `setIsHatching(value)`: Updates loading state
- `setHatchedDuck(data)`: Updates generated duck data
- `setDuckError(message)`: Updates error state

**Props:** None (root component)

#### PromptInput Component

**Props:**
```javascript
{
  value: string,              // Current input value
  onChange: (value) => void,  // Callback when input changes
  onSubmit: () => void,       // Callback when Enter is pressed
  disabled: boolean           // Whether input is disabled
}
```

### Backend API

#### POST /api/duck/generate

**Request:**
```json
{
  "description": "a duck wearing sunglasses on a beach"
}
```

**Response (Success):**
```json
{
  "image": "data:image/png;base64,iVBORw0KG...",
  "message": "Quack quack! Your duck is ready!",
  "prompt_used": "enhanced prompt sent to model",
  "is_fallback": false,
  "success": true
}
```

**Response (Error):**
```json
{
  "error": "Quack! Please provide a duck description.",
  "message": "Missing 'description' field in request",
  "success": false
}
```

**Status Codes:**
- 200: Success
- 400: Invalid request (missing description or no "duck" in description)
- 500: Server error (generation failed and no fallback available)

#### GET /health

**Response:**
```json
{
  "status": "healthy",
  "message": "Quack! Duck generator is ready!"
}
```

### API Layer Functions

**quackHatchDuck(description: string): Promise<DuckResponse>**
- Sends duck description to backend
- Returns generated duck data or throws duck-themed error
- Handles network errors with encouraging messages

**waddleCheckPondHealth(): Promise<HealthResponse>**
- Checks backend health status
- Returns health status or throws duck-themed error

## Data Models

### Frontend Data Models

**DuckResponse:**
```typescript
{
  image: string,          // Base64-encoded image data URL
  message: string,        // Success message from backend
  prompt_used: string,    // The enhanced prompt sent to AI
  is_fallback: boolean,   // Whether a fallback duck was used
  success: boolean        // Operation success status
}
```

**HealthResponse:**
```typescript
{
  status: string,         // "healthy" or error status
  message: string         // Status message
}
```

### Backend Data Models

**GenerateRequest:**
```python
{
  "description": str      # User's duck description (required)
}
```

**GenerateResponse:**
```python
{
  "image": str,           # Base64-encoded image data URL
  "message": str,         # Success message
  "prompt_used": str,     # Enhanced prompt
  "is_fallback": bool,    # Whether fallback was used
  "success": bool         # Operation success
}
```

**ErrorResponse:**
```python
{
  "error": str,           # User-friendly error message
  "message": str,         # Technical error details
  "success": bool         # Always False for errors
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated:
- Properties 8.1 and 8.2 both test prompt enhancement and can be combined into a single comprehensive property
- Properties 3.1, 3.2, and 3.3 all relate to loading state management and can be verified together
- Properties related to button state (2.4, 5.1, 5.2) test UI state consistency

The following properties represent the unique, non-redundant correctness requirements:

### Property 1: Input length validation

*For any* string input to the prompt field, the system should accept inputs with length between 1 and 1024 characters (inclusive) and reject inputs outside this range.

**Validates: Requirements 1.2**

### Property 2: Valid input triggers generation

*For any* valid (non-empty, within length limits) duck description, clicking the "Generate Duck" button should initiate the image generation process by calling the API.

**Validates: Requirements 2.2**

### Property 3: Button disabled during generation

*For any* generation request, while the generation is in progress (isHatching is true), the "Generate Duck" button should be disabled.

**Validates: Requirements 2.4**

### Property 4: Loading state displays during generation

*For any* generation request, while the generation is in progress, the system should display the loading message "Hatching your duck..." and show visual loading feedback.

**Validates: Requirements 3.1, 3.2**

### Property 5: Loading state clears on completion

*For any* generation request, when the generation completes (either successfully or with error), the loading state should be hidden (isHatching becomes false).

**Validates: Requirements 3.3, 3.4**

### Property 6: Successful generation displays image

*For any* successful generation response containing image data, the system should display the generated duck image in the UI.

**Validates: Requirements 4.1**

### Property 7: New generation replaces previous image

*For any* sequence of successful generations, each new duck image should replace the previous one in the display.

**Validates: Requirements 4.4**

### Property 8: Generate Another button appears with image

*For any* successfully generated duck image, the "Generate Another" button should be visible in the UI.

**Validates: Requirements 5.1**

### Property 9: Generate Another clears image state

*For any* displayed duck image, clicking "Generate Another" should clear the image from the display and reset the state to allow new generation.

**Validates: Requirements 5.2**

### Property 10: Generate Another preserves prompt

*For any* prompt text entered before generation, clicking "Generate Another" should maintain the same prompt text in the input field.

**Validates: Requirements 5.4**

### Property 11: Errors display duck-themed messages

*For any* error that occurs during generation, the system should display an error message that includes duck-themed language.

**Validates: Requirements 6.1**

### Property 12: New generation clears errors

*For any* displayed error message, starting a new generation attempt should clear the error message from the UI.

**Validates: Requirements 6.4**

### Property 13: Prompt enhancement includes "duck"

*For any* user description submitted to the backend, the prompt sent to the AI model should include the word "duck" (case-insensitive).

**Validates: Requirements 8.1, 8.2**

## Error Handling

### Frontend Error Handling

**Input Validation Errors:**
- Empty prompt: Display "Quack! Please describe your duck before we start hatching."
- Prompt too long: Truncate or display "Quack! That's too much duck description. Keep it under 1024 characters!"

**Network Errors:**
- Connection failure: "Quack! The pond is a bit choppy right now. Please waddle back and try again."
- Timeout: "Quack! Your duck is taking too long to hatch. Please try again."
- Backend unavailable: "Quack! I could not reach the duck pond. Please make sure the backend is running."

**API Errors:**
- 400 Bad Request: Display error message from backend response
- 500 Server Error: "Quack! Something went wrong while hatching your duck..."
- Unexpected response format: "Quack! Something ruffled my feathers. Please try again."

**Error Recovery:**
- All errors should allow the user to retry without refreshing the page
- Error messages should clear when a new generation attempt starts
- The input field should remain editable during errors

### Backend Error Handling

**Request Validation:**
- Missing description field: Return 400 with "Quack! Please provide a duck description."
- Description doesn't contain "duck": Return 400 with "Quack quack! That doesn't sound like a duck..."
- Invalid JSON: Return 400 with appropriate error message

**Generation Failures:**
- MCP connection failure: Use fallback duck system
- Nova Canvas API error: Use fallback duck system
- No fallback ducks available: Return 500 with "Quack! No ducks available right now..."

**Fallback System:**
- Maintain a directory of pre-generated duck images
- Randomly select a fallback duck when generation fails
- Return fallback duck with `is_fallback: true` flag
- Log generation failures for monitoring

## Testing Strategy

### Unit Testing

**Frontend Unit Tests:**
- Test DuckGenerator component state management
- Test PromptInput component props and callbacks
- Test API layer error handling and response parsing
- Test duck-themed error message formatting
- Test button enable/disable logic based on state
- Test image display conditional rendering

**Backend Unit Tests:**
- Test request validation logic
- Test prompt enhancement (ensuring "duck" is included)
- Test fallback duck selection
- Test base64 encoding of images
- Test error response formatting

### Property-Based Testing

The design uses **fast-check** for JavaScript/React property-based testing and **Hypothesis** for Python backend testing.

**Configuration:**
- Each property-based test should run a minimum of 100 iterations
- Tests should use appropriate generators for input data
- Each test must be tagged with a comment referencing the correctness property

**Tag Format:**
```javascript
// Feature: duck-generator, Property 1: Input length validation
```

**Frontend Property Tests:**

1. **Property 1 Test**: Generate random strings of various lengths (0-2000 chars) and verify acceptance/rejection
2. **Property 2 Test**: Generate random valid descriptions and verify API call is made
3. **Property 3 Test**: Generate random requests and verify button disabled state during generation
4. **Property 4 Test**: Generate random requests and verify loading message appears
5. **Property 5 Test**: Generate random completion scenarios and verify loading state clears
6. **Property 6 Test**: Generate random successful responses and verify image display
7. **Property 7 Test**: Generate sequences of successful generations and verify image replacement
8. **Property 8 Test**: Generate random successful generations and verify button appears
9. **Property 9 Test**: Generate random image states and verify clearing behavior
10. **Property 10 Test**: Generate random prompts and verify preservation after "Generate Another"
11. **Property 11 Test**: Generate random error scenarios and verify duck-themed messages
12. **Property 12 Test**: Generate random error states and verify clearing on new generation

**Backend Property Tests:**

13. **Property 13 Test**: Generate random descriptions (with and without "duck") and verify all prompts sent to AI include "duck"

### Integration Testing

**End-to-End Flow Tests:**
- Complete user journey: enter description → generate → view image → generate another
- Error recovery flow: trigger error → clear error → successful generation
- Fallback system: simulate generation failure → verify fallback duck displayed

**API Integration Tests:**
- Test frontend-backend communication
- Test Nova Canvas MCP integration
- Test Strands agent prompt enhancement
- Test fallback duck retrieval

### Test Utilities

**Frontend Test Utilities:**
- Mock API responses for different scenarios (success, error, timeout)
- Mock image data for testing display
- Helper functions for rendering components with test state
- Generators for random duck descriptions

**Backend Test Utilities:**
- Mock MCP client responses
- Mock Strands agent responses
- Helper functions for creating test requests
- Generators for random descriptions and prompts

## Implementation Notes

### Duck-Themed Naming Conventions

All API functions must follow duck-themed naming:
- `quackHatchDuck()`: Generate a duck image
- `waddleCheckPondHealth()`: Check backend health
- Avoid generic names like `generateImage()`, `fetchData()`, `checkHealth()`

### Prompt Enhancement Strategy

The backend must ensure all prompts include "duck":
- If user description contains "duck": enhance with artistic details
- If user description lacks "duck": prepend or append "duck" naturally
- Maintain user's creative intent while ensuring duck-themed output
- Examples:
  - "wearing sunglasses" → "a duck wearing sunglasses"
  - "in space" → "a duck in a spacesuit floating in space"
  - "cool" → "a cool duck with sunglasses"

### State Management

**Frontend State Flow:**
```
Initial State → User Input → Generate Click → Loading State → 
  → Success: Display Image + "Generate Another" button
  → Error: Display Error Message + Allow Retry
```

**State Transitions:**
- `prompt`: Updated on every keystroke
- `isHatching`: true during generation, false otherwise
- `hatchedDuck`: null initially, populated on success, cleared on "Generate Another"
- `duckError`: null initially, populated on error, cleared on new generation

### Performance Considerations

- Image generation typically takes 5-15 seconds
- Use loading indicators to manage user expectations
- Implement request timeout (30 seconds) to prevent hanging
- Fallback system ensures users always get a duck image
- Base64 encoding keeps images self-contained but increases payload size

### Accessibility

- Input field should have proper ARIA labels
- Loading state should announce to screen readers
- Error messages should be announced to screen readers
- Images should have descriptive alt text
- Buttons should have clear, descriptive labels

### Browser Compatibility

- Target modern browsers (Chrome, Firefox, Safari, Edge)
- Use standard fetch API (no polyfills needed for modern browsers)
- Base64 image data URLs supported in all modern browsers
- CSS Grid/Flexbox for layout (widely supported)
