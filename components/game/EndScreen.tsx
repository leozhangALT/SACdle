interface RoundEntry {
  name: string;
  score: number;
  status: 'correct' | 'failed';
}

interface Props {
  totalScore: number;
  rounds: RoundEntry[];
  teamName: string;
  onRestart: () => void;
}

export default function EndScreen({ totalScore, rounds, teamName, onRestart }: Props) {
  const correct = rounds.filter((r) => r.status === 'correct').length;
  const avg = rounds.length > 0 ? (totalScore / rounds.length).toFixed(1) : '0';

  return (
    <div className="max-w-md mx-auto space-y-6 py-10 px-4">
      <div className="text-center space-y-2">
        <div className="text-6xl">🏆</div>
        <h1 className="text-4xl font-black">{totalScore} pts</h1>
        <p className="text-gray-400">{teamName}</p>
        <div className="flex justify-center gap-6 text-sm text-gray-500 mt-2">
          <span>{correct}/{rounds.length} correct</span>
          <span>{avg} pts/round</span>
        </div>
      </div>

      {/* Round breakdown */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        {rounds.map((r, i) => (
          <div
            key={i}
            className={`flex items-center justify-between px-4 py-3 ${
              i < rounds.length - 1 ? 'border-b border-gray-800' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`text-sm ${r.status === 'correct' ? 'text-green-400' : 'text-gray-500'}`}>
                {r.status === 'correct' ? '✓' : '✗'}
              </span>
              <span className="font-medium">{r.name}</span>
            </div>
            <span className={`font-bold ${r.score > 0 ? 'text-indigo-400' : 'text-gray-600'}`}>
              {r.score > 0 ? `+${r.score}` : '0'}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={onRestart}
        className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold transition-colors"
      >
        Play again
      </button>
      <a
        href="/"
        className="block w-full py-3 rounded-xl border border-gray-700 hover:border-gray-500 font-semibold text-gray-300 hover:text-white transition-colors text-center"
      >
        Main menu
      </a>
    </div>
  );
}
