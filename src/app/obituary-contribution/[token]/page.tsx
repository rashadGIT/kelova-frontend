'use client';

import { use, useState, useEffect, useCallback } from 'react';
import {
  getContributionByToken,
  submitContribution,
  type ContributionPortalInfo,
} from '@/lib/api/obituary-contributions';
import { cn } from '@/lib/utils/cn';
import { useSpeechToText } from '@/hooks/use-speech-to-text';

const QUESTIONS = [
  {
    key: 'favoriteMemory' as const,
    label: "What's a memory of [Name] that makes you smile?",
    placeholder: 'Take your time — even a small moment is worth sharing.',
  },
  {
    key: 'description' as const,
    label: 'How would you describe [Name] to someone who never met them?',
    placeholder: 'What made them who they were?',
  },
  {
    key: 'loved' as const,
    label: 'What did [Name] love most in life?',
    placeholder: 'Their passions, hobbies, people, or places…',
  },
  {
    key: 'anythingElse' as const,
    label: "Anything else you'd like included in the obituary?",
    placeholder: 'Anything at all — no detail is too small.',
  },
];

function fillName(template: string, name: string) {
  return template.replace('[Name]', name);
}

export default function ObituaryContributionPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [info, setInfo] = useState<ContributionPortalInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [answers, setAnswers] = useState({
    favoriteMemory: '',
    description: '',
    loved: '',
    anythingElse: '',
  });

  const appendTranscript = useCallback((key: keyof typeof answers, text: string) => {
    setAnswers((prev) => ({ ...prev, [key]: prev[key] ? `${prev[key]} ${text}` : text }));
  }, []);

  const { isSupported, activeKey, toggle } = useSpeechToText({ onTranscript: appendTranscript });

  useEffect(() => {
    getContributionByToken(token)
      .then((data) => {
        setInfo(data);
        if (data.alreadySubmitted) setSubmitted(true);
      })
      .catch((err: Error) => {
        const status = err.message.includes('410')
          ? 'expired'
          : err.message.includes('404')
            ? 'not-found'
            : 'error';
        setError(status);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasAny = Object.values(answers).some((v) => v.trim());
    if (!hasAny) return;

    setSubmitting(true);
    try {
      await submitContribution(token, answers);
      setSubmitted(true);
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Shell>
        <p className="text-sm text-gray-500 text-center">Loading…</p>
      </Shell>
    );
  }

  if (error === 'expired') {
    return (
      <Shell>
        <h1 className="text-xl font-semibold text-gray-900 mb-3">Link Expired</h1>
        <p className="text-gray-600 leading-relaxed">
          This memory link has expired. Please contact the funeral home if you&apos;d
          like to still share your memories.
        </p>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <h1 className="text-xl font-semibold text-gray-900 mb-3">Link Not Found</h1>
        <p className="text-gray-600 leading-relaxed">
          This link doesn&apos;t appear to be valid. Please check your email and try
          again, or contact the funeral home directly.
        </p>
      </Shell>
    );
  }

  if (submitted) {
    return (
      <Shell>
        <div className="text-center">
          <div className="text-4xl mb-6">🕊️</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-3">
            Thank you for sharing your memories of {info?.deceasedName ?? 'your loved one'}.
          </h1>
          <p className="text-gray-600 leading-relaxed">
            Your words will help us create a meaningful obituary that truly
            reflects who they were.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mb-8">
        <p className="text-sm text-gray-500 mb-1">
          {info!.contactName} · {info!.relationship}
        </p>
        <h1 className="text-2xl font-semibold text-gray-900 leading-tight">
          Share your memories of {info!.deceasedName}
        </h1>
        <p className="mt-3 text-gray-600 leading-relaxed">
          We&apos;re preparing an obituary and would love to include your personal
          reflections. Answer as many or as few questions as you&apos;d like — there
          are no wrong answers.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {QUESTIONS.map((q) => (
          <div key={q.key}>
            <label className="block text-base font-medium text-gray-900 mb-2 leading-snug">
              {fillName(q.label, info!.deceasedName)}
            </label>
            <div className="relative">
              <textarea
                rows={4}
                value={answers[q.key]}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))
                }
                placeholder={q.placeholder}
                className={cn(
                  'w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none leading-relaxed',
                  isSupported && 'pr-12',
                )}
              />
              {isSupported && (
                <MicButton
                  isRecording={activeKey === q.key}
                  onClick={() => toggle(q.key)}
                />
              )}
            </div>
          </div>
        ))}

        <button
          type="submit"
          disabled={submitting || !Object.values(answers).some((v) => v.trim())}
          className="w-full bg-gray-900 text-white py-3 px-6 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting…' : 'Submit Your Memories'}
        </button>
      </form>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50 flex items-start justify-center py-16 px-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
        {children}
      </div>
    </div>
  );
}

function MicButton({ isRecording, onClick }: { isRecording: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      className={cn(
        'absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full transition-colors',
        isRecording
          ? 'bg-red-500 text-white animate-pulse'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
      )}
    >
      <MicIcon className="h-4 w-4" />
    </button>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v6a2 2 0 0 0 4 0V5a2 2 0 0 0-2-2zm6.364 8a1 1 0 0 1 .993.883L19.364 12A7.002 7.002 0 0 1 13 17.93V21h2a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h2v-3.07A7.002 7.002 0 0 1 4.636 12a1 1 0 0 1 1.993-.117L6.636 12a5 5 0 0 0 9.996.176L16.636 12A1 1 0 0 1 18.364 11z" />
    </svg>
  );
}
