'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Team } from '@/lib/types';

interface SavedTeam { id: string; name: string; }

function getSavedTeams(): SavedTeam[] {
  try { return JSON.parse(localStorage.getItem('guess-who-teams') ?? '[]'); }
  catch { return []; }
}

export default function Home() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [myTeams, setMyTeams] = useState<SavedTeam[]>([]);

  useEffect(() => {
    supabase
      .from('teams')
      .select('*')
      .eq('is_public', true)
      .eq('is_ready', true)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .then(({ data }) => setTeams(data ?? []));
    setMyTeams(getSavedTeams());
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-gray-950">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo / title */}
        <div className="space-y-2">
          <div className="text-6xl">🎭</div>
          <h1 className="text-5xl font-black tracking-tight">
            <span style={{ color: '#0070F2' }}>SAC</span><span className="text-white">dle</span>
          </h1>
        </div>

        {/* Public teams */}
        {teams.length > 0 && (
          <div className="space-y-3 text-left">
            <p className="text-sm text-gray-500 text-center">Public Games</p>
            <div className="space-y-2">
              {teams.map((t) => (
                <a
                  key={t.id}
                  href={`/game/${t.id}`}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-indigo-600 transition-colors group"
                >
                  <span className="font-semibold text-gray-200 group-hover:text-white transition-colors">
                    {t.name}
                  </span>
                  <span className="text-xs text-indigo-500 font-semibold">Play →</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* My teams */}
        {myTeams.length > 0 && (
          <div className="space-y-3 text-left">
            <p className="text-sm text-gray-500 text-center">My Teams:</p>
            <div className="space-y-2">
              {myTeams.map((t) => (
                <div key={t.id} className="flex items-center gap-2">
                  <a
                    href={`/game/${t.id}`}
                    className="flex-1 flex items-center justify-between px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-indigo-600 transition-colors group"
                  >
                    <span className="font-semibold text-gray-200 group-hover:text-white transition-colors">
                      {t.name}
                    </span>
                    <span className="text-xs text-indigo-500 font-semibold">Play →</span>
                  </a>
                  <a
                    href={`/admin/${t.id}`}
                    title="Edit team"
                    className="p-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-indigo-600 text-gray-500 hover:text-indigo-400 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link
          href="/admin"
          className="block w-full py-3 rounded-xl border border-gray-700 hover:border-gray-500 font-semibold text-gray-300 hover:text-white transition-colors"
        >
          Create a team
        </Link>
      </div>
    </main>
  );
}
