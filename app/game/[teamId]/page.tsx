'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchTeam, fetchMembersWithClues, fetchTeamProperties } from '@/lib/supabase';
import { calculatePoints } from '@/lib/scoring';
import type { Team, MemberWithClues, Clue, GamePhase, TeamProperty } from '@/lib/types';
import ClueBoard from '@/components/game/ClueBoard';
import GuessPanel from '@/components/game/GuessPanel';
import ScoreBar from '@/components/game/ScoreBar';
import EndScreen from '@/components/game/EndScreen';

interface RoundEntry {
  name: string;
  score: number;
  status: 'correct' | 'failed';
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface Props {
  params: Promise<{ teamId: string }>;
}

export default function GamePage({ params }: Props) {
  const [teamId, setTeamId] = useState('');
  const [team, setTeam] = useState<Team | null>(null);
  const [allMembers, setAllMembers] = useState<MemberWithClues[]>([]);
  const [propertyLabels, setPropertyLabels] = useState<Map<string, string>>(new Map());
  const [propertyPositions, setPropertyPositions] = useState<Map<string, number | null>>(new Map());
  const [phase, setPhase] = useState<GamePhase>('loading');
  const [error, setError] = useState('');

  const [queue, setQueue] = useState<MemberWithClues[]>([]);
  const [score, setScore] = useState(0);
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [roundHistory, setRoundHistory] = useState<RoundEntry[]>([]);

  const [currentMember, setCurrentMember] = useState<MemberWithClues | null>(null);
  const [shuffledClues, setShuffledClues] = useState<Clue[]>([]);
  const [revealedCount, setRevealedCount] = useState(2);
  const [lastResult, setLastResult] = useState<{ status: 'correct' | 'failed'; pts: number } | null>(null);
  const [correct, setCorrect] = useState(false);
  const [correctName, setCorrectName] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    params.then((p) => setTeamId(p.teamId));
  }, [params]);

  const loadGame = useCallback(async () => {
    if (!teamId) return;
    const [t, m, props] = await Promise.all([
      fetchTeam(teamId),
      fetchMembersWithClues(teamId),
      fetchTeamProperties(teamId),
    ]);
    if (!t) {
      setError('Team not found. Check the game code.');
      setPhase('loading');
      return;
    }
    if (!t.is_ready) {
      setError('This game is not available yet.');
      setPhase('loading');
      return;
    }
    setTeam(t);
    const labels = new Map<string, string>(
      (props as TeamProperty[]).map((p) => [p.id, p.label])
    );
    const positions = new Map<string, number | null>(
      (props as TeamProperty[]).map((p) => [p.id, p.position])
    );
    setPropertyLabels(labels);
    setPropertyPositions(positions);
    const playable = (m as MemberWithClues[]).filter((mem) => (mem.clues?.length ?? 0) >= 2);
    setAllMembers(playable);
    setPhase('idle');
  }, [teamId]);

  useEffect(() => {
    loadGame();
  }, [loadGame]);

  function startSession() {
    const shuffled = shuffle(allMembers);
    setQueue(shuffled);
    setScore(0);
    setRoundsPlayed(0);
    setRoundHistory([]);
    startRound(shuffled);
  }

  function startRound(memberQueue: MemberWithClues[]) {
    const [next, ...rest] = memberQueue;
    setQueue(rest);
    setCurrentMember(next);

    const clues = next.clues ?? [];
    const pinned = clues
      .filter((c) => propertyPositions.get(c.property_id) != null)
      .sort((a, b) => (propertyPositions.get(a.property_id) ?? 0) - (propertyPositions.get(b.property_id) ?? 0));
    const random = shuffle(clues.filter((c) => propertyPositions.get(c.property_id) == null));

    setShuffledClues([...pinned, ...random]);
    setRevealedCount(2);
    setLastResult(null);
    setCorrect(false);
    setCorrectName(null);
    setFailed(false);
    setPhase('playing');
  }

  function handleGuess(name: string): boolean {
    if (!currentMember) return false;
    if (name === currentMember.name) {
      const pts = calculatePoints(revealedCount);
      setScore((s) => s + pts);
      setLastResult({ status: 'correct', pts });
      setRoundHistory((h) => [...h, { name: currentMember.name, score: pts, status: 'correct' }]);
      setRoundsPlayed((r) => r + 1);
      setCorrect(true);
      setCorrectName(name);
      setRevealedCount(shuffledClues.length);
      return true;
    } else {
      const next = revealedCount + 1;
      if (next > shuffledClues.length) {
        setLastResult({ status: 'failed', pts: 0 });
        setRoundHistory((h) => [...h, { name: currentMember.name, score: 0, status: 'failed' }]);
        setRoundsPlayed((r) => r + 1);
        setFailed(true);
        setRevealedCount(shuffledClues.length);
        return true;
      }
      setRevealedCount(next);
      return false;
    }
  }

  function handlePass() {
    if (!currentMember) return;
    const next = revealedCount + 1;
    if (next > shuffledClues.length) {
      setLastResult({ status: 'failed', pts: 0 });
      setRoundHistory((h) => [...h, { name: currentMember.name, score: 0, status: 'failed' }]);
      setRoundsPlayed((r) => r + 1);
      setFailed(true);
      setRevealedCount(shuffledClues.length);
      return;
    }
    setRevealedCount(next);
  }

  function handleNext() {
    if (queue.length === 0) {
      setPhase('end');
    } else {
      startRound(queue);
    }
  }

  function handleRestart() {
    setPhase('idle');
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-red-400 text-lg">{error}</p>
          <a href="/" className="text-indigo-400 hover:underline text-sm">← Go home</a>
        </div>
      </main>
    );
  }

  if (phase === 'loading') {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500 animate-pulse">Loading game…</p>
      </main>
    );
  }

  if (phase === 'end') {
    return (
      <main className="min-h-screen bg-gray-950">
        <EndScreen totalScore={score} rounds={roundHistory} teamName={team?.name ?? ''} onRestart={handleRestart} />
      </main>
    );
  }

  if (phase === 'idle') {
    const playableCount = allMembers.length;
    return (
      <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 text-center space-y-6">
        <div className="text-5xl">🎭</div>
        <div>
          <h1 className="text-3xl font-black">{team?.name}</h1>
          <p className="text-gray-400 mt-1">
            {playableCount > 0
              ? `${playableCount} team member${playableCount !== 1 ? 's' : ''} ready to guess`
              : 'No members with clues yet — ask your admin to add some.'}
          </p>
        </div>
        {playableCount >= 2 ? (
          <button
            onClick={startSession}
            className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-lg transition-colors"
          >
            Start game →
          </button>
        ) : (
          <p className="text-amber-400 text-sm">Need at least 2 members with 2+ answers each to play.</p>
        )}
        <a href="/" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">← Home</a>
      </main>
    );
  }

  const memberNames = allMembers.map((m) => m.name);
  const isLast = queue.length === 0;

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-6">
      <div className="max-w-lg mx-auto space-y-5 pt-8">
        <ScoreBar
          score={score}
          round={roundsPlayed + (correct || failed ? 0 : 1)}
          total={allMembers.length}
        />

        <>
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
                Who is this person?
              </p>
            </div>

            <ClueBoard
              clues={shuffledClues}
              revealedCount={revealedCount}
              totalClues={shuffledClues.length}
              propertyLabels={propertyLabels}
            />

            <GuessPanel
              key={currentMember?.id}
              memberNames={memberNames}
              onGuess={handleGuess}
              onPass={correct || failed ? handleNext : handlePass}
              disabled={false}
              correct={correct}
              correctName={correctName}
              failed={failed}
            />

            {failed && currentMember && (
              <div className="rounded-xl bg-red-950 border border-red-800 px-5 py-4 text-center space-y-1">
                <p className="text-xs uppercase tracking-widest text-red-400 font-semibold">It was</p>
                <p className="text-2xl font-black text-white">{currentMember.name}</p>
              </div>
            )}

            {correct && currentMember && (
              <p className="text-center text-xs text-gray-600">
                {isLast ? 'last round!' : `${queue.length} left`}
              </p>
            )}

            {!correct && !failed && (
              <p className="text-center text-xs text-gray-600">
                {shuffledClues.length - revealedCount > 0
                  ? `${shuffledClues.length - revealedCount} more clue${shuffledClues.length - revealedCount !== 1 ? 's' : ''} available`
                  : 'All clues revealed — final chance!'}
              </p>
            )}
          </>
      </div>
    </main>
  );
}
