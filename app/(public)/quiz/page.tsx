'use client';

// P3-9: "Find your perfect spot" — three taps that resolve to a pre-filled
// filter set. Entirely client-side, no schema, no persistence (PRD §5.3).

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { QUIZ, type QuizFilterPatch } from '@/config/quiz';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function QuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [patches, setPatches] = useState<QuizFilterPatch[]>([]);

  const question = QUIZ[step];

  const answer = (patch: QuizFilterPatch) => {
    const next = [...patches, patch];
    if (step + 1 < QUIZ.length) {
      setPatches(next);
      setStep(step + 1);
      return;
    }
    const params = new URLSearchParams();
    for (const p of next) {
      if (p.vibe) params.set('vibe', p.vibe);
      if (p.price) params.set('price', p.price);
      if (p.veg) params.set('veg', p.veg);
      if (p.craving) params.set('craving', p.craving);
    }
    params.set('from', 'quiz');
    router.push(`/search?${params.toString()}`);
  };

  return (
    <main className="mx-auto max-w-md space-y-6 px-4 py-10">
      <div>
        <h1 className="font-display text-paper text-2xl font-extrabold">
          Find your perfect spot
        </h1>
        <p className="text-text-muted mt-1 text-sm">
          {QUIZ.length} taps, no wrong answers.
        </p>
      </div>

      <div className="flex gap-1.5" aria-hidden>
        {QUIZ.map((_, i) => (
          <span
            key={i}
            className={`rounded-chip h-1 flex-1 ${
              i <= step ? 'bg-accent-primary' : 'bg-surface-raised'
            }`}
          />
        ))}
      </div>

      <Card className="craving-reveal space-y-4" key={question.id}>
        <h2 className="font-display text-paper text-lg font-bold">
          {question.question}
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {question.options.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => answer(opt.patch)}
              className="rounded-card border-border-hairline bg-surface-raised text-paper hover:border-accent-primary flex flex-col items-center gap-2 border p-4 text-sm transition-colors"
            >
              <span aria-hidden className="text-2xl">
                {opt.emoji}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      </Card>

      {step > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setStep(step - 1);
            setPatches(patches.slice(0, -1));
          }}
        >
          ← Back a step
        </Button>
      )}
    </main>
  );
}
