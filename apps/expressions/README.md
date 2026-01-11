# Expressions

Personalized philosophical artifacts powered by Claude.

## Local Development

1. Install Vercel CLI if you haven't:
   ```bash
   npm i -g vercel
   ```

2. Create a `.env` file in this directory:
   ```bash
   ANTHROPIC_API_KEY=your_api_key_here
   ```

3. Run the dev server:
   ```bash
   vercel dev
   ```

4. Open http://localhost:3000

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

- `index.html` — All frontend code (vanilla JS, ~280 lines)
- `api/generate.js` — Vercel Edge Function that calls Claude
- `vercel.json` — Route configuration

## How It Works

1. User selects an artifact from the list
2. User answers 4 profile questions
3. API fetches artifact content from GitHub raw
4. Claude generates a personalized ~600-word expression
5. User can download as markdown or regenerate (max 2 per artifact)
