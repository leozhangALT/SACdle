'use client';

import { useState, useEffect, useRef } from 'react';

interface Props {
  score: number;
  round: number;
  total: number;
}

export default function ScoreBar({ score, round, total }: Props) {
  const [displayScore, setDisplayScore] = useState(score);
  const [delta, setDelta] = useState<number | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const prevScore = useRef(score);

  useEffect(() => {
    if (score !== prevScore.current) {
      const diff = score - prevScore.current;
      prevScore.current = score;
      setDelta(diff);
      setAnimKey((k) => k + 1);
      // Delay score update slightly so the +pts appears first
      const t = setTimeout(() => {
        setDisplayScore(score);
        setTimeout(() => setDelta(null), 1200);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [score]);

  return (
    <div className="flex items-center justify-between bg-gray-900 rounded-xl px-5 py-3 border border-gray-800">
      <div className="text-sm text-gray-400">
        Round <span className="text-white font-bold">{round}</span>
        <span className="text-gray-600"> / {total}</span>
      </div>
      <div className="text-sm text-gray-400 flex items-center gap-1">
        Score{' '}
        <span className="relative inline-block">
          <span className="text-indigo-400 font-black text-lg">{displayScore}</span>
          {delta !== null && (
            <span
              key={animKey}
              className="absolute -top-8 left-1/2 text-green-400 font-black text-2xl whitespace-nowrap pointer-events-none"
              style={{ animation: 'scoreFloat 1.8s ease-out forwards', transform: 'translateX(-50%)' }}
            >
              +{delta}
            </span>
          )}
        </span>
      </div>
      <style>{`
        @keyframes scoreFloat {
          0%   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          20%  { opacity: 1; transform: translateX(-50%) translateY(-10px) scale(1.15); }
          70%  { opacity: 1; transform: translateX(-50%) translateY(-28px) scale(1.05); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-42px) scale(0.9); }
        }
      `}</style>
    </div>
  );
}
