import { NextRequest, NextResponse } from 'next/server';

// GET /api/connections/callback — OAuth callback from Composio
// Composio handles the token exchange; we just redirect the user back.
export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return NextResponse.redirect(`${appUrl}/connections?connected=true`);
}
