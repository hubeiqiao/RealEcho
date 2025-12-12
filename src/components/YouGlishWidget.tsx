'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface YGWidgetInstance {
  fetch: (query: string, language: string) => void;
  next: () => void;
  previous: () => void;
  pause: () => void;
  play: () => void;
}

interface YGWidgetOptions {
  width?: number;
  components?: number;
  events?: {
    onFetchDone?: (event: { totalResult: number }) => void;
    onVideoChange?: (event: { index: number }) => void;
    onCaptionConsumed?: (event: { index: number }) => void;
  };
}

declare global {
  interface Window {
    onYouglishAPIReady?: () => void;
    YG?: {
      Widget: new (containerId: string, options: YGWidgetOptions) => YGWidgetInstance;
      getWidget: (id: string) => unknown;
    };
  }
}

interface YouGlishWidgetProps {
  word: string;
  onClose?: () => void;
}

export function YouGlishWidget({ word, onClose }: YouGlishWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<YGWidgetInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scriptLoadedRef = useRef(false);

  const initWidget = useCallback(() => {
    if (!window.YG || !containerRef.current) return;

    try {
      widgetRef.current = new window.YG.Widget('youglish-container', {
        width: 480,
        components: 9,
        events: {
          onFetchDone: (event) => {
            setIsLoading(false);
            if (event.totalResult === 0) {
              setError(`No pronunciation videos found for "${word}"`);
            } else {
              setTotalResults(event.totalResult);
              setCurrentIndex(1);
            }
          },
          onVideoChange: (event) => {
            setCurrentIndex(event.index + 1);
          },
        },
      });
      widgetRef.current.fetch(word, 'english');
    } catch {
      setError('Failed to initialize YouGlish widget');
      setIsLoading(false);
    }
  }, [word]);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setTotalResults(null);

    if (window.YG) {
      initWidget();
      return;
    }

    if (!scriptLoadedRef.current) {
      scriptLoadedRef.current = true;

      window.onYouglishAPIReady = () => {
        initWidget();
      };

      const script = document.createElement('script');
      script.src = 'https://youglish.com/public/emb/widget.js';
      script.async = true;
      script.onerror = () => {
        setError('Failed to load YouGlish widget');
        setIsLoading(false);
      };
      document.body.appendChild(script);
    }
  }, [word, initWidget]);

  const handleNext = useCallback(() => {
    widgetRef.current?.next();
  }, []);

  const handlePrevious = useCallback(() => {
    widgetRef.current?.previous();
  }, []);

  return (
    <div className="bg-white rounded-lg border shadow-lg overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="font-medium">Pronunciation: &quot;{word}&quot;</span>
          {totalResults !== null && (
            <span className="text-sm text-muted-foreground">
              ({currentIndex} of {totalResults})
            </span>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Loading pronunciation videos...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="text-center p-4">
              <div className="text-red-500 mb-2">{error}</div>
              <button
                onClick={onClose}
                className="text-sm text-blue-500 hover:underline"
              >
                Close
              </button>
            </div>
          </div>
        )}

        <div
          id="youglish-container"
          ref={containerRef}
          className="min-h-[300px]"
        />
      </div>

      {totalResults !== null && totalResults > 1 && (
        <div className="flex items-center justify-center gap-4 p-3 border-t">
          <button
            onClick={handlePrevious}
            disabled={currentIndex <= 1}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex >= totalResults}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}

      <div className="text-xs text-center text-muted-foreground p-2 border-t bg-gray-50">
        Powered by <a href="https://youglish.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">YouGlish.com</a>
      </div>
    </div>
  );
}
