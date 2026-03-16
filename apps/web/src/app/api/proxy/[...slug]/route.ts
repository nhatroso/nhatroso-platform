import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5150';

async function handleProxy(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  const path = slug.join('/');

  // Notice we are prefixing the path with /api/v1/
  const endpoint = `/api/v1/${path}`;

  const token = request.cookies.get('token')?.value;

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers.set('Content-Type', contentType);
  }

  // Pass credentials downstream to Loco.rs
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = new URL(`${BACKEND_URL}${endpoint}`);
  url.search = request.nextUrl.search;

  try {
    const response = await fetch(url.toString(), {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method)
        ? undefined
        : await request.text(),
    });

    const resContentType = response.headers.get('content-type');
    let data;
    if (resContentType && resContentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      console.error(
        `[API Proxy] Route ${endpoint} returned status ${response.status}`,
        data,
      );
      const res = NextResponse.json(data, { status: response.status });

      // Auto-clear token if backend says it's invalid
      if (response.status === 401) {
        res.cookies.delete('token');
      }

      return res;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PATCH = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
