'use client';

import type { WordAssessment } from '@/lib/pronunciation-types';
import { findWorstPhoneme, getPhonemeComparison, getScoreColor } from '@/lib/analysis-helpers';

interface PhoneticCardProps {
  word: WordAssessment;
  onWatchClick?: () => void;
}

export function PhoneticCard({ word, onWatchClick }: PhoneticCardProps) {
  const worstPhoneme = findWorstPhoneme(word);
  const comparison = worstPhoneme ? getPhonemeComparison(worstPhoneme) : null;

  return (
    <div className="bg-white rounded-lg border p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-bold">{word.word}</h3>
          <div className={`text-sm ${getScoreColor(word.accuracyScore)}`}>
            Accuracy: {word.accuracyScore.toFixed(0)}%
          </div>
        </div>
        {word.errorType !== 'None' && (
          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
            {word.errorType}
          </span>
        )}
      </div>

      {comparison && worstPhoneme && worstPhoneme.accuracyScore < 70 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-muted-foreground mb-2">Phoneme Issue</div>
          <div className="flex items-center gap-4 text-xl">
            {comparison.actual ? (
              <>
                <div className="text-center">
                  <div className="text-red-500 font-mono text-2xl">/{comparison.actual}/</div>
                  <div className="text-xs text-muted-foreground">You said</div>
                </div>
                <div className="text-2xl text-gray-400">→</div>
                <div className="text-center">
                  <div className="text-green-500 font-mono text-2xl">/{comparison.expected}/</div>
                  <div className="text-xs text-muted-foreground">Should be</div>
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="text-yellow-600 font-mono text-2xl">/{comparison.expected}/</div>
                <div className="text-xs text-muted-foreground">
                  Difficulty with this sound (Score: {worstPhoneme.accuracyScore.toFixed(0)}%)
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {word.phonemes.length > 0 && (
        <div className="mt-4">
          <div className="text-sm text-muted-foreground mb-2">All Phonemes</div>
          <div className="flex flex-wrap gap-1">
            {word.phonemes.map((phoneme, index) => (
              <span
                key={`${phoneme.phoneme}-${index}`}
                className={`
                  px-2 py-1 rounded text-sm font-mono
                  ${phoneme.accuracyScore >= 80
                    ? 'bg-green-100 text-green-700'
                    : phoneme.accuracyScore >= 60
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                  }
                `}
                title={`Score: ${phoneme.accuracyScore.toFixed(0)}%`}
              >
                /{phoneme.phoneme}/
              </span>
            ))}
          </div>
        </div>
      )}

      {onWatchClick && (
        <button
          onClick={onWatchClick}
          className="mt-4 w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
          </svg>
          Watch how to say it
        </button>
      )}
    </div>
  );
}
