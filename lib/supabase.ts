import { createClient } from '@supabase/supabase-js';
import type { MemberWithClues, Team, TeamProperty } from './types';

const url = 'https://whyylkgkhmhhtttdgjju.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoeXlsa2draG1oaHR0dGRnamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU1NDc3NzEsImV4cCI6MjExMTEyMzc3MX0.AdKtEnQNGHFkZePgZO5FN5RkEvni8J6skZrxGyiwX8M';

export const supabase = createClient(url, key);

export async function fetchTeam(teamId: string): Promise<Team | null> {
  const { data } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .eq('is_deleted', false)
    .single();
  return data;
}

export async function fetchTeamProperties(teamId: string): Promise<TeamProperty[]> {
  const { data } = await supabase
    .from('team_properties')
    .select('*')
    .eq('team_id', teamId)
    .order('position', { ascending: true });
  return data ?? [];
}

export async function fetchMembersWithClues(teamId: string): Promise<MemberWithClues[]> {
  const { data } = await supabase
    .from('members')
    .select('*, clues(*)')
    .eq('team_id', teamId)
    .order('created_at', { ascending: true });
  return (data ?? []) as MemberWithClues[];
}
