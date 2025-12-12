'use client';

import { useState, useCallback, useEffect } from 'react';
import { useConversation } from '@elevenlabs/react';
import { Orb } from '@/components/ui/orb';
import { Button } from '@/components/ui/button';
import type { WordAssessment } from '@/lib/pronunciation-types';
import { buildCoachingPrompt, buildFirstMessage, formatPhonemeIssue } from '@/lib/analysis-helpers';

interface CoachingSessionProps {
  problemWords: WordAssessment[];
  onEnd: () => void;
}

type SessionStatus = 'idle' | 'connecting' | 'active' | 'ended' | 'error';

export function CoachingSession({ problemWords, onEnd }: CoachingSessionProps) {
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('idle');
  const [currentWord, setCurrentWord] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // TEST: Disable overrides temporarily to verify basic connection works
  // Once connection works, we'll re-enable overrides
  const conversation = useConversation({
    // overrides: {
    //   agent: {
    //     prompt: {
    //       prompt: buildCoachingPrompt(problemWords),
    //     },
    //     first_message: buildFirstMessage(problemWords),
    //   },
    // },
    onConnect: () => {
      console.log('Connected to ElevenLabs');
      setSessionStatus('active');
      if (problemWords.length > 0) {
        setCurrentWord(problemWords[0].word);
      }
    },
    onDisconnect: (details) => {
      console.log('Disconnected from ElevenLabs:', details);
      setSessionStatus('ended');
    },
    onError: (err) => {
      console.error('Conversation error:', err);
      setError(typeof err === 'string' ? err : JSON.stringify(err) || 'Connection error. Please try again.');
      setSessionStatus('error');
    },
    onModeChange: (mode) => {
      console.log('Mode changed:', mode);
    },
    onStatusChange: (status) => {
      console.log('Status changed:', status);
    },
    onMessage: (message) => {
      console.log('Message:', message);
      // Extract current word being practiced from agent messages
      if (message.source === 'ai') {
        const content = typeof message.message === 'string' ? message.message : '';
        // Check if agent mentions a specific problem word
        for (const word of problemWords) {
          if (content.toLowerCase().includes(word.word.toLowerCase())) {
            setCurrentWord(word.word);
            const issue = formatPhonemeIssue(word);
            if (issue) {
              setFeedback(`Focus: ${issue}`);
            }
            break;
          }
        }
      }
    },
  });

  const startSession = useCallback(async () => {
    try {
      setSessionStatus('connecting');
      setError(null);

      // Request microphone permission first (required by SDK)
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get signed URL from our API
      const response = await fetch('/api/conversation-token');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get conversation token');
      }
      const data = await response.json();

      console.log('API response:', data);

      if (!data.signedUrl && !data.agentId) {
        throw new Error('No signed URL or agent ID received from server');
      }

      console.log('Starting session with signedUrl + websocket');

      // signedUrl requires connectionType: 'websocket' per ElevenLabs docs
      if (data.signedUrl) {
        await conversation.startSession({
          signedUrl: data.signedUrl,
          connectionType: 'websocket',
        });
      } else {
        await conversation.startSession({
          agentId: data.agentId,
          connectionType: 'webrtc',
        });
      }
    } catch (err) {
      console.error('Failed to start session:', err);
      setError(err instanceof Error ? err.message : 'Failed to start session');
      setSessionStatus('error');
    }
  }, [conversation]);

  const endSession = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch (err) {
      console.error('Error ending session:', err);
    }
    setSessionStatus('ended');
  }, [conversation]);

  // Cleanup on unmount only - empty deps array to prevent re-running on conversation changes
  useEffect(() => {
    return () => {
      // Only cleanup on actual unmount, not on conversation state changes
      conversation.endSession().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run cleanup on unmount

  const isSpeaking = conversation.isSpeaking;
  const isConnected = conversation.status === 'connected';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-black">
      {/* Main Orb */}
      <div className="relative w-80 h-80 mb-8">
        <Orb
          colors={isConnected ? (isSpeaking ? ['#3B82F6', '#EC4899'] : ['#6B7280', '#9CA3AF']) : ['#374151', '#4B5563']}
          agentState={isConnected ? (isSpeaking ? 'talking' : 'listening') : null}
          className="w-full h-full"
        />

        {/* Status indicator */}
        {sessionStatus === 'connecting' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Current word being practiced */}
      {currentWord && isConnected && (
        <div className="text-center mb-6">
          <div className="text-white/60 text-sm mb-1">Practicing:</div>
          <div className="text-4xl font-bold text-white">{currentWord}</div>
          {feedback && (
            <div className="text-blue-400 text-sm mt-2">{feedback}</div>
          )}
        </div>
      )}

      {/* Status text */}
      <div className="text-center mb-8">
        {sessionStatus === 'idle' && (
          <p className="text-white/80">
            Ready to practice {problemWords.length} word{problemWords.length !== 1 ? 's' : ''}
          </p>
        )}
        {sessionStatus === 'connecting' && (
          <p className="text-white/80">Connecting to your coach...</p>
        )}
        {sessionStatus === 'active' && (
          <p className="text-white/60 text-sm">
            {isSpeaking ? 'Coach is speaking...' : 'Your turn - speak clearly'}
          </p>
        )}
        {sessionStatus === 'ended' && (
          <p className="text-white/80">Session ended</p>
        )}
        {error && (
          <p className="text-red-400">{error}</p>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        {sessionStatus === 'idle' && (
          <Button
            size="lg"
            onClick={startSession}
            className="bg-blue-500 hover:bg-blue-600 text-white px-8"
          >
            Start Coaching
          </Button>
        )}

        {sessionStatus === 'connecting' && (
          <Button size="lg" disabled className="px-8">
            Connecting...
          </Button>
        )}

        {sessionStatus === 'active' && (
          <Button
            size="lg"
            variant="destructive"
            onClick={endSession}
            className="px-8"
          >
            End Session
          </Button>
        )}

        {(sessionStatus === 'ended' || sessionStatus === 'error') && (
          <>
            <Button
              size="lg"
              onClick={startSession}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8"
            >
              Try Again
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={onEnd}
              className="px-8 border-white/20 text-white hover:bg-white/10"
            >
              Back to Results
            </Button>
          </>
        )}
      </div>

      {/* Problem words list */}
      {isConnected && problemWords.length > 0 && (
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {problemWords.map((word, index) => (
            <span
              key={`${word.word}-${index}`}
              className={`
                px-3 py-1 rounded-full text-sm
                ${currentWord === word.word
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-white/60'
                }
              `}
            >
              {word.word}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
