'use client';

import { useState, useCallback, useRef } from 'react';
import type { AssessmentResult, AssessmentState } from '@/lib/pronunciation-types';
import { createContinuousRecognizer, assessPronunciationFromFile } from '@/lib/azure-speech';

export function usePronunciationAssessment() {
  const [state, setState] = useState<AssessmentState>({
    isAssessing: false,
    result: null,
    error: null,
  });

  const reset = useCallback(() => {
    setState({ isAssessing: false, result: null, error: null });
  }, []);

  return {
    ...state,
    reset,
  };
}

export function useLiveAssessment() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const recognizerRef = useRef<{ start: () => Promise<void>; stop: () => Promise<void> } | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setResults([]);
      setDuration(0);

      recognizerRef.current = createContinuousRecognizer(
        (result) => {
          setResults((prev) => [...prev, result]);
        },
        (err) => {
          setError(err.message);
        }
      );

      await recognizerRef.current.start();
      setIsRecording(true);

      intervalRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsRecording(false);
    setIsProcessing(true);

    try {
      if (recognizerRef.current) {
        await recognizerRef.current.stop();
        recognizerRef.current = null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop recording');
    }

    setIsProcessing(false);
  }, []);

  // Combine all results into one
  const combinedResult: AssessmentResult | null = results.length > 0 ? {
    recognizedText: results.map(r => r.recognizedText).join(' '),
    overallScore: results.reduce((sum, r) => sum + r.overallScore, 0) / results.length,
    accuracyScore: results.reduce((sum, r) => sum + r.accuracyScore, 0) / results.length,
    fluencyScore: results.reduce((sum, r) => sum + r.fluencyScore, 0) / results.length,
    prosodyScore: results.reduce((sum, r) => sum + r.prosodyScore, 0) / results.length,
    words: results.flatMap(r => r.words),
    topProblemWords: results
      .flatMap(r => r.words)
      .filter(w => w.errorType !== 'None' || w.accuracyScore < 80)
      .sort((a, b) => a.accuracyScore - b.accuracyScore)
      .slice(0, 3),
  } : null;

  const reset = useCallback(() => {
    setResults([]);
    setDuration(0);
    setError(null);
  }, []);

  return {
    isRecording,
    isProcessing,
    duration,
    result: combinedResult,
    error,
    startRecording,
    stopRecording,
    reset,
  };
}

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
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
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setDuration(0);
      setAudioBlob(null);

      const id = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
      setIntervalId(id);
    } catch (err) {
      console.error('Failed to start recording:', err);
      throw err;
    }
  }, []);

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

  const reset = useCallback(() => {
    setAudioBlob(null);
    setDuration(0);
  }, []);

  return {
    isRecording,
    duration,
    audioBlob,
    startRecording,
    stopRecording,
    reset,
  };
}

// Hook for file upload assessment
export function useFileAssessment() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const assessFile = useCallback(async (file: File) => {
    try {
      setIsProcessing(true);
      setError(null);
      setFileName(file.name);
      setResult(null);

      const assessmentResult = await assessPronunciationFromFile(file);
      setResult(assessmentResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process audio file');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setFileName(null);
  }, []);

  return {
    isProcessing,
    result,
    error,
    fileName,
    assessFile,
    reset,
  };
}
