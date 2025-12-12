# RealEcho - Hackathon Submission

## Project Overview

### Title
**RealEcho** - AI-Powered English Pronunciation Coach

### Problem
Non-native English speakers often struggle with pronunciation, particularly with specific phonemes and word sounds. Traditional language learning apps provide limited feedback, and human tutors are expensive and not always accessible. Learners need:
- Detailed, phoneme-level feedback on their pronunciation
- Personalized practice based on their specific problem areas
- Interactive, real-time coaching that adapts to their needs

### Solution
RealEcho is an AI-powered pronunciation coaching platform that combines:
1. **Precision Analysis**: Azure Speech SDK analyzes speech at the phoneme level, providing IPA transcriptions and accuracy scores
2. **Visual Feedback**: Color-coded transcripts instantly show which words need improvement
3. **Interactive AI Coaching**: ElevenLabs Conversational AI provides real-time voice feedback and runs personalized pronunciation drills

Users can record their speech or upload audio files, receive detailed analysis with problem word identification, and then practice with an AI coach that gives specific phoneme-level corrections.

## Team Information

- **Hu Beiqiao** (GitHub: [@hubeiqiao](https://github.com/hubeiqiao))
  - Role: Full-stack development, system architecture

## Tech Stack

### Frontend Framework
- **Next.js 16** (App Router) - React framework with server-side rendering
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling

### Speech & AI Services
- **Azure Speech SDK** - Pronunciation assessment with phoneme-level analysis
- **ElevenLabs Conversational AI** - Real-time voice coaching and feedback
- **ElevenLabs React SDK** - WebSocket/WebRTC integration for voice conversations

### UI Components
- **ElevenLabs UI Kit** - Orb, Waveform, Voice Button components
- **Custom components** - Analysis dashboard, text highlighter, phonetic cards

### Audio Processing
- **Web Audio API** - Client-side audio format conversion (.m4a, .mp3 to PCM WAV)
- **Microsoft Cognitive Services Speech SDK** - Continuous recognition for live streaming

## GitHub Repository

**Repository URL**: [https://github.com/hubeiqiao/RealEcho](https://github.com/hubeiqiao/RealEcho)

### Key Files
- `README.md` - Complete setup and usage instructions
- `ELEVENLABS_AGENT_SETUP.md` - Detailed ElevenLabs agent configuration guide
- `src/lib/azure-speech.ts` - Azure SDK integration
- `src/components/CoachingSession.tsx` - ElevenLabs Conversational AI integration
- `src/app/analyze/page.tsx` - Recording and file upload interface

### Setup Instructions
Complete setup guide available in the repository README, including:
- Environment variable configuration
- Azure Speech Service setup
- ElevenLabs agent creation and configuration
- Development and production build commands

## Demo Video

🎥 **Demo Video**: [Link to demo video]

*A 2-minute walkthrough demonstrating:*
1. Recording/uploading audio for pronunciation analysis
2. Viewing detailed results with color-coded transcript
3. Interactive AI coaching session with real-time feedback

## Tools & APIs Used

### Primary APIs
- **Azure Speech Service** ([Official Docs](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/))
  - Purpose: Real-time pronunciation assessment
  - Features used: Continuous recognition, phoneme analysis, IPA transcription
  - License: Commercial (requires Azure subscription)

- **ElevenLabs Conversational AI** ([Official Docs](https://elevenlabs.io/docs/conversational-ai))
  - Purpose: Interactive voice coaching
  - Features used: WebSocket connections, agent overrides, real-time audio streaming
  - License: Commercial (requires ElevenLabs subscription)

### Open Source Libraries

#### Core Framework
- **Next.js** - MIT License
  - Version: 16.0.10
  - Purpose: React framework with App Router
  - Repository: [vercel/next.js](https://github.com/vercel/next.js)

- **React** - MIT License
  - Version: 19.0.0
  - Purpose: UI component library
  - Repository: [facebook/react](https://github.com/facebook/react)

- **TypeScript** - Apache 2.0 License
  - Version: 5.x
  - Purpose: Type-safe JavaScript
  - Repository: [microsoft/TypeScript](https://github.com/microsoft/TypeScript)

#### Styling & UI
- **Tailwind CSS** - MIT License
  - Version: 3.4.1
  - Purpose: Utility-first CSS framework
  - Repository: [tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss)

- **class-variance-authority** - Apache 2.0 License
  - Purpose: Component variant management
  - Repository: [joe-bell/cva](https://github.com/joe-bell/cva)

- **clsx** - MIT License
  - Purpose: Conditional className construction
  - Repository: [lukeed/clsx](https://github.com/lukeed/clsx)

#### Speech & AI SDKs
- **microsoft-cognitiveservices-speech-sdk** - MIT License
  - Version: 1.41.1
  - Purpose: Azure Speech Service integration
  - Repository: [Azure-Samples/cognitive-services-speech-sdk](https://github.com/Azure-Samples/cognitive-services-speech-sdk)

- **@elevenlabs/react** - MIT License
  - Version: 0.12.1
  - Purpose: ElevenLabs Conversational AI React integration
  - Repository: [elevenlabs/packages](https://github.com/elevenlabs/packages)

#### Development Tools
- **ESLint** - MIT License
  - Purpose: Code linting and quality
  - Repository: [eslint/eslint](https://github.com/eslint/eslint)

- **PostCSS** - MIT License
  - Purpose: CSS processing
  - Repository: [postcss/postcss](https://github.com/postcss/postcss)

### Browser APIs Used
- **Web Audio API** - Browser standard
  - Purpose: Audio decoding and PCM conversion for file uploads
  - Documentation: [MDN Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

- **MediaDevices API** - Browser standard
  - Purpose: Microphone access for live recording
  - Documentation: [MDN MediaDevices](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices)

## Key Features

### 1. Multi-Input Speech Analysis
- **Live Recording**: Real-time streaming to Azure with continuous recognition
- **File Upload**: Support for .m4a, .mp3, .wav, .webm, .ogg formats
- **Audio Processing**: Client-side conversion to PCM WAV format

### 2. Detailed Pronunciation Feedback
- **Phoneme-level Analysis**: IPA transcription with accuracy scores
- **Visual Feedback**: Color-coded transcript (green/yellow/red)
- **Problem Word Detection**: Automatic identification of top 3 challenging words
- **Syllable Breakdown**: Detailed phoneme analysis per word

### 3. Interactive AI Coaching
- **Voice-based Coaching**: Real-time conversation with AI tutor
- **Personalized Drills**: Focused practice on user's problem words
- **Dynamic Prompts**: Context-aware coaching based on specific phoneme errors
- **Immersive UI**: Orb-based interface with audio-reactive visualizations

## Technical Highlights

### Real-time Audio Streaming
- Continuous recognition using Azure Speech SDK for live input
- WebSocket connection to ElevenLabs for bidirectional voice communication
- Efficient audio buffer management and stream handling

### Client-side Audio Processing
- Web Audio API decoding for multiple audio formats
- PCM conversion (16kHz, 16-bit, mono) for Azure compatibility
- No server-side processing required for audio conversion

### Dynamic AI Agent Configuration
- Runtime prompt injection using ElevenLabs overrides
- Phoneme-specific coaching instructions based on analysis results
- Security-configured agent with override permissions

### Responsive Architecture
- Server-side rendering with Next.js App Router
- Client-side state management for real-time interactions
- Optimized component hierarchy for performance

## Deployment

The application can be deployed on:
- **Vercel** (recommended for Next.js)
- **Any Node.js hosting** with npm support
- **Docker** (containerized deployment)

Environment variables required:
- `NEXT_PUBLIC_AZURE_SPEECH_KEY`
- `NEXT_PUBLIC_AZURE_SPEECH_REGION`
- `ELEVENLABS_API_KEY`
- `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`

## Future Enhancements

- Multi-language support (Spanish, French, Mandarin)
- Progress tracking and learning analytics
- Sentence-level fluency exercises
- Social features (practice with peers)
- Offline mode with local speech processing
- Mobile app (React Native)

## License

MIT License - See [LICENSE](LICENSE) file for details

---

**Built with ❤️ using ElevenLabs Conversational AI and Azure Speech Services**
