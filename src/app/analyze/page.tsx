'use client';

import { useCallback, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnalysisDashboard } from '@/components/AnalysisDashboard';
import { Button } from '@/components/ui/button';
import { LiveWaveform } from '@/components/ui/live-waveform';
import { useLiveAssessment, useFileAssessment } from '@/hooks/usePronunciationAssessment';

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

type InputMode = 'record' | 'upload';

export default function AnalyzePage() {
  const router = useRouter();
  const [inputMode, setInputMode] = useState<InputMode>('record');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const liveAssessment = useLiveAssessment();
  const fileAssessment = useFileAssessment();

  // Use the active assessment based on mode
  const isRecording = liveAssessment.isRecording;
  const isProcessing = inputMode === 'record' ? liveAssessment.isProcessing : fileAssessment.isProcessing;
  const duration = liveAssessment.duration;
  const result = inputMode === 'record' ? liveAssessment.result : fileAssessment.result;
  const error = inputMode === 'record' ? liveAssessment.error : fileAssessment.error;

  const handleStartCoaching = useCallback(() => {
    if (result) {
      sessionStorage.setItem('assessmentResult', JSON.stringify(result));
      router.push('/coach');
    }
  }, [result, router]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      fileAssessment.assessFile(file);
    }
  }, [fileAssessment]);

  const handleReset = useCallback(() => {
    liveAssessment.reset();
    fileAssessment.reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [liveAssessment, fileAssessment]);

  const canStop = duration >= 10;
  const hasResult = result && result.words.length > 0;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Real<span className="text-blue-500">Echo</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Input UI */}
        {!hasResult && (
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-center mb-2">
              Analyze Your Pronunciation
            </h1>
            <p className="text-center text-muted-foreground mb-8">
              Record your speech or upload an audio file for analysis.
            </p>

            {/* Mode Toggle */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex rounded-lg border bg-white p-1">
                <button
                  onClick={() => setInputMode('record')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    inputMode === 'record'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Record
                </button>
                <button
                  onClick={() => setInputMode('upload')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    inputMode === 'upload'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Upload File
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-8">
              {/* Recording Mode */}
              {inputMode === 'record' && (
                <>
                  {/* Waveform */}
                  <div className="mb-6">
                    <LiveWaveform
                      active={isRecording}
                      processing={isProcessing}
                      height={80}
                      mode="static"
                      barColor="currentColor"
                      className="text-blue-500"
                    />
                  </div>

                  {/* Timer */}
                  <div className="text-center mb-6">
                    <div className="text-5xl font-mono font-bold">
                      {formatDuration(duration)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                      {isRecording
                        ? duration < 10
                          ? `Keep speaking (min 10s)`
                          : `Recording... (max 60s)`
                        : isProcessing
                        ? 'Processing...'
                        : 'Click to start recording'}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex justify-center gap-4">
                    {!isRecording && !isProcessing && (
                      <Button size="lg" onClick={liveAssessment.startRecording} className="px-8">
                        Start Recording
                      </Button>
                    )}

                    {isRecording && (
                      <Button
                        size="lg"
                        variant={canStop ? 'default' : 'secondary'}
                        onClick={liveAssessment.stopRecording}
                        disabled={!canStop}
                        className="px-8"
                      >
                        {canStop ? 'Stop & Analyze' : `Wait ${10 - duration}s...`}
                      </Button>
                    )}

                    {isProcessing && (
                      <Button size="lg" disabled className="px-8">
                        <span className="animate-pulse">Processing...</span>
                      </Button>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground text-center mt-6">
                    Speak about anything - your day, a story, or describe what you see.
                  </p>
                </>
              )}

              {/* Upload Mode */}
              {inputMode === 'upload' && (
                <>
                  <div className="text-center">
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".m4a,.mp3,.wav,.webm,.ogg"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {/* Upload area */}
                    {!isProcessing && !fileAssessment.fileName && (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-xl p-12 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                      >
                        <div className="text-4xl mb-4">🎵</div>
                        <p className="text-lg font-medium text-gray-700 mb-2">
                          Click to upload audio file
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Supports .m4a, .mp3, .wav, .webm, .ogg
                        </p>
                      </div>
                    )}

                    {/* Processing state */}
                    {isProcessing && (
                      <div className="py-12">
                        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-lg font-medium">Processing {fileAssessment.fileName}...</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Converting and analyzing your audio
                        </p>
                      </div>
                    )}

                    {/* File selected but not yet result */}
                    {fileAssessment.fileName && !isProcessing && !fileAssessment.result && (
                      <div className="py-8">
                        <p className="text-lg font-medium mb-4">Selected: {fileAssessment.fileName}</p>
                        <Button onClick={() => fileInputRef.current?.click()}>
                          Choose Different File
                        </Button>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground text-center mt-6">
                    Upload a recording of yourself speaking English (10-60 seconds recommended).
                  </p>
                </>
              )}

              {/* Error */}
              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-center">
                  {error}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results */}
        {hasResult && (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">Your Results</h1>
              <Button variant="outline" onClick={handleReset}>
                New Analysis
              </Button>
            </div>
            <AnalysisDashboard
              result={result}
              onStartCoaching={handleStartCoaching}
            />
          </div>
        )}
      </div>
    </main>
  );
}
