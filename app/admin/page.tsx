'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface SavedTeam {
  id: string;
  name: string;
}

const STORAGE_KEY = 'guess-who-teams';

function getSavedTeams(): SavedTeam[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveTeam(team: SavedTeam) {
  const existing = getSavedTeams().filter((t) => t.id !== team.id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([team, ...existing]));
}

export default function AdminHome() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>([]);

  useEffect(() => {
    setSavedTeams(getSavedTeams());
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: err } = await supabase
      .from('teams')
      .insert({ name: name.trim() })
      .select()
      .single();

    if (err || !data) {
      setError(err?.message ?? 'Failed to create team');
      setLoading(false);
      return;
    }

    saveTeam({ id: data.id, name: data.name });
    router.push(`/admin/${data.id}`);
  }

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-md w-full space-y-8">
        <div>
          <a href="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            ← Home
          </a>
          <h1 className="mt-4 text-3xl font-black">Create a team</h1>
          <p className="mt-1 text-gray-400">Give your team a name to get started.</p>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <input
            type="text"
            placeholder="e.g. Platform Engineering"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={80}
            className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed font-bold transition-colors"
          >
            {loading ? 'Creating…' : 'Create team →'}
          </button>
        </form>

        {/* Previously created teams */}
        {savedTeams.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Your teams on this device:</p>
            <div className="space-y-2">
              {savedTeams.map((t) => (
                <a
                  key={t.id}
                  href={`/admin/${t.id}`}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-indigo-600 transition-colors group"
                >
                  <span className="font-medium text-gray-200 group-hover:text-white transition-colors">
                    {t.name}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-600 group-hover:text-indigo-400 transition-colors flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
