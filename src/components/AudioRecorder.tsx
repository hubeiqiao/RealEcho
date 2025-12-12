'use client';

import { useCallback, useState } from 'react';
import { LiveWaveform } from '@/components/ui/live-waveform';
import { Button } from '@/components/ui/button';
import { formatDuration } from '@/lib/analysis-helpers';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  minDuration?: number;
  maxDuration?: number;
  disabled?: boolean;
}

export function AudioRecorder({
  onRecordingComplete,
  minDuration = 10,
  maxDuration = 60,
  disabled = false,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        onRecordingComplete(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setDuration(0);

      const id = setInterval(() => {
        setDuration((d) => {
          const newDuration = d + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);
      setIntervalId(id);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Microphone access denied. Please allow microphone access.');
    }
  }, [maxDuration, onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setIsRecording(false);
  }, [mediaRecorder, intervalId]);

  const canStop = duration >= minDuration;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full max-w-md">
        <LiveWaveform
          active={isRecording}
          height={80}
          mode="static"
          barColor="currentColor"
          className="text-blue-500"
        />
      </div>

      <div className="text-center">
        <div className="text-4xl font-mono font-bold">
          {formatDuration(duration * 1000)}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          {isRecording
            ? duration < minDuration
              ? `Keep speaking (min ${minDuration}s)`
              : `Recording... (max ${maxDuration}s)`
            : `Speak for ${minDuration}-${maxDuration} seconds`}
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <div className="flex gap-4">
        {!isRecording ? (
          <Button
            size="lg"
            onClick={startRecording}
            disabled={disabled}
            className="px-8"
          >
            Start Recording
          </Button>
        ) : (
          <Button
            size="lg"
            variant={canStop ? 'default' : 'secondary'}
            onClick={stopRecording}
            disabled={!canStop}
            className="px-8"
          >
            {canStop ? 'Stop Recording' : `Wait ${minDuration - duration}s...`}
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground text-center max-w-sm">
        Speak freely about anything for {minDuration}-{maxDuration} seconds.
        We&apos;ll analyze your pronunciation.
      </p>
    </div>
  );
}
