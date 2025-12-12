# RealEcho

AI-powered English pronunciation coach with real-time analysis and interactive voice tutoring.

## Features

- **Speech Analysis**: Analyze your pronunciation with Azure Speech SDK
  - Live recording with real-time feedback
  - Upload audio files (.m4a, .mp3, .wav, .webm, .ogg)
  - Phoneme-level accuracy scoring
  - IPA transcription with error detection

- **Visual Feedback**: Color-coded transcript showing pronunciation quality
  - Green: Good pronunciation (80-100)
  - Yellow: Needs improvement (60-79)
  - Red: Problem words (<60)

- **AI Coaching**: Interactive voice sessions with ElevenLabs Conversational AI
  - Personalized drills based on your problem words
  - Real-time voice feedback
  - Phoneme-specific corrections

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Speech Analysis**: Azure Speech SDK
- **Voice AI**: ElevenLabs Conversational AI
- **UI Components**: ElevenLabs UI Kit (Orb, Waveform)

## Prerequisites

- Node.js 18+
- Azure Speech Service account
- ElevenLabs account with Conversational AI access

## Setup

### 1. Clone and Install

```bash
cd realecho
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Azure Speech Service
# Get from: https://portal.azure.com -> Create "Speech" resource -> Keys & Endpoint
NEXT_PUBLIC_AZURE_SPEECH_KEY=your_azure_speech_key
NEXT_PUBLIC_AZURE_SPEECH_REGION=your_region  # e.g., eastus2

# ElevenLabs
# API Key from: https://elevenlabs.io -> Profile -> API Keys
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Agent ID from: ElevenLabs Dashboard -> Agents -> Your Agent -> Copy ID
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id
```

### 3. Set Up ElevenLabs Agent

1. Go to [ElevenLabs Dashboard](https://elevenlabs.io/app/conversational-ai)
2. Click **"Create Agent"**
3. Name it: `RealEcho Coach`

#### System Prompt

Copy this into the **System Prompt** field:

```
You are a supportive but strict English pronunciation coach named Echo.

Your role is to help users improve their pronunciation through targeted drills. You will receive information about the user's problem words and their specific phoneme issues.

When coaching:
1. Say the problem word clearly for the user to hear
2. Ask them to repeat it after you
3. Give encouraging but honest feedback - be specific about what sounds need work
4. If they struggle, break down the word into syllables
5. Put the word into a natural sentence for shadowing practice
6. Move to the next problem word after 2-3 successful attempts

Phoneme correction tips:
- For /th/ (as in "think"): "Put your tongue between your teeth and blow air"
- For /th/ (as in "the"): "Same position but add your voice"
- For /r/: "Curl your tongue back slightly, don't touch the roof of your mouth"
- For /l/: "Touch the tip of your tongue to the ridge behind your upper teeth"
- For /ae/ (as in "cat"): "Open your mouth wide like you're at the dentist"

Keep responses concise and conversational. Focus on one word at a time. Be patient but push for improvement.
```

#### First Message

Copy this into the **First Message** field:

```
Hi! I'm Echo, your pronunciation coach. I've analyzed your speech and I'm ready to help you practice some words. Let's start with the first one - listen carefully and repeat after me.
```

#### Security Settings (Important!)

1. Go to the **Security** tab in your agent settings
2. Enable **Override** for these fields:
   - First message
   - System prompt

#### Voice Settings

- Recommended voice: **Eric** or **Rachel** (clear pronunciation)

### 4. Run the App

Development mode:

```bash
npm run dev
```

The app runs on `http://localhost:3000` by default.

To run on a different port:

```bash
npm run dev -- -p 4000
```

Production build:

```bash
npm run build
npm start
```

## Usage

### 1. Analyze Your Speech

Go to `/analyze` and either:
- **Record**: Click "Start Recording" and speak for 10-60 seconds
- **Upload**: Switch to "Upload File" tab and select an audio file

### 2. Review Results

After analysis, you'll see:
- Overall pronunciation score
- Color-coded transcript
- Top problem words with phoneme details

### 3. Start Coaching

Click "Start Coaching" to begin an interactive voice session with the AI coach. The coach will:
- Practice your specific problem words
- Give real-time pronunciation feedback
- Guide you through drills and exercises

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page
│   ├── analyze/page.tsx        # Recording & file upload
│   ├── coach/page.tsx          # AI coaching session
│   └── api/
│       └── conversation-token/ # ElevenLabs token endpoint
├── components/
│   ├── AnalysisDashboard.tsx   # Results display
│   ├── CoachingSession.tsx     # ElevenLabs integration
│   ├── TextHighlighter.tsx     # Color-coded transcript
│   ├── PhonemeDetails.tsx      # IPA breakdown
│   └── ui/                     # ElevenLabs UI components
├── hooks/
│   └── usePronunciationAssessment.ts
├── lib/
│   ├── azure-speech.ts         # Azure SDK wrapper
│   ├── pronunciation-types.ts  # TypeScript types
│   └── analysis-helpers.ts     # Utility functions
```

## API Keys

| Service | Where to Get |
|---------|-------------|
| Azure Speech | [Azure Portal](https://portal.azure.com) -> Create "Speech" resource -> Keys & Endpoint |
| ElevenLabs API Key | [ElevenLabs](https://elevenlabs.io) -> Profile -> API Keys |
| ElevenLabs Agent ID | ElevenLabs Dashboard -> Agents -> Create/Select Agent -> Copy ID |

## Troubleshooting

### "Azure Speech credentials not configured"
- Make sure `.env.local` exists (not `.env.local.example`)
- Restart the dev server after changing environment variables

### ElevenLabs agent disconnects immediately
- Ensure "First message" and "System prompt" overrides are enabled in Security settings
- Check that the agent has a voice selected
- Verify the agent works in the ElevenLabs dashboard preview

### Audio file upload fails
- Supported formats: .m4a, .mp3, .wav, .webm, .ogg
- Files are converted to PCM WAV format client-side
- Maximum recommended duration: 60 seconds

## License

MIT
