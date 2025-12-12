'use client';

import { useCallback } from 'react';
import type { WordAssessment } from '@/lib/pronunciation-types';
import { getScoreBgColor, getScoreColor } from '@/lib/analysis-helpers';

interface TextHighlighterProps {
  words: WordAssessment[];
  selectedWord: WordAssessment | null;
  onWordClick: (word: WordAssessment) => void;
}

export function TextHighlighter({
  words,
  selectedWord,
  onWordClick,
}: TextHighlighterProps) {
  const handleWordClick = useCallback(
    (word: WordAssessment) => {
      onWordClick(word);
    },
    [onWordClick]
  );

  if (!words.length) {
    return (
      <div className="text-muted-foreground text-center py-8">
        No words to display
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg border">
      <div className="flex flex-wrap gap-1 leading-relaxed text-lg">
        {words.map((word, index) => {
          const isSelected = selectedWord?.word === word.word && selectedWord?.offset === word.offset;
          const bgColor = getScoreBgColor(word.accuracyScore);
          const textColor = getScoreColor(word.accuracyScore);

          return (
            <button
              key={`${word.word}-${word.offset}-${index}`}
              onClick={() => handleWordClick(word)}
              className={`
                px-2 py-1 rounded transition-all cursor-pointer
                ${bgColor}
                ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
              `}
              title={`Score: ${word.accuracyScore.toFixed(0)}%`}
            >
              <span className={textColor}>{word.word}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 rounded" />
          <span>Good (80-100)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-100 rounded" />
          <span>Okay (60-79)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 rounded" />
          <span>Needs Work (&lt;60)</span>
        </div>
      </div>
    </div>
  );
}
