import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
  locales: ['vi', 'en'],
  defaultLocale: 'vi',
  localePrefix: 'as-needed',
});

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token');
  const pathname = request.nextUrl.pathname;

  // Test if the path is an auth page or dashboard, accounting for optional locale prefixes
  const isAuthPage = /^\/(vi|en)?\/?(login|register)(\/.*)?$/.test(pathname);
  const isDashboardPage = /^\/(vi|en)?\/?dashboard(\/.*)?$/.test(pathname);

  if (!token && !isAuthPage && isDashboardPage) {
    // Redirect unauthenticated users to login
    const locale = pathname.match(/^\/(vi|en)/)?.[1] || '';
    const loginPath = locale ? `/${locale}/login` : '/login';
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  if (token && isAuthPage) {
    // Redirect authenticated users away from auth pages
    const locale = pathname.match(/^\/(vi|en)/)?.[1] || '';
    const dashboardPath = locale ? `/${locale}/dashboard` : '/dashboard';
    return NextResponse.redirect(new URL(dashboardPath, request.url));
  }

  // Fallback to next-intl middleware for locale routing
  return intlMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames, skipping api, _next, static files
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
