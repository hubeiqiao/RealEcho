import type { WordAssessment, PhonemeAssessment } from './pronunciation-types';

export type ScoreLevel = 'good' | 'okay' | 'bad';

export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 80) return 'good';
  if (score >= 60) return 'okay';
  return 'bad';
}

export function getScoreColor(score: number): string {
  const level = getScoreLevel(score);
  switch (level) {
    case 'good':
      return 'text-green-600';
    case 'okay':
      return 'text-yellow-600';
    case 'bad':
      return 'text-red-600';
  }
}

export function getScoreBgColor(score: number): string {
  const level = getScoreLevel(score);
  switch (level) {
    case 'good':
      return 'bg-green-100 hover:bg-green-200';
    case 'okay':
      return 'bg-yellow-100 hover:bg-yellow-200';
    case 'bad':
      return 'bg-red-100 hover:bg-red-200';
  }
}

export function findWorstPhoneme(word: WordAssessment): PhonemeAssessment | null {
  if (!word.phonemes.length) return null;
  return word.phonemes.reduce((worst, current) =>
    current.accuracyScore < worst.accuracyScore ? current : worst
  );
}

export function getPhonemeComparison(phoneme: PhonemeAssessment): {
  expected: string;
  actual: string | null;
} {
  const actual =
    phoneme.nbestPhonemes.length > 0 && phoneme.nbestPhonemes[0].phoneme !== phoneme.phoneme
      ? phoneme.nbestPhonemes[0].phoneme
      : null;

  return {
    expected: phoneme.phoneme,
    actual,
  };
}

export function formatPhonemeIssue(word: WordAssessment): string | null {
  const worstPhoneme = findWorstPhoneme(word);
  if (!worstPhoneme || worstPhoneme.accuracyScore >= 70) return null;

  const comparison = getPhonemeComparison(worstPhoneme);
  if (comparison.actual) {
    return `/${comparison.actual}/ instead of /${comparison.expected}/`;
  }
  return `difficulty with /${comparison.expected}/`;
}

export function buildCoachingPrompt(problemWords: WordAssessment[]): string {
  const wordDetails = problemWords.map((w) => {
    const issue = formatPhonemeIssue(w);
    return issue ? `"${w.word}" (${issue})` : `"${w.word}"`;
  });

  return `Focus on these problem words: ${wordDetails.join(', ')}.
For each word:
1. Say it clearly for the user
2. Ask them to repeat
3. Give specific phoneme corrections based on the issues above
4. Use the word in a sentence for shadowing practice`;
}

export function buildFirstMessage(problemWords: WordAssessment[]): string {
  if (!problemWords.length) {
    return "Great job! Your pronunciation was quite good. Let's practice some commonly challenging words to make it even better.";
  }

  const firstWord = problemWords[0];
  const issue = formatPhonemeIssue(firstWord);

  if (issue) {
    return `I noticed you had some trouble with "${firstWord.word}" - it sounds like you said ${issue}. Let's work on that together. Listen carefully and repeat after me...`;
  }

  return `I noticed you had trouble with "${firstWord.word}". Let's practice that together. Listen carefully and repeat after me...`;
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function getOverallFeedback(score: number): string {
  if (score >= 90) return 'Excellent pronunciation!';
  if (score >= 80) return 'Great job! Minor improvements possible.';
  if (score >= 70) return 'Good effort! Some words need practice.';
  if (score >= 60) return 'Keep practicing! Focus on the highlighted words.';
  return 'Let\'s work on your pronunciation together.';
}
