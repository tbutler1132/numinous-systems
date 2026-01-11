# Expressions

Personalized philosophical artifacts powered by Claude.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Vercel Edge Function
- **Styling**: Vanilla CSS with theme switching
- **Markdown**: react-markdown

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file:
   ```bash
   ANTHROPIC_API_KEY=your_api_key_here
   ```

3. Run the dev server:
   ```bash
   vercel dev
   ```
   
   Or for frontend-only development:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000 (vercel dev) or http://localhost:5173 (npm run dev)

## Deployment

1. Link to Vercel (first time only):
   ```bash
   vercel link
   ```

2. Set the API key in Vercel:
   ```bash
   vercel env add ANTHROPIC_API_KEY
   ```

3. Deploy:
   ```bash
   vercel --prod
   ```

## Architecture

```
src/
  main.tsx           # React entry point
  App.tsx            # Main app with screen routing
  index.css          # All styles (including themes)
  types.ts           # Shared TypeScript types
  data/
    artifacts.ts     # Artifact definitions
  context/
    ProfileContext   # User profile state + localStorage
    ThemeContext     # Theme switching (machinic/organic)
  components/
    Spinner          # Loading indicator
    ContentBox       # Styled content container with reveal animation
    DevUsageOverlay  # Dev-only API usage tracker
  pages/
    Onboarding       # Profile questionnaire
    ArtifactSelect   # Artifact list
    ArtifactDetail   # Main view with tabs & generation
api/
  generate.ts        # Vercel Edge Function for Claude API
```

## How It Works

1. User answers 4 profile questions (onboarding)
2. User selects an artifact to explore
3. Artifact content is fetched from GitHub
4. User can generate a personalized ~600-word expression via Claude
5. User can toggle between machinic (AI) and organic (raw notes) views
6. Expressions are cached in localStorage (max 2 generations per artifact)
