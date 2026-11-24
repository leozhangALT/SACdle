interface Props {
  score: number;
  round: number;
  total: number;
}

export default function ScoreBar({ score, round, total }: Props) {
  return (
    <div className="flex items-center justify-between bg-gray-900 rounded-xl px-5 py-3 border border-gray-800">
      <div className="text-sm text-gray-400">
        Round <span className="text-white font-bold">{round}</span>
        <span className="text-gray-600"> / {total}</span>
      </div>
      <div className="text-sm text-gray-400">
        Score{' '}
        <span className="text-indigo-400 font-black text-lg">{score}</span>
      </div>
    </div>
  );
}
