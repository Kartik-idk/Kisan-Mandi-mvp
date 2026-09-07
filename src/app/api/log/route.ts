import { NextResponse } from 'next/server';
export async function POST(req) {
  const body = await req.json();
  console.log("CLIENT LOG:", body);
  return NextResponse.json({ success: true });
}
