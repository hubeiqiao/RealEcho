'use client';

import { useState, useCallback } from 'react';
import type { AssessmentResult, WordAssessment } from '@/lib/pronunciation-types';
import { getOverallFeedback, getScoreColor } from '@/lib/analysis-helpers';
import { TextHighlighter } from './TextHighlighter';
import { PhoneticCard } from './PhoneticCard';
import { YouGlishWidget } from './YouGlishWidget';
import { Button } from '@/components/ui/button';

interface AnalysisDashboardProps {
  result: AssessmentResult;
  onStartCoaching: () => void;
}

function ScoreCircle({ score, label }: { score: number; label: string }) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="56"
            cy="56"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx="56"
            cy="56"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={getScoreColor(score)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
            {score.toFixed(0)}
          </span>
        </div>
      </div>
      <span className="text-sm text-muted-foreground mt-2">{label}</span>
    </div>
  );
}

export function AnalysisDashboard({ result, onStartCoaching }: AnalysisDashboardProps) {
  const [selectedWord, setSelectedWord] = useState<WordAssessment | null>(null);
  const [showYouGlish, setShowYouGlish] = useState(false);

  const handleWordClick = useCallback((word: WordAssessment) => {
    setSelectedWord(word);
    setShowYouGlish(false);
  }, []);

  const handleWatchClick = useCallback(() => {
    setShowYouGlish(true);
  }, []);

  const handleCloseYouGlish = useCallback(() => {
    setShowYouGlish(false);
  }, []);

  return (
    <div className="space-y-6">
      {/* Overall Scores */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4 text-center">
          {getOverallFeedback(result.overallScore)}
        </h2>
        <div className="flex justify-center gap-8 flex-wrap">
          <ScoreCircle score={result.overallScore} label="Overall" />
          <ScoreCircle score={result.accuracyScore} label="Accuracy" />
          <ScoreCircle score={result.fluencyScore} label="Fluency" />
          {result.prosodyScore > 0 && (
            <ScoreCircle score={result.prosodyScore} label="Prosody" />
          )}
        </div>
      </div>

      {/* Problem Words */}
      {result.topProblemWords.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Top Problem Words</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {result.topProblemWords.map((word, index) => (
              <button
                key={`${word.word}-${index}`}
                onClick={() => handleWordClick(word)}
                className={`
                  p-4 rounded-lg border-2 text-left transition-all
                  ${selectedWord?.word === word.word && selectedWord?.offset === word.offset
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="font-bold text-lg">{word.word}</div>
                <div className={`text-sm ${getScoreColor(word.accuracyScore)}`}>
                  Score: {word.accuracyScore.toFixed(0)}%
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Text with highlighted words */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Your Speech</h3>
        <TextHighlighter
          words={result.words}
          selectedWord={selectedWord}
          onWordClick={handleWordClick}
        />
      </div>

      {/* Selected Word Detail */}
      {selectedWord && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Phonetic Breakdown</h3>
            <PhoneticCard
              word={selectedWord}
              onWatchClick={handleWatchClick}
            />
          </div>

          {showYouGlish && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Watch Pronunciation</h3>
              <YouGlishWidget
                word={selectedWord.word}
                onClose={handleCloseYouGlish}
              />
            </div>
          )}
        </div>
      )}

      {/* Start Coaching CTA */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white text-center">
        <h3 className="text-xl font-bold mb-2">Ready to Practice?</h3>
        <p className="mb-4 opacity-90">
          Start a coaching session with our AI tutor to practice your problem words.
        </p>
        <Button
          size="lg"
          variant="secondary"
          onClick={onStartCoaching}
          className="bg-white text-blue-600 hover:bg-gray-100"
        >
          Start Coaching Session
        </Button>
      </div>
    </div>
  );
}
