interface Props {
  status: 'correct' | 'failed';
  memberName: string;
  photoUrl: string | null;
  pointsEarned: number;
  cluesShown: number;
  isLast: boolean;
  onNext: () => void;
}

export default function RoundResult({ status, memberName, photoUrl, pointsEarned, cluesShown, isLast, onNext }: Props) {
  const isCorrect = status === 'correct';

  return (
    <div className={`rounded-2xl border p-6 text-center space-y-4 ${
      isCorrect
        ? 'bg-green-950 border-green-700'
        : 'bg-gray-900 border-gray-700'
    }`}>
      {/* Result banner */}
      <div className={`text-5xl font-black ${isCorrect ? 'text-green-400' : 'text-gray-400'}`}>
        {isCorrect ? '🎉' : '😬'}
      </div>
      <div>
        <p className={`text-lg font-bold ${isCorrect ? 'text-green-300' : 'text-gray-300'}`}>
          {isCorrect ? 'Correct!' : 'The answer was…'}
        </p>

        {/* Member reveal */}
        <div className="mt-3 flex items-center justify-center gap-3">
          {photoUrl ? (
            <img src={photoUrl} alt={memberName} className="w-14 h-14 rounded-full object-cover border-2 border-gray-700" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-indigo-800 flex items-center justify-center text-2xl font-black border-2 border-gray-700">
              {memberName[0]?.toUpperCase()}
            </div>
          )}
          <p className="text-2xl font-black">{memberName}</p>
        </div>
      </div>

      {/* Points */}
      <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
        <span>Clues shown: <strong className="text-white">{cluesShown}</strong></span>
        <span>Points: <strong className={isCorrect ? 'text-green-400' : 'text-gray-400'}>{isCorrect ? `+${pointsEarned}` : '0'}</strong></span>
      </div>

      <button
        onClick={onNext}
        className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold transition-colors"
      >
        {isLast ? 'See final score →' : 'Next round →'}
      </button>
    </div>
  );
}
