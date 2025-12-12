'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CoachingSession } from '@/components/CoachingSession';
import type { AssessmentResult } from '@/lib/pronunciation-types';

export default function CoachPage() {
  const router = useRouter();
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get assessment result from sessionStorage
    const stored = sessionStorage.getItem('assessmentResult');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AssessmentResult;
        setResult(parsed);
      } catch {
        console.error('Failed to parse assessment result');
      }
    }
    setLoading(false);
  }, []);

  const handleEnd = () => {
    router.push('/analyze');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-4">
        <h1 className="text-2xl font-bold mb-4">No Assessment Found</h1>
        <p className="text-gray-400 mb-6 text-center">
          Please complete a pronunciation assessment first before starting a coaching session.
        </p>
        <Link
          href="/analyze"
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
        >
          Go to Assessment
        </Link>
      </div>
    );
  }

  const problemWords = result.topProblemWords.length > 0
    ? result.topProblemWords
    : result.words.slice(0, 3);

  return (
    <CoachingSession
      problemWords={problemWords}
      onEnd={handleEnd}
    />
  );
}
