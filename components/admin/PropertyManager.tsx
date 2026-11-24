'use client';

import { useState } from 'react';
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

  const existingLabels = new Set(properties.map((p) => p.label.toLowerCase()));

  async function addProperty(label: string) {
    const trimmed = label.trim();
    if (!trimmed || existingLabels.has(trimmed.toLowerCase())) return;
    setLoading(true);
    await supabase.from('team_properties').insert({
      team_id: teamId,
      label: trimmed,
      position: properties.length,
    });
    setInput('');
    setLoading(false);
    onRefresh();
  }

  async function removeProperty(id: string) {
    await supabase.from('team_properties').delete().eq('id', id);
    onRefresh();
  }

  const availablePresets = PRESETS.filter((p) => !existingLabels.has(p.toLowerCase()));

  return (
    <div className="space-y-4">
      {/* Added properties */}
      {properties.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {properties.map((p) => (
            <span
              key={p.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-900/50 border border-indigo-700 text-sm text-indigo-200"
            >
              {p.label}
              <button
                onClick={() => removeProperty(p.id)}
                className="text-indigo-400 hover:text-red-400 transition-colors leading-none"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Custom input */}
      <form
        onSubmit={(e) => { e.preventDefault(); addProperty(input); }}
        className="flex gap-2"
      >
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
