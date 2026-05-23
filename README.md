# Personal AI Assistant (JARVIS-inspired)

A full-stack personal AI assistant with a React frontend and Node.js backend.

## Project Structure

jarvise/
├── Jarvis/        # Frontend (React + Vite)
├── Signinback/    # Backend (Node.js)

## What works now
- Text chat with AI reply generation
- Voice input using browser speech recognition
- Voice output using browser speech synthesis
- Saved commands with localStorage persistence
- Open or execute saved commands from chat

## Recommended API setup
For easiest configuration, use a Groq or OpenAI API key.
If you already have a Google Gemini key, that also works.

### Backend environment
Create `Signinback/.env` from `.env.example` and set at least one key:
- `GROQ_API_KEY=your_groq_api_key`
- or `OPENAI_API_KEY=your_openai_api_key`
- or `GEMINI_API_KEY=your_google_gemini_api_key`
- `CLIENT_ORIGIN=http://localhost:5173`
- `PORT=5000`

### Run backend
```bash
cd Signinback
npm install
npm run dev
```

### Run frontend
```bash
cd Jarvis
npm install
npm run dev
```

Then open the frontend URL shown by Vite (usually `http://localhost:5173`).

## Notes
- The chat page is the main AI interface.
- The command manager saves phrases and URLs to `localStorage`.
- If your browser supports voice, click the mic button and speak.
- The app will automatically use `OPENAI_API_KEY` first if set, otherwise it will use `GEMINI_API_KEY`.
