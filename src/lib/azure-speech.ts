import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import type {
  AssessmentResult,
  WordAssessment,
  PhonemeAssessment,
  SyllableAssessment,
  ErrorType,
} from './pronunciation-types';

interface AzurePhoneme {
  Phoneme: string;
  PronunciationAssessment: {
    AccuracyScore: number;
    NBestPhonemes?: Array<{ Phoneme: string; Score: number }>;
  };
  Offset: number;
  Duration: number;
}

interface AzureSyllable {
  Syllable: string;
  PronunciationAssessment: {
    AccuracyScore: number;
  };
  Offset: number;
  Duration: number;
}

interface AzureWord {
  Word: string;
  PronunciationAssessment: {
    AccuracyScore: number;
    ErrorType: string;
  };
  Phonemes?: AzurePhoneme[];
  Syllables?: AzureSyllable[];
  Offset: number;
  Duration: number;
}

interface AzureNBest {
  PronunciationAssessment: {
    AccuracyScore: number;
    FluencyScore: number;
    ProsodyScore?: number;
    PronScore: number;
  };
  Words: AzureWord[];
}

interface AzureJsonResult {
  RecognitionStatus: string;
  DisplayText: string;
  NBest: AzureNBest[];
}

function getSpeechConfig(): SpeechSDK.SpeechConfig {
  const key = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY;
  const region = process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION;

  if (!key || !region) {
    throw new Error('Azure Speech credentials not configured');
  }

  const config = SpeechSDK.SpeechConfig.fromSubscription(key, region);
  config.speechRecognitionLanguage = 'en-US';
  return config;
}

function getPronunciationConfig(): SpeechSDK.PronunciationAssessmentConfig {
  const config = new SpeechSDK.PronunciationAssessmentConfig(
    '', // Empty reference text for unscripted/speaking mode
    SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark,
    SpeechSDK.PronunciationAssessmentGranularity.Phoneme,
    false // enableMiscue not applicable for unscripted
  );

  config.phonemeAlphabet = 'IPA';

  // Cast to access SDK properties not fully typed
  const configAny = config as unknown as {
    nbestPhonemeCount: number;
    enableProsodyAssessment: boolean;
  };
  configAny.nbestPhonemeCount = 5;
  configAny.enableProsodyAssessment = true;

  return config;
}

function parsePhoneme(phoneme: AzurePhoneme): PhonemeAssessment {
  return {
    phoneme: phoneme.Phoneme,
    accuracyScore: phoneme.PronunciationAssessment.AccuracyScore,
    nbestPhonemes: (phoneme.PronunciationAssessment.NBestPhonemes || []).map((p) => ({
      phoneme: p.Phoneme,
      score: p.Score,
    })),
    offset: phoneme.Offset,
    duration: phoneme.Duration,
  };
}

function parseSyllable(syllable: AzureSyllable): SyllableAssessment {
  return {
    syllable: syllable.Syllable,
    accuracyScore: syllable.PronunciationAssessment.AccuracyScore,
    offset: syllable.Offset,
    duration: syllable.Duration,
  };
}

function parseWord(word: AzureWord): WordAssessment {
  return {
    word: word.Word,
    accuracyScore: word.PronunciationAssessment.AccuracyScore,
    errorType: word.PronunciationAssessment.ErrorType as ErrorType,
    phonemes: (word.Phonemes || []).map(parsePhoneme),
    syllables: (word.Syllables || []).map(parseSyllable),
    offset: word.Offset,
    duration: word.Duration,
  };
}

function parseAzureResult(jsonResult: AzureJsonResult): AssessmentResult {
  const nbest = jsonResult.NBest[0];
  const words = nbest.Words.map(parseWord);

  // Find top 3 problem words (lowest accuracy scores)
  const topProblemWords = [...words]
    .filter((w) => w.errorType !== 'None' || w.accuracyScore < 80)
    .sort((a, b) => a.accuracyScore - b.accuracyScore)
    .slice(0, 3);

  return {
    recognizedText: jsonResult.DisplayText,
    overallScore: nbest.PronunciationAssessment.PronScore,
    accuracyScore: nbest.PronunciationAssessment.AccuracyScore,
    fluencyScore: nbest.PronunciationAssessment.FluencyScore,
    prosodyScore: nbest.PronunciationAssessment.ProsodyScore || 0,
    words,
    topProblemWords,
  };
}

export async function assessPronunciationFromBlob(
  audioBlob: Blob
): Promise<AssessmentResult> {
  const speechConfig = getSpeechConfig();
  const pronunciationConfig = getPronunciationConfig();

  // Convert blob to ArrayBuffer
  const arrayBuffer = await audioBlob.arrayBuffer();

  // Create push stream for audio input
  const pushStream = SpeechSDK.AudioInputStream.createPushStream(
    SpeechSDK.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1)
  );

  // Push audio data to stream
  pushStream.write(arrayBuffer);
  pushStream.close();

  const audioConfig = SpeechSDK.AudioConfig.fromStreamInput(pushStream);
  const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

  pronunciationConfig.applyTo(recognizer);

  return new Promise((resolve, reject) => {
    recognizer.recognizeOnceAsync(
      (result) => {
        if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
          const jsonString = result.properties.getProperty(
            SpeechSDK.PropertyId.SpeechServiceResponse_JsonResult
          );
          try {
            const jsonResult = JSON.parse(jsonString) as AzureJsonResult;
            resolve(parseAzureResult(jsonResult));
          } catch {
            reject(new Error('Failed to parse Azure response'));
          }
        } else if (result.reason === SpeechSDK.ResultReason.NoMatch) {
          reject(new Error('No speech detected. Please speak clearly and try again.'));
        } else {
          reject(new Error(`Recognition failed: ${result.reason}`));
        }
        recognizer.close();
      },
      (error) => {
        reject(new Error(`Recognition error: ${error}`));
        recognizer.close();
      }
    );
  });
}

export async function assessPronunciationFromMicrophone(): Promise<AssessmentResult> {
  const speechConfig = getSpeechConfig();
  const pronunciationConfig = getPronunciationConfig();
  const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
  const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

  pronunciationConfig.applyTo(recognizer);

  return new Promise((resolve, reject) => {
    recognizer.recognizeOnceAsync(
      (result) => {
        if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
          const jsonString = result.properties.getProperty(
            SpeechSDK.PropertyId.SpeechServiceResponse_JsonResult
          );
          try {
            const jsonResult = JSON.parse(jsonString) as AzureJsonResult;
            resolve(parseAzureResult(jsonResult));
          } catch {
            reject(new Error('Failed to parse Azure response'));
          }
        } else if (result.reason === SpeechSDK.ResultReason.NoMatch) {
          reject(new Error('No speech detected. Please speak clearly and try again.'));
        } else {
          reject(new Error(`Recognition failed: ${result.reason}`));
        }
        recognizer.close();
      },
      (error) => {
        reject(new Error(`Recognition error: ${error}`));
        recognizer.close();
      }
    );
  });
}

// Convert any audio file to PCM WAV format for Azure
async function convertAudioToPCM(file: File): Promise<ArrayBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new AudioContext({ sampleRate: 16000 });

  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Convert to mono 16-bit PCM at 16kHz
    const numSamples = audioBuffer.length;
    const wavBuffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(wavBuffer);

    // WAV header
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat (PCM)
    view.setUint16(22, 1, true); // NumChannels (mono)
    view.setUint32(24, 16000, true); // SampleRate
    view.setUint32(28, 32000, true); // ByteRate
    view.setUint16(32, 2, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample
    writeString(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    // Convert audio data to mono 16-bit PCM
    const channelData = audioBuffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    return wavBuffer;
  } finally {
    await audioContext.close();
  }
}

export async function assessPronunciationFromFile(
  file: File
): Promise<AssessmentResult> {
  const speechConfig = getSpeechConfig();
  const pronunciationConfig = getPronunciationConfig();

  // Convert audio file to PCM WAV format
  const wavBuffer = await convertAudioToPCM(file);

  // Create push stream for audio input
  const pushStream = SpeechSDK.AudioInputStream.createPushStream(
    SpeechSDK.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1)
  );

  // Push audio data (skip WAV header - 44 bytes)
  pushStream.write(wavBuffer.slice(44));
  pushStream.close();

  const audioConfig = SpeechSDK.AudioConfig.fromStreamInput(pushStream);
  const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

  pronunciationConfig.applyTo(recognizer);

  // Use continuous recognition for longer audio files
  const results: AssessmentResult[] = [];

  return new Promise((resolve, reject) => {
    recognizer.recognized = (_s, e) => {
      if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
        const jsonString = e.result.properties.getProperty(
          SpeechSDK.PropertyId.SpeechServiceResponse_JsonResult
        );
        try {
          const jsonResult = JSON.parse(jsonString) as AzureJsonResult;
          results.push(parseAzureResult(jsonResult));
        } catch {
          // Continue processing
        }
      }
    };

    recognizer.canceled = (_s, e) => {
      if (e.reason === SpeechSDK.CancellationReason.EndOfStream) {
        // Normal end - combine all results
        if (results.length > 0) {
          const combined: AssessmentResult = {
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
          };
          resolve(combined);
        } else {
          reject(new Error('No speech detected in the audio file.'));
        }
        recognizer.close();
      } else if (e.reason === SpeechSDK.CancellationReason.Error) {
        reject(new Error(`Recognition error: ${e.errorDetails}`));
        recognizer.close();
      }
    };

    recognizer.startContinuousRecognitionAsync(
      () => {},
      (err) => reject(new Error(`Failed to start recognition: ${err}`))
    );
  });
}

export function createContinuousRecognizer(
  onResult: (result: AssessmentResult) => void,
  onError: (error: Error) => void
): {
  start: () => Promise<void>;
  stop: () => Promise<void>;
} {
  const speechConfig = getSpeechConfig();
  const pronunciationConfig = getPronunciationConfig();
  const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
  const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

  pronunciationConfig.applyTo(recognizer);

  recognizer.recognized = (_s, e) => {
    if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
      const jsonString = e.result.properties.getProperty(
        SpeechSDK.PropertyId.SpeechServiceResponse_JsonResult
      );
      try {
        const jsonResult = JSON.parse(jsonString) as AzureJsonResult;
        onResult(parseAzureResult(jsonResult));
      } catch {
        onError(new Error('Failed to parse Azure response'));
      }
    }
  };

  recognizer.canceled = (_s, e) => {
    if (e.reason === SpeechSDK.CancellationReason.Error) {
      onError(new Error(`Recognition canceled: ${e.errorDetails}`));
    }
  };

  return {
    start: () =>
      new Promise((resolve, reject) => {
        recognizer.startContinuousRecognitionAsync(resolve, reject);
      }),
    stop: () =>
      new Promise((resolve, reject) => {
        recognizer.stopContinuousRecognitionAsync(
          () => {
            recognizer.close();
            resolve();
          },
          reject
        );
      }),
  };
}
