'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { TeamProperty } from '@/lib/types';

const PRESETS = [
  'Favourite food',
  'Favourite movie',
  'Favourite TV show',
  'Favourite music artist',
  'Favourite sport',
  'Favourite holiday destination',
  'Favourite childhood cartoon',
  'Hobby',
  'Hidden talent',
  'Pet',
  'Most used emoji',
  'Morning or night person',
  'Guilty pleasure show',
  'Last concert attended',
  'Dream superpower',
];

interface Props {
  teamId: string;
  properties: TeamProperty[];
  onRefresh: () => void;
}

export default function PropertyManager({ teamId, properties, onRefresh }: Props) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [localOrdered, setLocalOrdered] = useState<TeamProperty[]>(() =>
    properties.filter((p) => p.position != null).sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  );
  const [localRandom, setLocalRandom] = useState<TeamProperty[]>(() =>
    properties.filter((p) => p.position == null)
  );

  // Sync when parent re-fetches
  const prevKey = useRef(properties.map((p) => `${p.id}:${p.position}`).join(','));
  const currentKey = properties.map((p) => `${p.id}:${p.position}`).join(',');
  if (prevKey.current !== currentKey) {
    prevKey.current = currentKey;
    setLocalOrdered(properties.filter((p) => p.position != null).sort((a, b) => (a.position ?? 0) - (b.position ?? 0)));
    setLocalRandom(properties.filter((p) => p.position == null));
  }

  // Track drag source and current hover target — no state mutation during drag
  const dragSrc = useRef<{ section: 'ordered' | 'random'; index: number } | null>(null);
  const dropTarget = useRef<{ section: 'ordered' | 'random'; index: number } | null>(null);

  const existingLabels = new Set(properties.map((p) => p.label.toLowerCase()));

  async function addProperty(label: string) {
    const trimmed = label.trim();
    if (!trimmed || existingLabels.has(trimmed.toLowerCase())) return;
    setLoading(true);
    await supabase.from('team_properties').insert({ team_id: teamId, label: trimmed, position: null });
    setInput('');
    setLoading(false);
    onRefresh();
  }

  async function removeProperty(id: string) {
    await supabase.from('team_properties').delete().eq('id', id);
    onRefresh();
  }

  function handleDragStart(e: React.DragEvent, section: 'ordered' | 'random', index: number) {
    dragSrc.current = { section, index };
    dropTarget.current = { section, index };
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e: React.DragEvent, section: 'ordered' | 'random', index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    dropTarget.current = { section, index };
  }

  function handleDrop(e: React.DragEvent, section: 'ordered' | 'random', index: number) {
    e.preventDefault();
    dropTarget.current = { section, index };
    commitMove();
  }

  function handleDragEndRoot(e: React.DragEvent) {
    // Only commit if drop happened inside our container (dropEffect = move)
    if (e.dataTransfer.dropEffect === 'move') {
      commitMove();
    }
    dragSrc.current = null;
    dropTarget.current = null;
  }

  function commitMove() {
    if (!dragSrc.current || !dropTarget.current) return;
    const { section: fromSection, index: fromIndex } = dragSrc.current;
    const { section: toSection, index: toIndex } = dropTarget.current;
    if (fromSection === toSection && fromIndex === toIndex) return;

    const newOrdered = [...localOrdered];
    const newRandom = [...localRandom];

    let moved: TeamProperty;
    if (fromSection === 'ordered') {
      [moved] = newOrdered.splice(fromIndex, 1);
    } else {
      [moved] = newRandom.splice(fromIndex, 1);
    }
    if (toSection === 'ordered') {
      newOrdered.splice(toIndex, 0, moved);
    } else {
      newRandom.splice(toIndex, 0, moved);
    }

    setLocalOrdered(newOrdered);
    setLocalRandom(newRandom);
    dragSrc.current = null;
    dropTarget.current = null;

    persistOrder(newOrdered, newRandom);
  }

  async function persistOrder(ordered: TeamProperty[], random: TeamProperty[]) {
    await Promise.all([
      ...ordered.map((p, i) => supabase.from('team_properties').update({ position: i }).eq('id', p.id)),
      ...random.map((p) => supabase.from('team_properties').update({ position: null }).eq('id', p.id)),
    ]);
    onRefresh();
  }

  const availablePresets = PRESETS.filter((p) => !existingLabels.has(p.toLowerCase()));
  const cardClass = 'flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 cursor-grab active:cursor-grabbing';

  return (
    <div className="space-y-4" onDragEnd={handleDragEndRoot}>
      {/* Ordered section */}
      <div
        className="space-y-2"
        onDragOver={(e) => {
          e.preventDefault();
          if (dragSrc.current && localOrdered.length === 0) handleDragOver(e, 'ordered', 0);
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (dragSrc.current && localOrdered.length === 0) handleDrop(e, 'ordered', 0);
        }}
      >
        <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">
          Ordered reveal {localOrdered.length > 0 ? `(${localOrdered.length})` : ''}
        </p>
        {localOrdered.length === 0 ? (
          <div className="px-3 py-4 rounded-xl border border-dashed border-gray-700 text-center text-xs text-gray-600">
            Drag properties here to set reveal order
          </div>
        ) : (
          localOrdered.map((p, i) => (
            <div
              key={p.id}
              draggable
              onDragStart={(e) => handleDragStart(e, 'ordered', i)}
              onDragOver={(e) => handleDragOver(e, 'ordered', i)}
              onDrop={(e) => handleDrop(e, 'ordered', i)}
              className={cardClass}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a1 1 0 000 2 1 1 0 000-2zM7 8a1 1 0 000 2 1 1 0 000-2zM7 14a1 1 0 000 2 1 1 0 000-2zM13 2a1 1 0 000 2 1 1 0 000-2zM13 8a1 1 0 000 2 1 1 0 000-2zM13 14a1 1 0 000 2 1 1 0 000-2z" />
              </svg>
              <span className="text-sm font-medium text-gray-200 flex-1">{p.label}</span>
              <span className="text-xs text-indigo-400 font-semibold">#{i + 1}</span>
              <button onClick={() => removeProperty(p.id)} className="text-gray-600 hover:text-red-400 transition-colors leading-none">✕</button>
            </div>
          ))
        )}
      </div>

      {/* Random section */}
      <div
        className="space-y-2"
        onDragOver={(e) => {
          e.preventDefault();
          if (dragSrc.current && localRandom.length === 0) handleDragOver(e, 'random', 0);
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (dragSrc.current && localRandom.length === 0) handleDrop(e, 'random', 0);
        }}
      >
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Random reveal {localRandom.length > 0 ? `(${localRandom.length})` : ''}
        </p>
        {localRandom.length === 0 ? (
          <div className="px-3 py-4 rounded-xl border border-dashed border-gray-700 text-center text-xs text-gray-600">
            Drag properties here to randomize
          </div>
        ) : (
          localRandom.map((p, i) => (
            <div
              key={p.id}
              draggable
              onDragStart={(e) => handleDragStart(e, 'random', i)}
              onDragOver={(e) => handleDragOver(e, 'random', i)}
              onDrop={(e) => handleDrop(e, 'random', i)}
              className={cardClass}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a1 1 0 000 2 1 1 0 000-2zM7 8a1 1 0 000 2 1 1 0 000-2zM7 14a1 1 0 000 2 1 1 0 000-2zM13 2a1 1 0 000 2 1 1 0 000-2zM13 8a1 1 0 000 2 1 1 0 000-2zM13 14a1 1 0 000 2 1 1 0 000-2z" />
              </svg>
              <span className="text-sm font-medium text-gray-200 flex-1">{p.label}</span>
              <button onClick={() => removeProperty(p.id)} className="text-gray-600 hover:text-red-400 transition-colors leading-none">✕</button>
            </div>
          ))
        )}
      </div>

      {/* Custom input */}
      <form onSubmit={(e) => { e.preventDefault(); addProperty(input); }} className="flex gap-2">
        <input
          type="text"
          placeholder="Add a custom property…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 font-semibold text-sm transition-colors whitespace-nowrap"
        >
          Add
        </button>
      </form>

      {/* Preset chips */}
      {availablePresets.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Suggestions:</p>
          <div className="flex flex-wrap gap-2">
            {availablePresets.map((preset) => (
              <button
                key={preset}
                onClick={() => addProperty(preset)}
                className="px-3 py-1.5 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm text-gray-300 transition-colors"
              >
                + {preset}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
