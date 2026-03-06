import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(_request: NextRequest) {
  const res = NextResponse.json({ success: true });
  res.cookies.delete('token');
  return res;
}
