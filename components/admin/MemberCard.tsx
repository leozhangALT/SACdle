'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { MemberWithClues, TeamProperty, Clue } from '@/lib/types';

interface Props {
  member: MemberWithClues;
  properties: TeamProperty[];
  onDeleted: () => void;
  onRefresh: () => void;
}

export default function MemberCard({ member, properties, onDeleted, onRefresh }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    (member.clues ?? []).forEach((c: Clue) => { map[c.property_id] = c.value; });
    return map;
  });

  async function saveProperty(propertyId: string) {
    const val = (values[propertyId] ?? '').trim();
    const existing = (member.clues ?? []).find((c: Clue) => c.property_id === propertyId);
    if (existing) {
      if (val) await supabase.from('clues').update({ value: val }).eq('id', existing.id);
      else await supabase.from('clues').delete().eq('id', existing.id);
    } else if (val) {
      await supabase.from('clues').insert({ member_id: member.id, property_id: propertyId, value: val });
    }
    onRefresh();
  }

  const filledCount = properties.filter((p) => (values[p.id] ?? '').trim()).length;
  const totalCount = properties.length;

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 cursor-pointer select-none" onClick={() => setExpanded((v) => !v)}>
        {member.photo_url ? (
          <img src={member.photo_url} alt={member.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-indigo-800 flex items-center justify-center text-white font-bold flex-shrink-0">
            {member.name[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{member.name}</p>
          <p className="text-sm text-gray-500">
            {filledCount}/{totalCount} answered
            {filledCount < totalCount && totalCount > 0 && (
              <span className="ml-2 text-amber-500 text-xs">⚠ incomplete</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-xs">{expanded ? '▲' : '▼'}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onDeleted(); }}
            className="px-3 py-1 rounded-lg text-sm bg-red-900/40 hover:bg-red-900/70 text-red-400 transition-colors"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Expanded answer form */}
      {expanded && (
        <div className="border-t border-gray-800 p-4 space-y-3">
          {properties.length === 0 && (
            <p className="text-sm text-gray-500">No properties defined yet — add some above first.</p>
          )}
          {properties.map((prop) => (
            <div key={prop.id} className="flex items-center gap-3">
              <span
                title={prop.label}
                className="text-xs font-semibold text-indigo-400 uppercase tracking-wide w-40 flex-shrink-0 truncate cursor-default"
              >
                {prop.label}
              </span>
              <input
                type="text"
                placeholder="Answer…"
                value={values[prop.id] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [prop.id]: e.target.value }))}
                onBlur={() => saveProperty(prop.id)}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
