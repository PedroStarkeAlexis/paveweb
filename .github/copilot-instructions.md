# .github/copilot-instructions.md
# Central PAVE AI Coding Instructions

This guide helps AI agents understand the architecture and conventions of the PAVE React application.

## Architecture Overview

The project is a React frontend (`src/`) powered by a serverless backend using Cloudflare Pages Functions (`functions/api/`).

-   **Frontend:** A standard Vite + React application using `react-router-dom` for navigation. Key UI components are in `src/features` and `src/components/common`.
-   **Backend:** Cloudflare Functions handle all API logic. The main entry point for the AI chat is `functions/api/ask.js`.
-   **Data Source:** The single source of truth for all PAVE questions is a remote worker. Backend functions **must** use `fetchAllQuestions` from `functions/api/utils/uploader.js` to retrieve question data. Do not read from local JSON files like `public/questoes.json` in backend logic.

## Core AI Logic & Data Flow

The main AI chat functionality in `functions/api/ask.js` follows a sophisticated two-step process. Understanding this is critical.

1.  **Analysis Step:** An initial call is made to the Gemini API using the prompt from `createAnalysisPrompt` (`functions/api/prompt.js`). This call determines the user's `intent` (e.g., `BUSCAR_QUESTAO`, `CRIAR_QUESTAO`, `CONVERSAR`) and extracts entities. For creation intents, it also generates the question/flashcard content in this first step.

2.  **Execution Step:** Based on the `intent` from step 1:
    -   **`BUSCAR_QUESTAO`**: A hybrid search is performed.
        1.  **Vector Search:** A query embedding is generated using `@cf/baai/bge-m3` (multilingual model supporting Portuguese) and used to find the top candidates from a Cloudflare Vectorize index (`env.QUESTIONS_INDEX`).
        2.  **AI Re-ranking:** The top candidates are sent to Gemini with `createQuestionReRankingPrompt` to select the most relevant questions.
    -   **`CRIAR_QUESTAO` / `CRIAR_FLASHCARDS`**: The JSON content generated during the *Analysis Step* is parsed and returned to the user.
    -   **`CONVERSAR` / `INFO_PAVE`**: The `responseText` from the *Analysis Step* is returned.

When modifying AI logic, always check `functions/api/prompt.js` first. The prompts are very specific and require structured JSON output from the model.

## Developer Workflows

-   **Local Development:**
    1.  Run the frontend with `npm run dev`.
    2.  Run the backend functions with `wrangler pages dev dist`.
    3.  You must copy `wrangler.toml.no` to `wrangler.toml` and configure the necessary Cloudflare bindings (`QUESTOES_PAVE_BUCKET`, `QUESTIONS_INDEX`, `AI`) and environment variables.
    the user use github repository to deploy, deploy when commit 
-   **Vector Search Indexing:** The search index is not updated automatically. After the source `questoes.json` file is updated, you must manually trigger the indexing process by sending a `POST` request to the `/api/index-questions` endpoint with the correct `X-Admin-Secret` header.

## Frontend Conventions

-   **Styling:** All components should use the CSS variables defined in `src/style.css` for colors, backgrounds, and borders (e.g., `var(--brand-primary)`, `var(--bg-secondary)`). This ensures consistency with the light/dark theme.
-   **Displaying Questions:** Always use the `src/components/common/QuestionLayout.jsx` component to render questions. It handles answer feedback, saving, and consistent styling across the app (chat, question bank, saved questions).
-   **State Management:**
    -   For saved questions, use the `useSavedQuestions` hook, which connects to the `SavedQuestionsContext`.
    -   For other features, state is generally managed within the relevant feature directory (`src/features/*`) or passed down from `App.jsx`.

### Key Files & Directories
-   `functions/api/ask.js`: The main AI chat orchestrator.
-   `functions/api/prompt.js`: Contains all core prompt engineering logic.
-   `functions/api/utils/uploader.js`: The unified function (`fetchAllQuestions`) for retrieving data.
-   `src/components/common/QuestionLayout.jsx`: The canonical component for displaying a question.
-   `src/style.css`: Defines the global design system and theme variables.