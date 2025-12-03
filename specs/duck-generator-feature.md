# Duck Generator Feature Spec 🦆

## Overview

Build a simple web UI that lets users describe their dream duck and see a generated duck image from the backend API.

## Requirements

- Input field for duck description.
- "Generate Duck" button to submit the description.
- Loading state with the message: **"Hatching your duck..."** while waiting for the API.
- Display the generated duck image returned from the backend.
- "Generate Another" button to let the user generate a new duck using a new description.
- Graceful error handling with friendly, duck-themed puns in error messages.

## UX Details

- The input should encourage duck-related descriptions (placeholder example: "Describe your dream duck...").
- Disable the "Generate Duck" button while a request is in progress.
- Show the loading text "Hatching your duck..." prominently during API calls.
- When an image is available, display it clearly with some spacing from the input.
- The "Generate Another" button should reset the state to allow entering a new description and generating again.
- On errors (network, backend, or validation), show a duck-pun message (e.g., "Quack! Something ruffled my feathers. Please try again.").

