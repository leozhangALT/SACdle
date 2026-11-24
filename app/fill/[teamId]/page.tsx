'use client';

import { useEffect, useState } from 'react';
import { supabase, fetchTeamProperties, fetchMembersWithClues } from '@/lib/supabase';
import type { TeamProperty, MemberWithClues, Clue } from '@/lib/types';

interface Props {
  params: Promise<{ teamId: string }>;
}

export default function FillPage({ params }: Props) {
  const [teamId, setTeamId] = useState('');
  const [teamName, setTeamName] = useState('');
  const [properties, setProperties] = useState<TeamProperty[]>([]);
  const [members, setMembers] = useState<MemberWithClues[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    params.then((p) => setTeamId(p.teamId));
  }, [params]);

  useEffect(() => {
    if (!teamId) return;
    async function load() {
      const [teamRes, props, mems] = await Promise.all([
        supabase.from('teams').select('name').eq('id', teamId).single(),
        fetchTeamProperties(teamId),
        fetchMembersWithClues(teamId),
      ]);
      if (!teamRes.data) { setError('Team not found.'); setLoading(false); return; }
      setTeamName(teamRes.data.name);
      setProperties(props);
      setMembers(mems);
      setLoading(false);
    }
    load();
  }, [teamId]);

  const incompleteMember = members.filter((m) =>
    properties.some((p) => !(m.clues ?? []).find((c: Clue) => c.property_id === p.id && c.value.trim()))
  );

  function handleSelectMember(memberId: string) {
    setSelectedMemberId(memberId);
    const member = members.find((m) => m.id === memberId);
    if (!member) return;
    const map: Record<string, string> = {};
    (member.clues ?? []).forEach((c: Clue) => { map[c.property_id] = c.value; });
    setValues(map);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const member = members.find((m) => m.id === selectedMemberId);
    if (!member) return;
    const existing = new Map((member.clues ?? []).map((c: Clue) => [c.property_id, c.id]));

    for (const prop of properties) {
      const val = (values[prop.id] ?? '').trim();
      const existingId = existing.get(prop.id);
      if (existingId) {
        if (val) await supabase.from('clues').update({ value: val }).eq('id', existingId);
        else await supabase.from('clues').delete().eq('id', existingId);
      } else if (val) {
        await supabase.from('clues').insert({ member_id: member.id, property_id: prop.id, value: val });
      }
    }

    setSaving(false);
    setDone(true);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500 animate-pulse">Loading…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </main>
    );
  }

  if (done) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="text-6xl">🎉</div>
          <h1 className="text-3xl font-black">You're all set!</h1>
          <p className="text-gray-400">Your answers have been saved.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-16">
      <div className="max-w-md mx-auto space-y-8">
        <div className="text-center space-y-1">
          <p className="text-gray-500 text-sm">Fill in your answers for</p>
          <h1 className="text-3xl font-black">{teamName}</h1>
        </div>

        {!selectedMemberId ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-400 text-center">Who are you?</p>
            {incompleteMember.length === 0 ? (
              <p className="text-center text-gray-500">All members have filled in their answers!</p>
            ) : (
              <div className="space-y-2">
                {incompleteMember.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleSelectMember(m.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-indigo-600 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-full bg-indigo-800 flex items-center justify-center font-bold flex-shrink-0">
                      {m.name[0]?.toUpperCase()}
                    </div>
                    <span className="font-semibold text-gray-200 group-hover:text-white transition-colors">
                      {m.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedMemberId('')}
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                ← Change
              </button>
              <span className="text-gray-400 text-sm">
                Filling in as <span className="text-white font-semibold">{members.find((m) => m.id === selectedMemberId)?.name}</span>
              </span>
            </div>

            <div className="space-y-3">
              {properties.map((prop) => (
                <div key={prop.id} className="space-y-1">
                  <label className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">
                    {prop.label}
                  </label>
                  <input
                    type="text"
                    placeholder="Your answer…"
                    value={values[prop.id] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [prop.id]: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 font-bold transition-colors"
            >
              {saving ? 'Saving…' : 'Submit answers'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
