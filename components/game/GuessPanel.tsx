'use client';

import { useState } from 'react';

interface Props {
  memberNames: string[];
  onGuess: (name: string) => boolean;
  onPass: () => void;
  disabled: boolean;
  correct?: boolean;
  correctName?: string | null;
  failed?: boolean;
  guessedCorrectly?: Set<string>;
}

export default function GuessPanel({ memberNames, onGuess, onPass, disabled, correct, correctName, failed, guessedCorrectly }: Props) {
  const sorted = [...memberNames].sort((a, b) => a.localeCompare(b));
  const [flashWrong, setFlashWrong] = useState<string | null>(null);
  const [guessedWrong, setGuessedWrong] = useState<Set<string>>(new Set());

  function handleNameGuess(name: string) {
    const wasCorrect = onGuess(name);
    if (!wasCorrect && !failed) {
      setGuessedWrong((prev) => new Set(prev).add(name));
      setFlashWrong(name);
      setTimeout(() => setFlashWrong(null), 1200);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {sorted.map((name) => (
          <button
            key={name}
            onClick={() => handleNameGuess(name)}
            disabled={disabled || correct || failed || guessedWrong.has(name) || guessedCorrectly?.has(name)}
            className={`py-2.5 px-3 rounded-xl font-semibold text-sm transition-colors disabled:cursor-not-allowed ${
              flashWrong === name || guessedWrong.has(name)
                ? 'bg-red-900 text-red-300 border border-red-800'
                : correct && correctName === name
                ? 'bg-green-900 text-green-300 border border-green-800'
                : guessedCorrectly?.has(name)
                ? 'bg-gray-800 text-gray-600 opacity-30 border border-transparent'
                : correct || failed
                ? 'bg-gray-800 text-gray-600 opacity-30 border border-transparent'
                : 'bg-gray-800 hover:bg-indigo-600 hover:text-white text-gray-200 border border-gray-700 hover:border-indigo-500'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      <button
        onClick={onPass}
        disabled={disabled}
        className={`w-full py-3 rounded-xl font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          correct || failed
            ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
            : 'bg-gray-800 hover:bg-gray-700 text-gray-400 font-semibold'
        }`}
      >
        {correct || failed ? 'Continue →' : 'Pass / More clues'}
      </button>
    </div>
  );
}
