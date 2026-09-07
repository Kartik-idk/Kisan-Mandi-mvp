import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  // Check if users exist first
  const { data: existing } = await supabase.from('users').select('*').limit(1);
  if (existing && existing.length > 0) {
    return NextResponse.json({ message: 'Users already seeded', existing });
  }

  // Insert agent
  const { data: agent, error: agentErr } = await supabase.from('users').insert({
    role: 'AGENT',
    name: 'Ramesh (Commission Agent)',
    phone_number: '9999999999'
  }).select().single();

  // Insert farmer
  const { data: farmer, error: farmerErr } = await supabase.from('users').insert({
    role: 'FARMER',
    name: 'Kishan (Farmer)',
    phone_number: '8888888888'
  }).select().single();

  return NextResponse.json({ agent, farmer, agentErr, farmerErr });
}
