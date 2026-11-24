'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Props {
  teamId: string;
  onAdded: () => void;
}

export default function MemberForm({ teamId, onAdded }: Props) {
  const [name, setName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await supabase.from('members').insert({
      team_id: teamId,
      name: name.trim(),
      photo_url: photoUrl.trim() || null,
    });
    setName('');
    setPhotoUrl('');
    setLoading(false);
    onAdded();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm"
      />
      <input
        type="url"
        placeholder="Photo URL (optional)"
        value={photoUrl}
        onChange={(e) => setPhotoUrl(e.target.value)}
        className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm"
      />
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 font-semibold text-sm transition-colors whitespace-nowrap"
      >
        {loading ? 'Adding…' : 'Add member'}
      </button>
    </form>
  );
}
