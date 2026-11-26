'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, fetchTeam, fetchMembersWithClues, fetchTeamProperties } from '@/lib/supabase';
import type { Team, MemberWithClues, TeamProperty } from '@/lib/types';
import MemberCard from '@/components/admin/MemberCard';
import MemberForm from '@/components/admin/MemberForm';
import PropertyManager from '@/components/admin/PropertyManager';

interface Props {
  params: Promise<{ teamId: string }>;
}

export default function AdminTeamPage({ params }: Props) {
  const [teamId, setTeamId] = useState('');
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<MemberWithClues[]>([]);
  const [properties, setProperties] = useState<TeamProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedFill, setCopiedFill] = useState(false);
  const [togglingPublic, setTogglingPublic] = useState(false);
  const [togglingReady, setTogglingReady] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [removedMember, setRemovedMember] = useState<MemberWithClues | null>(null);
  const removedMemberTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const meetsReadyRequirements =
    members.length >= 2 &&
    properties.length > 0 &&
    members.every((m) =>
      properties.every((p) =>
        (m.clues ?? []).some((c) => c.property_id === p.id && c.value.trim())
      )
    );

  useEffect(() => {
    params.then((p) => setTeamId(p.teamId));
  }, [params]);

  const refresh = useCallback(async () => {
    if (!teamId) return;
    const [t, m, p] = await Promise.all([
      fetchTeam(teamId),
      fetchMembersWithClues(teamId),
      fetchTeamProperties(teamId),
    ]);
    setTeam(t);
    setMembers(m);
    setProperties(p);
    setLoading(false);
  }, [teamId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function copyFillLink() {
    const url = `${window.location.origin}/fill/${teamId}`;
    navigator.clipboard.writeText(url);
    setCopiedFill(true);
    setTimeout(() => setCopiedFill(false), 2000);
  }

  function copyLink() {
    const url = `${window.location.origin}/game/${teamId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function togglePublic() {
    if (!team) return;
    setTogglingPublic(true);
    const { data } = await supabase
      .from('teams')
      .update({ is_public: !team.is_public })
      .eq('id', teamId)
      .select()
      .single();
    if (data) setTeam(data as Team);
    setTogglingPublic(false);
  }

  async function toggleReady() {
    if (!team) return;
    setTogglingReady(true);
    const { data } = await supabase
      .from('teams')
      .update({ is_ready: !team.is_ready })
      .eq('id', teamId)
      .select()
      .single();
    if (data) setTeam(data as Team);
    setTogglingReady(false);
  }

  async function saveName() {
    const trimmed = nameInput.trim();
    if (!trimmed || !team || trimmed === team.name) { setEditingName(false); return; }
    const { data } = await supabase
      .from('teams')
      .update({ name: trimmed })
      .eq('id', teamId)
      .select()
      .single();
    if (data) {
      setTeam(data as Team);
      try {
        const stored = JSON.parse(localStorage.getItem('guess-who-teams') ?? '[]');
        const updated = stored.map((t: { id: string; name: string }) =>
          t.id === teamId ? { ...t, name: trimmed } : t
        );
        localStorage.setItem('guess-who-teams', JSON.stringify(updated));
      } catch {}
    }
    setEditingName(false);
  }

  function handleRemoveMember(member: MemberWithClues) {
    if (removedMemberTimer.current) clearTimeout(removedMemberTimer.current);
    setMembers((prev) => prev.filter((m) => m.id !== member.id));
    setRemovedMember(member);
    removedMemberTimer.current = setTimeout(async () => {
      await supabase.from('members').delete().eq('id', member.id);
      setRemovedMember(null);
    }, 4000);
  }

  function handleUndoRemoveMember() {
    if (removedMemberTimer.current) clearTimeout(removedMemberTimer.current);
    if (removedMember) setMembers((prev) => [...prev, removedMember]);
    setRemovedMember(null);
  }

  async function deleteTeam() {
    setDeleting(true);
    await supabase.from('teams').update({ is_deleted: true }).eq('id', teamId);
    try {
      const stored = JSON.parse(localStorage.getItem('guess-who-teams') ?? '[]');
      localStorage.setItem('guess-who-teams', JSON.stringify(
        stored.filter((t: { id: string }) => t.id !== teamId)
      ));
    } catch {}
    setDeleting(false);
    setShowDeleteConfirm(false);
    setDeleted(true);
  }

  async function undoDelete() {
    await supabase.from('teams').update({ is_deleted: false }).eq('id', teamId);
    try {
      const stored = JSON.parse(localStorage.getItem('guess-who-teams') ?? '[]');
      const entry = { id: teamId, name: team?.name ?? '' };
      if (!stored.find((t: { id: string }) => t.id === teamId)) {
        localStorage.setItem('guess-who-teams', JSON.stringify([entry, ...stored]));
      }
    } catch {}
    setDeleted(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500 animate-pulse">Loading…</p>
      </main>
    );
  }

  if (!team) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-red-400">Team not found.</p>
      </main>
    );
  }

  const gameUrl = typeof window !== 'undefined' ? `${window.location.origin}/game/${teamId}` : '';

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <a href="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            ← Main menu
          </a>
          <div className="mt-3 flex items-start justify-between gap-4 flex-wrap">
            <div>
              {editingName ? (
                <form
                  onSubmit={(e) => { e.preventDefault(); saveName(); }}
                  className="flex items-center gap-2"
                >
                  <input
                    autoFocus
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onBlur={saveName}
                    className="text-3xl font-black bg-transparent border-b-2 border-indigo-500 outline-none text-white w-64"
                  />
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-black">{team.name}</h1>
                  <button
                    onClick={() => { setNameInput(team.name); setEditingName(true); }}
                    title="Rename team"
                    className="text-gray-600 hover:text-indigo-400 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                </div>
              )}
              <p className="text-gray-400 mt-1">{members.length} member{members.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleReady}
                  disabled={togglingReady || (!team.is_ready && !meetsReadyRequirements)}
                  title={!meetsReadyRequirements && !team.is_ready ? 'Need 2+ members with all properties filled' : undefined}
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-36 ${
                    team.is_ready
                      ? 'bg-indigo-700 hover:bg-indigo-600 text-white'
                      : 'bg-green-700 hover:bg-green-600 text-white'
                  }`}
                >
                  {team.is_ready ? 'Convert to Draft' : 'Publish Game'}
                </button>
                <button
                  onClick={togglePublic}
                  disabled={togglingPublic}
                  className="flex items-center justify-center px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 font-semibold text-sm transition-colors disabled:opacity-50 w-28"
                >
                  {team.is_public ? '🌐 Public' : '🔒 Private'}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyFillLink}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 font-semibold text-sm transition-colors w-36"
                >
                  {copiedFill ? 'Copied!' : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                      </svg>
                    Invite to Fill
                    </>
                  )}
                </button>
                <button
                  onClick={copyLink}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm transition-colors w-28"
                >
                  {copied ? 'Copied!' : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                      </svg>
                      Share
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          {gameUrl && (
            <p className="mt-2 text-xs text-gray-600 font-mono break-all">{gameUrl}</p>
          )}
        </div>

        {/* Step 1: Properties */}
        <section className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-3">
          <div>
            <h2 className="font-bold text-gray-200">Step 1 — Team properties</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              These are the questions every member will answer. Add them before filling in members.
            </p>
          </div>
          <PropertyManager teamId={teamId} properties={properties} onRefresh={refresh} />
        </section>

        {/* Step 2: Members */}
        <section className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-4">
          <div>
            <h2 className="font-bold text-gray-200">Step 2 — Add members</h2>
            <p className="text-sm text-gray-500 mt-0.5">Add each team member, then fill in their answers.</p>
          </div>
          <MemberForm teamId={teamId} onAdded={refresh} />
        </section>

        {/* Member cards */}
        <section className="space-y-4">
          {members.length === 0 && (
            <p className="text-gray-500 text-center py-4">No members yet — add someone above.</p>
          )}
          {members.map((m) => (
            <MemberCard
              key={m.id}
              member={m}
              properties={properties}
              onDeleted={() => handleRemoveMember(m)}
              onRefresh={refresh}
            />
          ))}
        </section>

        {/* Danger zone */}
        <section className="pt-4 border-t border-gray-800">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-sm text-red-500 hover:text-red-400 transition-colors"
          >
            Delete this team
          </button>
        </section>
      </div>

      {/* Confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h2 className="text-lg font-bold">Delete "{team.name}"?</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 font-semibold text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteTeam}
                disabled={deleting}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 font-semibold text-sm transition-colors"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member removed toast */}
      {removedMember && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-5 py-3 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50">
          <span className="text-sm text-gray-200">{removedMember.name} removed.</span>
          <button onClick={handleUndoRemoveMember} className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
            Undo
          </button>
        </div>
      )}

      {/* Undo toast */}
      {deleted && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-5 py-3 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50">
          <span className="text-sm text-gray-200">Team deleted.</span>
          <button onClick={undoDelete} className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
            Undo
          </button>
          <a href="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            Go home
          </a>
        </div>
      )}
    </main>
  );
}
