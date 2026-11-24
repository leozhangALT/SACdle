import type { Clue } from '@/lib/types';

interface Props {
  clues: Clue[];
  revealedCount: number;
  totalClues: number;
  propertyLabels: Map<string, string>;
}

export default function ClueBoard({ clues, revealedCount, totalClues, propertyLabels }: Props) {
  const revealed = clues.slice(0, revealedCount);
  const hidden = Math.max(0, totalClues - revealedCount);

  return (
    <div className="space-y-3">
      {revealed.map((clue) => (
        <div key={clue.id} className="flex items-start gap-4 bg-gray-800 rounded-xl px-4 py-3 border border-gray-700">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 pt-0.5 w-36 flex-shrink-0 leading-tight">
            {propertyLabels.get(clue.property_id) ?? ''}
          </span>
          <span className="text-white font-medium leading-snug">{clue.value}</span>
        </div>
      ))}
      {Array.from({ length: hidden }).map((_, i) => (
        <div key={`hidden-${i}`} className="flex items-center gap-4 bg-gray-900 rounded-xl px-4 py-3 border border-gray-800">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-700 w-36 flex-shrink-0">
            Clue {revealedCount + i + 1}
          </span>
          <span className="text-gray-700 font-medium">???</span>
        </div>
      ))}
    </div>
  );
}
