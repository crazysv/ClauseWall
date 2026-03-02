// Auth callback route - Handles OAuth callbacks from Supabase
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Handle OAuth callback logic here
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
