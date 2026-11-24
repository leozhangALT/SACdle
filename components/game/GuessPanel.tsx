'use client';

import { useState } from 'react';

interface Props {
  memberNames: string[];
  value: string;
  onChange: (v: string) => void;
  onGuess: () => void;
  onPass: () => void;
  disabled: boolean;
}

export default function GuessPanel({ memberNames, value, onChange, onGuess, onPass, disabled }: Props) {
  const sorted = [...memberNames].sort((a, b) => a.localeCompare(b));
  const [wrong, setWrong] = useState(false);

  function handleGuess() {
    const wasCorrect = onGuess();
    if (wasCorrect === false) {
      setWrong(true);
      setTimeout(() => setWrong(false), 1200);
    }
  }

  return (
    <div className="space-y-3">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
      >
        <option value="">— Who is this? —</option>
        {sorted.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      <div className="flex gap-3">
        <button
          onClick={handleGuess}
          disabled={disabled || !value}
          className={`flex-1 py-3 rounded-xl font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            wrong ? 'bg-red-600 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-500'
          }`}
        >
          Guess
        </button>
        <button
          onClick={onPass}
          disabled={disabled}
          className="flex-1 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-gray-300 transition-colors"
        >
          Pass / More clues
        </button>
      </div>
    </div>
  );
}
