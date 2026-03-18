/**
 * Universal wrapper for API calls that auto-redirects to login on 401
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(input, init);

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const localeMatch = pathname.match(/^\/(vi|en)/);
      const locale = localeMatch ? localeMatch[1] : '';
      window.location.href = locale ? `/${locale}/login` : '/login';
    }
  }

  return res;
}

export const API_BASE_URL = '/api/proxy';
