# NeoVest Backend Server

Welcome to the backend for NeoVest, the intelligent personal finance assistant. This server is responsible for handling business logic, data processing, third-party API integrations, and generating AI-powered financial insights for the NeoVest application.

## Tech Stack

- **Framework:** FastAPI
- **Database & Auth:** Google Firebase (Firestore & Firebase Admin SDK)
- **AI / Generative Language Model:** Google Gemini API
- **Market Data:** Alpha Vantage API
- **Background Tasks:** Redis (planned for asynchronous operations)
- **Language:** Python 3.8+

## Architecture Overview

This server acts as the central brain for the NeoVest platform. The Next.js frontend communicates with this server via a REST API. The server is responsible for:

1.  **Secure Authentication:** Validating user identity using Firebase ID tokens on protected routes.
2.  **Data Persistence:** Interacting with Firestore to create, read, update, and delete user financial data (expenses, budgets, investments).
3.  **Third-Party Integrations:** Fetching real-time stock market data from Alpha Vantage.
4.  **AI-Powered Insights:** Orchestrating the analysis of user financial data to generate personalized recommendations using the Google Gemini API.

---

## AI Insights Pipeline: Implementation Plan

This section outlines the process for implementing the core AI feature: analyzing a user's financial data to provide actionable insights. This entire process should be implemented on the backend to protect API keys and manage complex logic.

### 1. Goal

To create an automated pipeline that:
- Fetches a user's expenses, budgets, and investments.
- Sends this data to Google's Gemini model with a carefully engineered prompt.
- Receives personalized financial insights.
- Saves these insights back to the user's profile in Firestore.

### 2. Setup & Configuration

Before implementation, the environment must be configured.

- **Install Library:** Add `google-generativeai` to the `server/requirements.txt` file and install it.
- **API Key:** Add your `GEMINI_API_KEY` to the `.env` file. This key is used to authenticate requests to the Gemini API.

### 3. Backend Implementation Steps

#### Step 3.1: Create the API Endpoint

The frontend needs a way to trigger the analysis. Create a new authenticated endpoint for this purpose.

- **File:** `server/app/api/ai.py` (create this new file)
- **Endpoint:** `POST /api/ai/generate-insights`
- **Functionality:**
    - It must be a protected route that uses `Depends(get_current_user)` to get the authenticated user's ID.
    - This endpoint should trigger a background task (using Redis/Celery in production) to run the analysis, allowing the API to respond instantly with a `202 Accepted` status. For development, it can be run as a direct asynchronous call.

#### Step 3.2: Build the AI Service Logic

This is the core of the pipeline where the data processing and AI communication happen.

- **File:** `server/app/services/ai_service.py` (create this new file)
- **Function:** `generate_financial_insights_for_user(user_id: str)`
- **Logic:**
    1.  **Fetch Financial Data:** Use existing services to query Firestore and retrieve the user's recent expenses, active budgets, and current investments.
    2.  **Construct the Prompt:** This is the most critical step. Combine a **System Prompt** with the user's data.
        - **System Prompt:** Define the AI's persona ('Neo', a helpful financial analyst), its goal, and the rules it must follow (e.g., "Provide 3 actionable insights," "Be concise," "Use a supportive tone," "Format with emojis").
        - **User Data:** Format the fetched financial data into a clean, readable string or JSON structure to be included in the prompt.
    3.  **Call the Gemini API:**
        - Initialize the `genai` client using the `GEMINI_API_KEY`.
        - Select a model (e.g., `gemini-1.5-flash`).
        - Send the request to the API, passing the system prompt and user data.
    4.  **Process and Save the Response:**
        - Parse the text content from the Gemini API's response.
        - Create a new `AIRecommendation` document.
        - Use a Firestore service function (`save_user_recommendation`) to save the insight to the `recommendations` sub-collection under the user's document in Firestore.

### 4. Frontend Integration

Once the backend is complete, the frontend can trigger the pipeline.

- **File:** `client/src/lib/firestoreService.ts`
- **Function:** `generateFinancialInsights()`
- **Logic:**
    - This function makes a `POST` request to the `/api/ai/generate-insights` endpoint on the backend.
    - It includes the user's Firebase auth token in the `Authorization` header.
    - A button in the UI (e.g., "Generate My Insights") will call this function. The results can then be fetched separately using the existing `getUserRecommendations` function.

This plan ensures a secure, scalable, and robust implementation of the AI insights pipeline within the existing NeoVest architecture.
