export interface NBestPhoneme {
  phoneme: string;
  score: number;
}

export interface PhonemeAssessment {
  phoneme: string;
  accuracyScore: number;
  nbestPhonemes: NBestPhoneme[];
  offset: number;
  duration: number;
}

export interface SyllableAssessment {
  syllable: string;
  accuracyScore: number;
  offset: number;
  duration: number;
}

export type ErrorType =
  | 'None'
  | 'Mispronunciation'
  | 'UnexpectedBreak'
  | 'MissingBreak'
  | 'Monotone';

export interface WordAssessment {
  word: string;
  accuracyScore: number;
  errorType: ErrorType;
  phonemes: PhonemeAssessment[];
  syllables: SyllableAssessment[];
  offset: number;
  duration: number;
}

export interface AssessmentResult {
  recognizedText: string;
  overallScore: number;
  accuracyScore: number;
  fluencyScore: number;
  prosodyScore: number;
  words: WordAssessment[];
  topProblemWords: WordAssessment[];
}

export interface AssessmentState {
  isAssessing: boolean;
  result: AssessmentResult | null;
  error: string | null;
}

export interface RecordingState {
  isRecording: boolean;
  duration: number;
  audioBlob: Blob | null;
}
